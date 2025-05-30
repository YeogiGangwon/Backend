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
  const { x, y } = latLonToGrid(lat, lon);
  const now = new Date();
  const { baseDate, baseTime } = calculateBaseTime(now);
  const url = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

  const res = await axios.get(url, {
    params: {
      serviceKey: process.env.KMA_SHORT_KEY,
      dataType: 'JSON',
      numOfRows: 1000,
      pageNo: 1,
      base_date: baseDate,
      base_time: baseTime,
      nx: x,
      ny: y,
    }
  });
  return res.data.response.body.items.item;
};

// 기상특보
exports.fetchWarningStatus = async () => {
  const url = 'https://apis.data.go.kr/1360000/WthrWrnInfoService/getWthrWarningList';
  const res = await axios.get(url, {
    params: {
      serviceKey: process.env.KMA_WARNING_KEY,
      dataType: 'JSON',
      numOfRows: 100,
      pageNo: 1,
    }
  });
  return res.data.response.body.items.item;
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
