// routes/congestion.routes.js
const express = require('express');
const router = express.Router();
const congestionController = require('../controllers/congestion.controller');

// GET /api/congestion/ 요청 시, getLatestCongestion 컨트롤러 함수를 실행
router.get('/', congestionController.getLatestCongestion);

// GET /api/congestion/:cameraId 요청 시, 특정 CCTV의 혼잡도 정보 조회
router.get('/:cameraId', congestionController.getCongestionById);

module.exports = router;