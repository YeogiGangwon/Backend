const { fetchShortTermForecast, fetchWarningStatus } = require('../services/weatherService');
const analyzeWeather = require('../services/weatherAnalyzer');

exports.getWeatherDecision = async (req, res) => {
  const { lat, lon } = req.query;
  try {
    const forecast = await fetchShortTermForecast(lat, lon);
    const warning = await fetchWarningStatus();
    const result = analyzeWeather({ forecast, warning });
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '날씨 데이터 조회 실패' });
  }
};
