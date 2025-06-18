const axios = require('axios');
const Place = require('../models/place.model');

// 카카오맵 API를 통해 장소 검색
exports.searchKakaoPlaces = async (req, res) => {
  const { query } = req.query;
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

  if (!query) {
    return res.status(400).json({ message: '검색어를 입력하세요.' });
  }

  try {
    const result = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`
      },
      params: { query }
    });
    res.status(200).json(result.data.documents);
  } catch (error) {
    console.error('오류:', error.response?.data || error.message || error);
    res.status(500).json({ message: '카카오 장소 검색 실패' });
  }
};

// 카카오맵 장소를 관광지로 저장
exports.createPlaceFromKakao = async (req, res) => {
  try {
    const { name, address, category, x, y } = req.body;

    if (!name || !address || !x || !y) {
      return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
    }

    // 중복 방지 (이름 + 주소 기준)
    const existing = await Place.findOne({ name, address });
    if (existing) {
      return res.status(200).json({ message: '이미 등록된 장소입니다.', place: existing });
    }

   const place = new Place({
    name,
    address,
    category: category || '기타',
    coordinates: {
    latitude: parseFloat(y),
    longitude: parseFloat(x)
  }
  });


    await place.save();
    res.status(201).json({ message: '카카오 장소 저장 완료!', place });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '카카오 장소 저장 실패' });
  }
};

// 관광지 등록 (수동 입력 시)
exports.createPlace = async (req, res) => {
  try {
    const place = new Place(req.body);
    await place.save();
    res.status(201).json({ message: '관광지 등록 완료!', place });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '관광지 등록 실패' });
  }
};

// 관광지 전체 조회
exports.getAllPlaces = async (req, res) => {
  try {
    const places = await Place.find();
    res.status(200).json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '관광지 조회 실패' });
  }
};

// 관광지 상세 조회
exports.getPlaceById = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ message: '해당 관광지를 찾을 수 없습니다.' });
    res.status(200).json(place);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '관광지 상세 조회 실패' });
  }
};

// 키워드 기반 관광지 검색
exports.searchPlaces = async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ message: '검색어를 입력하세요.' });
  }
  try {
    const places = await Place.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } }
      ]
    });
    res.status(200).json(places);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '관광지 검색 실패' });
  }
};

// 테마 기반 관광지 필터링
exports.filterPlacesByTheme = async (req, res) => {
  const { theme } = req.query;
  try {
    const query = theme ? { category: theme } : {};
    const places = await Place.find(query);
    res.status(200).json(places);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '관광지 필터링 실패' });
  }
};
