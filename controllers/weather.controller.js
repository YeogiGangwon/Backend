const { fetchShortTermForecast } = require('../services/weatherService');

exports.getTodayWeather = async (req, res) => {
  const { lat, lon } = req.query;
  try {
    const data = await fetchShortTermForecast(lat, lon);
    res.status(200).json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '날씨 조회 실패' });
  }
};
