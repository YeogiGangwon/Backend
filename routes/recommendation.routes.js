// routes/recommendation.routes.js
const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');

// GET /api/recommendations/beaches/ranked
router.get('/beaches/ranked', recommendationController.getRankedBeaches);

module.exports = router;