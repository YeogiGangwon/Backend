const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  location: {
    name: String,      // 관광지명 (ex. 강릉)
    lat: Number,       // 위도
    lon: Number,       // 경도
    nx: Number,        // 격자 X
    ny: Number         // 격자 Y
  },
  current: {           // 실시간 날씨 (초단기실황)
    temperature: Number,
    windSpeed: Number,
    precipitationType: Number,
    sky: Number,
    rainfall: Number,
    humidity: Number,
    lightning: Number,
    baseDate: String,
    baseTime: String
  },
  forecast: [          // 단기예보 (1~2일)
    {
      fcstDate: String,    // 예보 날짜
      fcstTime: String,    // 예보 시간
      temperature: Number,
      windSpeed: Number,
      precipitationType: Number,
      sky: Number,
      rainfall: Number,
      humidity: Number,
      lightning: Number,
      precipitationProb: Number
    }
  ],
  midForecast: {       // 중기예보 (3~10일)
    maxTemp: [ { date: String, value: Number } ],
    minTemp: [ { date: String, value: Number } ],
    rainProb: [ { date: String, value: Number } ],
    weather: [ { date: String, description: String } ]
  },
  warning: [           // 기상특보
    {
      type: String,         // 태풍, 호우, 강풍, 대설 등
      status: String,       // 발효, 해제
      region: String,
      startTime: String,
      endTime: String
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Weather', weatherSchema);
