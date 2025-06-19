const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const axios = require('axios');
const beaches = require('../data/beaches');

const TOUR_API_KEY = process.env.TOUR_API_KEY;
if (!TOUR_API_KEY) {
  console.error("TOUR_API_KEY가 .env 파일에 설정되지 않았습니다. 스크립트를 종료합니다.");
  process.exit(1);
}

const KOR_SERVICE_URL = 'http://apis.data.go.kr/B551011/KorService2';
const commonParams = {
  serviceKey: TOUR_API_KEY,
  MobileOS: 'ETC',
  MobileApp: 'HereGangwon',
  _type: 'json'
};

const sigunguCodeMap = {
  '강릉시': 1, '고성군': 2, '삼척시': 4, '속초시': 5, '양양군': 7
};

async function fetchTourApiDetailsForBeach(beach) {
  try {
    console.log(`\n[${beach.name}] 검색 시작...`);
    
    // 1. 키워드 검색으로 contentId 찾기
    const keyword = beach.name.includes('·') ? beach.name.split('·')[0] : beach.name;
    const sigunguCode = sigunguCodeMap[beach.city];
    let items = null;

    if (sigunguCode) {
      console.log(`  - 1차 검색: keyword="${keyword}", sigunguCode=${sigunguCode}`);
      const searchRes = await axios.get(`${KOR_SERVICE_URL}/searchKeyword2`, {
        params: { ...commonParams, areaCode: 32, sigunguCode, keyword, contentTypeId: 12, arrange: 'A' }
      });
      items = searchRes.data.response?.body?.items?.item;
      console.log(`  - 1차 검색 결과: ${items ? (Array.isArray(items) ? items.length : 1) : 0}개`);
    }

    if (!items) {
      console.log(`  - 2차 검색: keyword="${keyword}" (전체 강원도)`);
      const searchRes = await axios.get(`${KOR_SERVICE_URL}/searchKeyword2`, {
        params: { ...commonParams, areaCode: 32, keyword, contentTypeId: 12, arrange: 'A' }
      });
      items = searchRes.data.response?.body?.items?.item;
      console.log(`  - 2차 검색 결과: ${items ? (Array.isArray(items) ? items.length : 1) : 0}개`);
    }
    
    let foundItem = null;
    if (items) {
      const allItems = Array.isArray(items) ? items : [items];
      foundItem = 
        allItems.find(spot => spot.title.includes('해수욕장')) ||
        allItems.find(spot => spot.title.includes('해변'))   ||
        allItems.find(spot => spot.title.includes(beach.name.split('·')[0])) ||
        allItems[0]; // 최후의 수단으로 첫 번째 결과 사용
      
      if (foundItem) {
        console.log(`  - 선택된 항목: "${foundItem.title}" (contentId: ${foundItem.contentid})`);
      }
    }

    if (!foundItem) {
      console.warn(`  ❌ TourAPI에서 정보를 찾지 못했습니다.`);
      return {
        error: 'API에서 정보를 찾을 수 없음',
        overview: '정보를 찾을 수 없습니다.',
        addr1: '',
        images: []
      };
    }
    
    const { contentid, contenttypeid } = foundItem;

    // 2. 상세 정보 조회
    console.log(`  - 상세 정보 조회 중...`);
    
    // 공통 정보 조회 (개요, 주소, 이미지 등)
    const commonInfoRes = await axios.get(`${KOR_SERVICE_URL}/detailCommon2`, {
      params: { 
        ...commonParams, 
        contentId: contentid,
        overviewYN: 'Y',
        addrinfoYN: 'Y',
        mapinfoYN: 'Y',
        firstImageYN: 'Y'
      }
    });
    
    // 소개 정보 조회 (관광지 특화 정보)
    const introInfoRes = await axios.get(`${KOR_SERVICE_URL}/detailIntro2`, {
      params: { ...commonParams, contentId: contentid, contentTypeId: contenttypeid }
    });
    
    // 이미지 정보 조회
    const imageInfoRes = await axios.get(`${KOR_SERVICE_URL}/detailImage2`, {
      params: { ...commonParams, contentId: contentid, imageYN: 'Y', subImageYN: 'Y' }
    });

    // 응답 데이터 처리
    const commonData = commonInfoRes.data.response?.body?.items?.item?.[0] || {};
    const introData = introInfoRes.data.response?.body?.items?.item?.[0] || {};
    const imageItems = imageInfoRes.data.response?.body?.items?.item;
    
    console.log(`  - 공통 정보: overview=${!!commonData.overview}, addr1=${!!commonData.addr1}`);
    console.log(`  - 소개 정보: ${Object.keys(introData).length}개 필드`);
    console.log(`  - 이미지 정보: ${imageItems ? (Array.isArray(imageItems) ? imageItems.length : 1) : 0}개`);
    
    // 이미지 처리
    let images = [];
    if (imageItems) {
      images = (Array.isArray(imageItems) ? imageItems : [imageItems])
        .map(img => img.originimgurl)
        .filter(Boolean);
    }
    
    // 대표 이미지 추가
    if (commonData.firstimage && !images.includes(commonData.firstimage)) {
        images.unshift(commonData.firstimage);
    }

    // 3. 모든 정보 병합
    const result = {
      // 기본 검색 정보
      contentid: foundItem.contentid,
      contenttypeid: foundItem.contenttypeid,
      title: foundItem.title,
      
      // 공통 정보
      overview: commonData.overview || '상세 정보가 없습니다.',
      addr1: commonData.addr1 || '',
      addr2: commonData.addr2 || '',
      zipcode: commonData.zipcode || '',
      tel: commonData.tel || '',
      homepage: commonData.homepage || '',
      firstimage: commonData.firstimage || '',
      mapx: commonData.mapx || '',
      mapy: commonData.mapy || '',
      
      // 소개 정보 (관광지 특화)
      heritage1: introData.heritage1 || '0',
      heritage2: introData.heritage2 || '0',
      heritage3: introData.heritage3 || '0',
      infocenter: introData.infocenter || '',
      opendate: introData.opendate || '',
      restdate: introData.restdate || '',
      expguide: introData.expguide || '',
      expagerange: introData.expagerange || '',
      accomcount: introData.accomcount || '',
      useseason: introData.useseason || '',
      usetime: introData.usetime || '',
      parking: introData.parking || '',
      chkbabycarriage: introData.chkbabycarriage || '',
      chkpet: introData.chkpet || '',
      chkcreditcard: introData.chkcreditcard || '',
      
      // 이미지
      images: images
    };

    console.log(`  ✅ 완료 - overview: ${result.overview.length}자, images: ${result.images.length}개`);
    return result;

  } catch (error) {
    console.error(`[${beach.name}] 정보 조회 중 에러:`, error.response?.data?.response?.header || error.message);
    return {
      error: error.message,
      overview: '정보 조회 중 오류가 발생했습니다.',
      addr1: '',
      images: []
    };
  }
}

async function main() {
  console.log('해수욕장 상세 정보 조회를 시작합니다...');
  console.log(`API Key: ${TOUR_API_KEY.substring(0, 20)}...`);
  
  const detailedBeaches = [];

  for (const beach of beaches) {
    const tourInfo = await fetchTourApiDetailsForBeach(beach);
    detailedBeaches.push({
      ...beach, // 기존 로컬 정보
      tourInfo: tourInfo // TourAPI에서 가져온 상세 정보
    });
    // API 제한을 피하기 위해 약간의 딜레이 추가
    await new Promise(resolve => setTimeout(resolve, 300)); 
  }

  const outputPath = path.join(__dirname, '../../front/tour_gangwon_app/assets/data/beaches.json');
  
  fs.writeFileSync(
    outputPath,
    JSON.stringify(detailedBeaches, null, 2),
    'utf-8'
  );

  console.log(`\n✅ 정보 조회가 완료되었습니다. 총 ${detailedBeaches.length}개의 해수욕장 정보가`);
  console.log(`   ${outputPath} 파일에 저장되었습니다.`);
  
  // 간단한 통계 출력
  const successCount = detailedBeaches.filter(b => !b.tourInfo.error).length;
  const imageCount = detailedBeaches.reduce((sum, b) => sum + (b.tourInfo.images?.length || 0), 0);
  console.log(`   - 성공: ${successCount}/${detailedBeaches.length}개`);
  console.log(`   - 총 이미지: ${imageCount}개`);
}

main(); 