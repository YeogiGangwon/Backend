function analyzeWeather({ forecast, warning }) {
    const rainOrSnow = forecast.find(i => i.category === 'PTY' && i.fcstValue !== '0');
    const strongWind = forecast.find(i => i.category === 'WSD' && parseFloat(i.fcstValue) >= 10);
    const dangerWarning = warning && warning.length > 0;
  
    if (dangerWarning || rainOrSnow || strongWind) {
      return { recommended: false, reason: '실외활동 위험' };
    }
    return { recommended: true, reason: '실외 가능' };
  }
  
  module.exports = analyzeWeather;
  