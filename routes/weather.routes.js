const express = require('express');
const router = express.Router();
const { getWeatherDecision } = require('../controllers/weather.controller');

router.get('/today', getWeatherDecision);

module.exports = router;
