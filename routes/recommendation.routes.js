const express = require('express');
const router = express.Router();
const beachRecommendationService = require('../services/beachRecommendationService');

// 해수욕장 추천 API
router.get('/beaches', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const recommendations = await beachRecommendationService.evaluateLocationWeather(lat, lon);
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            message: '해수욕장 추천을 가져오는데 실패했습니다.'
        });
    }
});

module.exports = router; 