// services/recommendationService.js
const weatherService = require('./weatherService');
const beaches = require('../data/beaches');
const beachCctvMap = require('../data/beachCctvMap');
const Congestion = require('../models/congestion.model');

// 날씨 점수 계산
function calculateWeatherScore(forecast) {
  let score = 0;
  const sky = forecast.find(f => f.category === 'SKY')?.fcstValue; // 하늘상태: 1(맑음), 3(구름많음), 4(흐림)
  const pty = forecast.find(f => f.category === 'PTY')?.fcstValue; // 강수형태: 0(없음), 1(비), 2(비/눈), 3(눈), 4(소나기)
  const tmp = parseInt(forecast.find(f => f.category === 'TMP')?.fcstValue); // 기온

  if (pty === '0') score += 40; // 비 안오면 40점
  if (sky === '1') score += 30; // 맑으면 30점
  else if (sky === '3') score += 15; // 구름 많으면 15점

  if (tmp >= 23 && tmp <= 32) score += 30; // 23~32도 사이면 30점

  return score;
}

exports.getRankedBeachRecommendations = async () => {
  // 1. 모든 해수욕장의 최신 혼잡도 정보를 한 번에 가져오기
  const latestCongestionData = await Congestion.aggregate([
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$cameraId', latest: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$latest' } }
  ]);
  
  // 찾기 쉽도록 Map 형태로 변환
  const congestionMap = new Map(latestCongestionData.map(c => [c.cameraId, c]));

  // 2. 각 해수욕장별로 날씨/혼잡도 점수 계산
  const recommendationPromises = beaches.map(async (beach) => {
    // 날씨 정보 가져오기
    const forecast = await weatherService.fetchShortTermForecast(beach.location.lat, beach.location.lon);
    const weatherScore = calculateWeatherScore(forecast);

    // 혼잡도 정보 가져오기
    const cctvId = beachCctvMap[beach.name];
    const congestionInfo = congestionMap.get(cctvId);
    // 혼잡도 점수는 낮을수록 좋으므로, 100에서 빼서 점수화 (높을수록 좋게)
    const congestionScore = congestionInfo ? 100 - congestionInfo.score : 50; // 정보 없으면 50점

    // 최종 점수 (가중치: 날씨 60%, 혼잡도 40%)
    const totalScore = Math.round(weatherScore * 0.6 + congestionScore * 0.4);

    return {
      name: beach.name,
      description: beach.description,
      totalScore,
      weather: {
        score: weatherScore,
        temp: `${forecast.find(f => f.category === 'TMP')?.fcstValue}°C`,
        sky: forecast.find(f => f.category === 'SKY')?.fcstValue === '1' ? '맑음' : '구름많음/흐림'
      },
      congestion: {
        score: congestionScore,
        level: congestionInfo?.level || '정보없음',
        personCount: congestionInfo?.personCount
      }
    };
  });

  // 3. 모든 해수욕장의 점수 계산이 끝날 때까지 기다리기
  const recommendations = await Promise.all(recommendationPromises);

  // 4. 최종 점수(totalScore)가 높은 순으로 정렬
  recommendations.sort((a, b) => b.totalScore - a.totalScore);

  return recommendations;
};
