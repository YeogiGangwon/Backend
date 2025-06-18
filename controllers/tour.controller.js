require('dotenv').config();
const axios = require('axios');

exports.getRelatedPlaces = async (req, res) => {
  const { contentId } = req.query;

  if (!contentId) {
    return res.status(400).json({ message: 'contentId가 필요합니다.' });
  }

  try {
    const response = await axios.get('https://apis.data.go.kr/B551011/TarRlteTarService1/getRltrTarList1', {
      params: {
        serviceKey: process.env.TOUR_API_KEY,
        contentId: contentId,
        MobileOS: 'ETC',
        MobileApp: 'HereGangwon',
        _type: 'json'
      }
    });

    const items = response.data.response?.body?.items?.item;
    res.status(200).json(items || []);
  } catch (error) {
    console.error("외부 API 에러:", error.response?.data || error.message);
    res.status(500).json({
      message: 'API 호출 실패',
      error: error.response?.data || error.message
    });
  }
};
