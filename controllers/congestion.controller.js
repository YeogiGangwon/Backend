// controllers/congestion.controller.js
const Congestion = require('../models/congestion.model');

// 각 CCTV의 최신 혼잡도 정보를 가져오는 함수
exports.getLatestCongestion = async (req, res) => {
  try {
    // MongoDB Aggregation을 사용하여 각 cameraId별로 가장 최신(timestamp가 가장 큰) 문서를 찾습니다.
    const latestCongestionData = await Congestion.aggregate([
      // 1. 최신 순으로 정렬
      { $sort: { timestamp: -1 } },
      // 2. cameraId로 그룹화하고, 각 그룹의 첫 번째 문서(가장 최신 데이터)를 선택
      {
        $group: {
          _id: '$cameraId',
          latest: { $first: '$$ROOT' }
        }
      },
      // 3. 그룹화된 결과에서 latest 필드만 추출하여 모양을 정리
      { $replaceRoot: { newRoot: '$latest' } },
      // 4. 최종 결과를 cameraId 순으로 정렬 (선택 사항)
      { $sort: { cameraId: 1 } }
    ]);

    res.status(200).json(latestCongestionData);
  } catch (err) {
    console.error('혼잡도 데이터 조회 실패:', err);
    res.status(500).json({ message: '혼잡도 데이터를 가져오는데 실패했습니다.' });
  }
};