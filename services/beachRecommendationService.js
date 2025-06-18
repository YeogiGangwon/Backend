const weatherService = require('./weatherService');
const beaches = require('../data/beaches');

// 날씨 상태에 따른 점수 계산
const calculateWeatherScore = (forecast) => {
  let score = 100;
  
  // 강수량 (RN1) 체크
  const rain = forecast.find(f => f.category === 'RN1');
  if (rain && parseFloat(rain.fcstValue) > 0) {
    score -= 50;
  }

  // 하늘상태 (SKY) 체크 - 맑음(1), 구름많음(3), 흐림(4)
  const sky = forecast.find(f => f.category === 'SKY');
  if (sky) {
    if (sky.fcstValue === '4') score -= 20;
    else if (sky.fcstValue === '3') score -= 10;
  }

  // 기온 (TMP) 체크
  const temp = forecast.find(f => f.category === 'TMP');
  if (temp) {
    const temperature = parseInt(temp.fcstValue);
    if (temperature < 22) score -= 20;
    if (temperature > 35) score -= 15;
  }

  return Math.max(0, score);
};

// 기상특보 확인
const checkWarnings = async () => {
  const warnings = await weatherService.fetchWarningStatus();
  return warnings.some(warning => 
    warning.areaName.includes('강원') && 
    (warning.warningType.includes('태풍') || 
     warning.warningType.includes('풍랑') ||
     warning.warningType.includes('호우'))
  );
};

// 해수욕장 추천
exports.recommendBeaches = async () => {
  try {
    // 기상특보 확인
    const warnings = await weatherService.fetchWarningStatus();
    const hasWarning = warnings.some(warning => 
      warning.areaName.includes('강원') && 
      (warning.warningType.includes('태풍') || 
       warning.warningType.includes('풍랑') ||
       warning.warningType.includes('호우'))
    );

    if (hasWarning) {
      return {
        message: '현재 강원 지역에 기상특보가 발효 중입니다. 해수욕장 방문을 권장하지 않습니다.',
        recommendations: []
      };
    }

    // 각 해수욕장의 날씨 정보 수집 및 점수 계산
    const beachScores = await Promise.all(
      beaches.map(async (beach) => {
        const forecast = await weatherService.fetchShortTermForecast(
          beach.location.lat,
          beach.location.lon
        );
        
        const score = calculateWeatherScore(forecast);
        
        return {
          ...beach,
          score,
          forecast: forecast.filter(f => 
            ['TMP', 'SKY', 'RN1'].includes(f.category)
          ).reduce((acc, curr) => {
            acc[curr.category] = curr.fcstValue;
            return acc;
          }, {})
        };
      })
    );

    // 점수순으로 정렬
    const recommendations = beachScores
      .sort((a, b) => b.score - a.score)
      .map(beach => ({
        name: beach.name,
        description: beach.description,
        score: beach.score,
        weather: {
          temperature: `${beach.forecast.TMP}°C`,
          sky: beach.forecast.SKY === '1' ? '맑음' : 
               beach.forecast.SKY === '3' ? '구름많음' : '흐림',
          rain: `${beach.forecast.RN1}mm`
        }
      }));

    return {
      message: '날씨 상태에 따른 해수욕장 추천 결과입니다.',
      recommendations
    };
  } catch (error) {
    console.error('해수욕장 추천 중 오류 발생:', error);
    throw new Error('해수욕장 추천 서비스 오류가 발생했습니다.');
  }
};

// 특정 위치의 날씨 평가
exports.evaluateLocationWeather = async (lat, lon) => {
  try {
    // 기상특보 확인
    const hasWarning = await checkWarnings();
    
    if (hasWarning) {
      throw new Error('현재 강원 지역에 기상특보가 발효 중입니다. 해수욕장 방문이 위험할 수 있습니다.');
    }

    // 날씨 정보 수집 및 점수 계산
    const forecast = await weatherService.fetchShortTermForecast(lat, lon);
    const score = calculateWeatherScore(forecast);
    
    // 날씨 정보 추출
    const weatherInfo = forecast.filter(f => 
      ['TMP', 'SKY', 'RN1'].includes(f.category)
    ).reduce((acc, curr) => {
      acc[curr.category] = curr.fcstValue;
      return acc;
    }, {});

    return {
      isRecommended: score > 60,
      score,
      message: score > 60 ? '방문하기 좋은 날씨입니다.' : '날씨가 좋지 않아 방문을 추천하지 않습니다.',
      weather: {
        temperature: `${weatherInfo.TMP}°C`,
        sky: weatherInfo.SKY === '1' ? '맑음' : 
             weatherInfo.SKY === '3' ? '구름많음' : '흐림',
        rain: `${weatherInfo.RN1}mm`
      }
    };
  } catch (error) {
    console.error('날씨 평가 중 오류 발생:', error);
    throw error;
  }
}; 