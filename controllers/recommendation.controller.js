// controllers/recommendation.controller.js
const recommendationService = require('../services/recommendationService');

exports.getRankedBeaches = async (req, res) => {
  try {
    const rankedBeaches = await recommendationService.getRankedBeachRecommendations();
    res.status(200).json(rankedBeaches);
  } catch (err) {
    // 구체적인 에러 메시지를 로그로 출력하여 원인 파악을 용이하게 합니다.
    console.error('해수욕장 순위 추천 실패:', err.message); 
    console.error(err.stack); // 전체 에러 스택을 확인하려면 추가
    res.status(500).json({ message: '추천 목록을 가져오는데 실패했습니다.' });
  }
};