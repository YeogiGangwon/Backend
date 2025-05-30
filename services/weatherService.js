const axios = require('axios');
const latLonToGrid = require('../utils/coordinate');

// 단기예보 발표시각 계산
const calculateBaseTime = (now) => {
  const hour = now.getHours();
  
  // 발표시각은 02:10, 05:10, 08:10, 11:10, 14:10, 17:10, 20:10, 23:10
  const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
  
  // 현재 시각 이전의 가장 최근 발표시각 찾기
  let baseTime = baseTimes[baseTimes.length - 1];
  for (let i = 0; i < baseTimes.length; i++) {
    if (hour < baseTimes[i]) {
      baseTime = baseTimes[i - 1] || 23;
      break;
    }
  }
  
  // 발표시각이 23시이고 현재가 다음날 새벽인 경우 어제 날짜 사용
  const baseDate = baseTime === 23 && hour < 2 
    ? new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
    : now.toISOString().slice(0, 10).replace(/-/g, '');
    
  return {
    baseDate,
    baseTime: String(baseTime).padStart(2, '0') + '00'
  };
};

// 단기예보 (1~2일)
exports.fetchShortTermForecast = async (lat, lon) => {
  try {
    const { x, y } = latLonToGrid(lat, lon);
    const now = new Date();
    const { baseDate, baseTime } = calculateBaseTime(now);
    const url = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

    console.log('API 요청 정보:', {
      baseDate,
      baseTime,
      x,
      y,
      serviceKey: process.env.KMA_SHORT_KEY?.substring(0, 10) + '...' // API 키 일부만 로깅
    });

    const res = await axios.get(url, {
      params: {
        serviceKey: decodeURIComponent(process.env.KMA_SHORT_KEY), // URL 디코딩된 키 사용
        dataType: 'JSON',
        numOfRows: 1000,
        pageNo: 1,
        base_date: baseDate,
        base_time: baseTime,
        nx: x,
        ny: y,
      }
    });

    if (!res.data.response?.body?.items?.item) {
      console.error('API 응답:', res.data);
      throw new Error('날씨 API 응답 형식이 올바르지 않습니다.');
    }

    return res.data.response.body.items.item;
  } catch (error) {
    console.error('단기예보 API 에러:', error.response?.data || error.message);
    throw new Error('단기예보 조회 중 오류가 발생했습니다.');
  }
};

// 기상특보
exports.fetchWarningStatus = async () => {
  const url = 'https://apis.data.go.kr/1360000/WthrWrnInfoService/getWthrWrnList';
  const res = await axios.get(url, {
    params: {
      serviceKey: process.env.KMA_WARNING_KEY,
      dataType: 'JSON',
      numOfRows: 100,
      pageNo: 1,
      stnId: 108 // 강원도 지역 코드
    }
  });
  
  if (!res.data.response?.body?.items?.item) {
    return []; // 기상특보가 없는 경우 빈 배열 반환
  }
  return Array.isArray(res.data.response.body.items.item) 
    ? res.data.response.body.items.item 
    : [res.data.response.body.items.item];
};

// 중기예보 (3~10일)
exports.fetchMidTermForecast = async (regionCode) => {
  // regionCode: 강원 영서 (11D10301), 강원 영동 (11D20401) 등
  const urlTa = 'https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa';
  const urlLand = 'https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst';

  const now = new Date();
  const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  const baseTime = now.getHours() < 18 ? '0600' : '1800'; // 중기예보는 06시/18시만 있음

  // 중기 기온
  const tempRes = await axios.get(urlTa, {
    params: {
      serviceKey: process.env.KMA_MID_KEY,
      dataType: 'JSON',
      regId: regionCode,
      tmFc: `${baseDate}${baseTime}`
    }
  });

  // 중기 날씨, 강수확률
  const landRes = await axios.get(urlLand, {
    params: {
      serviceKey: process.env.KMA_MID_KEY,
      dataType: 'JSON',
      regId: regionCode,
      tmFc: `${baseDate}${baseTime}`
    }
  });

  return {
    temperature: tempRes.data.response.body.items.item,
    weather: landRes.data.response.body.items.item
  };
};

// 날씨 분석
exports.analyzeWeather = ({ forecast, warning }) => {
  // 기상특보 확인
  if (warning && warning.length > 0) {
    const gangwonWarnings = warning.filter(w => 
      w.areaName.includes('강원') && 
      (w.warningType.includes('태풍') || 
       w.warningType.includes('풍랑') ||
       w.warningType.includes('호우'))
    );
    
    if (gangwonWarnings.length > 0) {
      return {
        isRecommended: false,
        message: '현재 강원 지역에 기상특보가 발효 중입니다.',
        warnings: gangwonWarnings.map(w => w.warningType)
      };
    }
  }

  // 날씨 데이터 분석
  const currentWeather = forecast.reduce((acc, item) => {
    acc[item.category] = item.fcstValue;
    return acc;
  }, {});

  // 점수 계산
  let score = 100;
  
  // 강수량
  if (parseFloat(currentWeather.RN1) > 0) {
    score -= 50;
  }

  // 하늘상태
  if (currentWeather.SKY === '4') score -= 20;
  else if (currentWeather.SKY === '3') score -= 10;

  // 기온
  const temp = parseInt(currentWeather.TMP);
  if (temp < 22) score -= 20;
  if (temp > 35) score -= 15;

  return {
    isRecommended: score > 60,
    score,
    weather: {
      temperature: `${currentWeather.TMP}°C`,
      sky: currentWeather.SKY === '1' ? '맑음' : 
           currentWeather.SKY === '3' ? '구름많음' : '흐림',
      rain: `${currentWeather.RN1}mm`
    },
    message: score > 60 ? '날씨가 좋습니다.' : '날씨가 좋지 않습니다.'
  };
};
