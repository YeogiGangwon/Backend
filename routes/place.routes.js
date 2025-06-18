const express = require('express');
const router = express.Router();
const placeController = require('../controllers/place.controller');

// 카카오맵 API 장소 검색
router.get('/search-kakao', placeController.searchKakaoPlaces);

// 카카오맵에서 선택한 장소 저장
router.post('/from-kakao', placeController.createPlaceFromKakao);

// 일반 관광지 수동 등록(카카오에 정보 없을 시)
router.post('/', placeController.createPlace);

// 전체 관광지 조회 (theme 필터링 지원)
router.get('/', placeController.filterPlacesByTheme);

// 키워드 기반 관광지 검색
router.get('/search', placeController.searchPlaces);

// 관광지 개별 상세 조회
router.get('/:id', placeController.getPlaceById);

module.exports = router;
