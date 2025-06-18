const axios = require('axios');

const BASE_URL = 'https://apis.data.go.kr/B551011/Durunubi';

const commonParams = {
  serviceKey: process.env.DURUNUBI_KEY,
  MobileOS: 'ETC',
  MobileApp: 'YegiGangwon',
  _type: 'json'
};

// 현재 위치 기준 주변 경로 리스트
exports.getNearbyCourses = async (req, res) => {
  const { mapX, mapY } = req.query;  // 위도, 경도
  try {
    const response = await axios.get(`${BASE_URL}/locationBasedList`, {
      params: {
        ...commonParams,
        mapX,
        mapY,
        radius: 20000  // 20km 이내
      }
    });
    res.json(response.data.response.body.items.item);
  } catch (err) {
    res.status(500).json({ error: '주변 경로 조회 실패', detail: err.message });
  }
};

// 특정 코스 ID로 상세 경로 조회
exports.getCourseDetail = async (req, res) => {
  const { contentId } = req.params;
  try {
    const response = await axios.get(`${BASE_URL}/courseDetail`, {
      params: {
        ...commonParams,
        contentId
      }
    });
    res.json(response.data.response.body.items.item);
  } catch (err) {
    res.status(500).json({ error: '코스 상세 조회 실패', detail: err.message });
  }
};
