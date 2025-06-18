// controllers/recommendation.controller.js
const recommendationService = require('../services/recommendationService');

exports.getRankedBeaches = async (req, res) => {
  try {
    const rankedBeaches = await recommendationService.getRankedBeachRecommendations();
    res.status(200).json(rankedBeaches);
  } catch (err) {
    console.error('해수욕장 순위 추천 실패:', err);
    res.status(500).json({ message: '추천 목록을 가져오는데 실패했습니다.' });
  }
};