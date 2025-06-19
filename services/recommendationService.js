// services/recommendationService.js (최종 완성 버전)
const axios = require('axios');
const weatherService = require('./weatherService');
const beaches = require('../data/beaches');
const beachCctvMap = require('../data/beachCctvMap');
const Congestion = require('../models/congestion.model');

// 강원도 주요 시/군 코드 매핑
const sigunguCodeMap = {
  '강릉시': 1,
  '고성군': 2,
  '삼척시': 4,
  '속초시': 5,
  '양양군': 7
};

function calculateWeatherScore(forecast) {
  let score = 0;
  const sky = forecast.find(f => f.category === 'SKY')?.fcstValue;
  const pty = forecast.find(f => f.category === 'PTY')?.fcstValue;
  const tmp = parseInt(forecast.find(f => f.category === 'TMP')?.fcstValue);

  if (pty === '0') score += 40;
  if (sky === '1') score += 30;
  else if (sky === '3') score += 15;
  if (tmp >= 23 && tmp <= 32) score += 30;

  return score;
}

exports.getRankedBeachRecommendations = async () => {
  console.log('[추천 서비스] 해수욕장 추천 요청 시작');
  
  const latestCongestionData = await Congestion.aggregate([
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$cameraId', latest: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$latest' } }
  ]);
  
  const congestionMap = new Map(latestCongestionData.map(c => [c.cameraId, c]));
  console.log(`[추천 서비스] 혼잡도 데이터 로드 완료: ${congestionMap.size}개`);

  const recommendationPromises = beaches.map(async (beach) => {
    try {
      const forecast = await weatherService.fetchShortTermForecast(beach.location.lat, beach.location.lon);
      const weatherScore = calculateWeatherScore(forecast);

      const cctvId = beachCctvMap[beach.name];
      const congestionInfo = congestionMap.get(cctvId);
      const congestionScore = congestionInfo ? 100 - congestionInfo.score : 50;

      const totalScore = Math.round(weatherScore * 0.6 + congestionScore * 0.4);

      // 개발 환경에서는 Tour API 호출을 건너뛰고 기본값 사용
      let tourApiDetails;
      if (process.env.NODE_ENV === 'development' || !process.env.TOUR_API_KEY) {
        console.log(`[추천 서비스] ${beach.name} - Tour API 호출 건너뜀 (개발 모드)`);
        tourApiDetails = {
          overview: `${beach.name}에 대한 상세 정보입니다.`,
          address: beach.city || '',
          mainImage: '',
          images: []
        };
      } else {
        tourApiDetails = await fetchTourApiDetails(beach);
      }

      return {
        name: beach.name,
        description: beach.description,
        totalScore,
        weather: {
          score: weatherScore,
          temp: `${forecast.find(f => f.category === 'TMP')?.fcstValue}°C`,
          sky: forecast.find(f => f.category === 'SKY')?.fcstValue === '1' ? '맑음' : '구름많음/흐림'
        },
        congestion: {
          score: congestionScore,
          level: congestionInfo?.level || '정보없음',
          personCount: congestionInfo?.personCount
        },
        tourInfo: tourApiDetails
      };
    } catch (error) {
      console.error(`[추천 서비스] ${beach.name} 처리 중 에러:`, error.message);
      // 에러 발생 시에도 기본 데이터 반환
      return {
        name: beach.name,
        description: beach.description,
        totalScore: 50, // 기본 점수
        weather: {
          score: 50,
          temp: '20°C',
          sky: '정보없음'
        },
        congestion: {
          score: 50,
          level: '정보없음',
          personCount: null
        },
        tourInfo: {
          overview: '정보를 불러올 수 없습니다.',
          address: '',
          mainImage: '',
          images: []
        }
      };
    }
  });

  console.log('[추천 서비스] 모든 해수욕장 데이터 처리 시작');
  const recommendations = await Promise.all(recommendationPromises);
  recommendations.sort((a, b) => b.totalScore - a.totalScore);
  console.log(`[추천 서비스] 추천 완료: ${recommendations.length}개 해수욕장 정렬됨`);
  
  return recommendations;
};

// services/recommendationService.js 의 fetchTourApiDetails 함수

async function fetchTourApiDetails(beach) {
  const TOUR_API_KEY = process.env.TOUR_API_KEY;
  const KOR_SERVICE_URL = 'http://apis.data.go.kr/B551011/KorService2';

  const commonParams = {
    serviceKey: TOUR_API_KEY,
    MobileOS: 'ETC',
    MobileApp: 'HereGangwon',
    _type: 'json'
  };

  // axios 인스턴스에 타임아웃 설정
  const axiosInstance = axios.create({
    timeout: 10000 // 10초 타임아웃
  });

  try {
    const keyword = beach.name.includes('·') ? beach.name.split('·')[0] : beach.name;
    const sigunguCode = sigunguCodeMap[beach.city];
    let items = null;

    // 1단계: 시/군/구 코드로 정밀 검색
    if (sigunguCode) {
      console.log(`[TourAPI] 1차 검색 (정밀): areaCode=32, sigunguCode=${sigunguCode}, keyword="${keyword}"`);
      const searchRes = await axiosInstance.get(`${KOR_SERVICE_URL}/searchKeyword2`, {
        params: { ...commonParams, areaCode: 32, sigunguCode, keyword, contentTypeId: 12, arrange: 'A' }
      });
      items = searchRes.data.response?.body?.items?.item;
    }

    // 2단계: 1차 검색 실패 시, 강원도 전체에서 광역 검색 (Fallback)
    if (!items) {
      console.warn(`[TourAPI] 1차 검색 실패. 2차 검색 (광역) 실행: keyword="${keyword}"`);
      const searchRes = await axiosInstance.get(`${KOR_SERVICE_URL}/searchKeyword2`, {
        params: { ...commonParams, areaCode: 32, keyword, contentTypeId: 12, arrange: 'A' }
      });
      items = searchRes.data.response?.body?.items?.item;
    }

    // 3단계: 검색된 결과에서 최적의 항목 필터링
    let foundItem = null;
    if (items) {
      const allItems = Array.isArray(items) ? items : [items];
      foundItem = 
        allItems.find(spot => spot.title.includes('해수욕장')) ||
        allItems.find(spot => spot.title.includes('해변'))   ||
        allItems.find(spot => spot.title.includes(beach.name));
    }

    if (!foundItem) {
      console.warn(`[TourAPI] 최종 검색 실패: "${beach.name}" 정보를 찾지 못했습니다.`);
      return { overview: '관련 관광 정보를 찾을 수 없습니다.', address: '', mainImage: '', images: [] };
    }
    
    const { contentid } = foundItem;
    console.log(`[TourAPI] 최종 선택: ${foundItem.title} (contentId: ${contentid})`);

    // 4단계: 상세 정보 조회 (타임아웃 적용)
    const commonInfoPromise = axiosInstance.get(`${KOR_SERVICE_URL}/detailCommon2`, {
      params: { ...commonParams, contentId: contentid }
    });
    const imageInfoPromise = axiosInstance.get(`${KOR_SERVICE_URL}/detailImage2`, {
      params: { ...commonParams, contentId: contentid, imageYN: 'Y' }
    });
    
    const [commonRes, imageRes] = await Promise.all([commonInfoPromise, imageInfoPromise]);

    const commonData = commonRes.data.response?.body?.items?.item?.[0];
    const imageData = imageRes.data.response?.body?.items?.item;

    const tourInfo = {
      overview: commonData?.overview || '상세 정보가 없습니다.',
      address: commonData?.addr1 || '',
      mainImage: commonData?.firstimage || '',
      images: []
    };

    if (imageData) {
      const images = Array.isArray(imageData) ? imageData : [imageData];
      tourInfo.images = images.map(img => img.originimgurl).filter(Boolean);
    }
    if (tourInfo.mainImage && !tourInfo.images.includes(tourInfo.mainImage)) {
      tourInfo.images.unshift(tourInfo.mainImage);
    }
    
    return tourInfo;

  } catch (error) {
    console.error(`[TourAPI] '${beach.name}' 정보 조회 중 에러:`, error.message);
    return { overview: '정보를 불러오는 중 오류가 발생했습니다.', address: '', mainImage: '', images: [] };
  }
}