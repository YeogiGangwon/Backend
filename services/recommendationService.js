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
  const latestCongestionData = await Congestion.aggregate([
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$cameraId', latest: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$latest' } }
  ]);
  
  const congestionMap = new Map(latestCongestionData.map(c => [c.cameraId, c]));

  const recommendationPromises = beaches.map(async (beach) => {
    const forecast = await weatherService.fetchShortTermForecast(beach.location.lat, beach.location.lon);
    const weatherScore = calculateWeatherScore(forecast);

    const cctvId = beachCctvMap[beach.name];
    const congestionInfo = congestionMap.get(cctvId);
    const congestionScore = congestionInfo ? 100 - congestionInfo.score : 50;

    const totalScore = Math.round(weatherScore * 0.6 + congestionScore * 0.4);

    const tourApiDetails = await fetchTourApiDetails(beach);

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
  });

  const recommendations = await Promise.all(recommendationPromises);
  recommendations.sort((a, b) => b.totalScore - a.totalScore);
  return recommendations;
};

async function fetchTourApiDetails(beach) {
  const TOUR_API_KEY = process.env.TOUR_API_KEY;
  const KOR_SERVICE_URL = 'http://apis.data.go.kr/B551011/KorService2';

  const commonParams = {
    serviceKey: TOUR_API_KEY,
    MobileOS: 'ETC',
    MobileApp: 'HereGangwon',
    _type: 'json'
  };

  try {
    const keyword = beach.name.includes('·') ? beach.name.split('·')[0] : beach.name;
    const sigunguCode = sigunguCodeMap[beach.city];

    if (!sigunguCode) {
      console.warn(`[TourAPI] ${beach.city}의 시군구 코드를 찾을 수 없습니다.`);
      return { overview: '지역 코드가 없어 관광 정보를 조회할 수 없습니다.', address: '', mainImage: '', images: [] };
    }
    
    const searchRes = await axios.get(`${KOR_SERVICE_URL}/searchKeyword2`, {
      params: { ...commonParams, areaCode: 32, sigunguCode, keyword, contentTypeId: 12, arrange: 'A' }
    });
    
    let foundItem = null;
    const items = searchRes.data.response?.body?.items?.item;

    if (items) {
      const allItems = Array.isArray(items) ? items : [items];
      foundItem = 
        allItems.find(spot => spot.title.includes('해수욕장')) ||
        allItems.find(spot => spot.title.includes('해변'))   ||
        allItems.find(spot => spot.title.includes(beach.name));
    }

    if (!foundItem) {
      console.warn(`[TourAPI] 검색 실패: "${beach.name}"에 해당하는 해수욕장 정보를 찾지 못했습니다.`);
      return { overview: '관련 관광 정보를 찾을 수 없습니다.', address: '', mainImage: '', images: [] };
    }
    
    const { contentid } = foundItem;

    const commonInfoPromise = axios.get(`${KOR_SERVICE_URL}/detailCommon2`, {
      params: { ...commonParams, contentId: contentid, overviewYN: 'Y', addrinfoYN: 'Y', defaultYN: 'Y', firstImageYN: 'Y' }
    });
    const imageInfoPromise = axios.get(`${KOR_SERVICE_URL}/detailImage2`, {
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