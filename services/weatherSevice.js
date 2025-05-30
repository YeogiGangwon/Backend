const axios = require('axios');
const latLonToGrid = require('../utils/coordinate');

// 단기예보 (1~2일)
exports.fetchShortTermForecast = async (lat, lon) => {
  const { x, y } = latLonToGrid(lat, lon);
  const now = new Date();
  const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  const baseTime = '0500'; // 최근 발표 시각 (고정값, 동적 계산 필요)
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
