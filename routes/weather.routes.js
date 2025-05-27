const express = require('express');
const router = express.Router();
const { getTodayWeather } = require('../controllers/weatherController');

router.get('/today', getTodayWeather);

module.exports = router;
