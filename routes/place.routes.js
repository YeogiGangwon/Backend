const express = require('express');
const router = express.Router();
const placeController = require('../controllers/place.controller');

// 관광지 등록
router.post('/', placeController.createPlace);

// 전체 목록 조회
router.get('/', placeController.getAllPlaces);

// 개별 상세 조회
router.get('/:id', placeController.getPlaceById);

module.exports = router;
