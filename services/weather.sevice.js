const axios = require('axios');
const latLonToGrid = require('../utils/coordinate');

// 단기예보
exports.fetchShortTermForecast = async (lat, lon) => {
  const { x, y } = latLonToGrid(lat, lon);
  const baseDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const baseTime = '0500'; // 발표 시각(5시 기준)
  const url = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0'
  const res = await axios.get(url, {
    params: {
      serviceKey: process.env.KMA_SHORT_API_KEY,
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

// 중기예보 
exports.fetchMidTermForecast = async (lat, lon) => {
  const {x, y} = latLonToGrid(lat, lon);
  const baseDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
}