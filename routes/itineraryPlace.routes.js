const express = require('express');
const router = express.Router();
const itineraryPlaceController = require('../controllers/itineraryPlace.controller');

// 일정에 장소 추가
router.post('/', itineraryPlaceController.addPlaceToItinerary);

// 특정 일정의 장소 목록 조회
router.get('/:itinerary_id', itineraryPlaceController.getPlacesByItinerary);

// 일정 내 장소 정보 수정 (메모, 소요시간, 순서 등)
router.patch('/:id', itineraryPlaceController.updateItineraryPlace);

// 일정 내 장소 제거
router.delete('/:id', itineraryPlaceController.removePlaceFromItinerary);

module.exports = router;
