const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itinerary.controller');

// 일정 생성
router.post('/', itineraryController.createItinerary);

// 일정 전체 조회 (사용자별)
router.get('/user/:user_id', itineraryController.getUserItineraries);

// 일정 상세 조회
router.get('/:id', itineraryController.getItineraryById);

// 일정 수정 (제목, 날짜 등)
router.patch('/:id', itineraryController.updateItinerary);

// 일정 삭제
router.delete('/:id', itineraryController.deleteItinerary);

module.exports = router;
