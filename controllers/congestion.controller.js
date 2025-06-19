// controllers/congestion.controller.js
const fs = require('fs');
const path = require('path');
const cctvList = require('../data/cctvList');

// history 디렉토리 경로
const HIST_DIR = path.join(__dirname, '../data/history');

// 사분위 계산 함수
function quantile(arr, q) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

// 히스토리 파일에서 데이터 로드
function loadHistory(cameraId) {
  try {
    const filePath = path.join(HIST_DIR, `${cameraId}.json`);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`히스토리 로드 실패 (${cameraId}):`, error.message);
    return [];
  }
}

// 혼잡도 레벨 계산
function calculateCongestionLevel(personCount, thresholds) {
  const [q1, q2, q3] = thresholds;
  const CROWDED_THRESHOLD = 20;

  if (personCount <= q1) {
    return 'Low';
  } else if (personCount <= q2) {
    return 'Moderate';
  } else if (personCount <= q3 || personCount < CROWDED_THRESHOLD) {
    return 'Crowded';
  } else {
    return 'Very Crowded';
  }
}

// 혼잡도 점수 계산 (0~100)
function calculateScore(personCount, q3) {
  return Math.min(100, Math.round((personCount / (q3 + 5)) * 100));
}

// 각 CCTV의 최신 혼잡도 정보를 가져오는 함수
exports.getLatestCongestion = async (req, res) => {
  try {
    const congestionData = [];

    for (const cctv of cctvList) {
      const history = loadHistory(cctv.id);
      
      if (history.length === 0) {
        // 데이터가 없으면 기본값 반환
        congestionData.push({
          cameraId: cctv.id,
          name: cctv.name,
          location: cctv.location,
          personCount: 0,
          thresholds: [0, 0, 0],
          score: 0,
          level: 'Low',
          timestamp: new Date(),
          dataAvailable: false
        });
        continue;
      }

      // 최신 인원 수 (배열의 마지막 값)
      const personCount = history[history.length - 1];
      
      // 사분위 계산
      const q1 = quantile(history, 0.25);
      const q2 = quantile(history, 0.50);
      const q3 = quantile(history, 0.75);
      const thresholds = [q1, q2, q3];

      // 레벨과 점수 계산
      const level = calculateCongestionLevel(personCount, thresholds);
      const score = calculateScore(personCount, q3);

      congestionData.push({
        cameraId: cctv.id,
        name: cctv.name,
        location: cctv.location,
        personCount,
        thresholds,
        score,
        level,
        timestamp: new Date(),
        dataAvailable: true,
        historyLength: history.length
      });
    }

    console.log(`혼잡도 데이터 반환: ${congestionData.length}개 CCTV`);
    res.status(200).json(congestionData);
    
  } catch (err) {
    console.error('혼잡도 데이터 조회 실패:', err);
    res.status(500).json({ 
      message: '혼잡도 데이터를 가져오는데 실패했습니다.',
      error: err.message 
    });
  }
};

// 특정 CCTV의 혼잡도 정보 조회
exports.getCongestionById = async (req, res) => {
  try {
    const { cameraId } = req.params;
    const cctv = cctvList.find(c => c.id === cameraId);
    
    if (!cctv) {
      return res.status(404).json({ message: 'CCTV를 찾을 수 없습니다.' });
    }

    const history = loadHistory(cameraId);
    
    if (history.length === 0) {
      return res.status(200).json({
        cameraId,
        name: cctv.name,
        location: cctv.location,
        personCount: 0,
        thresholds: [0, 0, 0],
        score: 0,
        level: 'Low',
        timestamp: new Date(),
        dataAvailable: false
      });
    }

    const personCount = history[history.length - 1];
    const q1 = quantile(history, 0.25);
    const q2 = quantile(history, 0.50);
    const q3 = quantile(history, 0.75);
    const thresholds = [q1, q2, q3];
    const level = calculateCongestionLevel(personCount, thresholds);
    const score = calculateScore(personCount, q3);

    res.status(200).json({
      cameraId,
      name: cctv.name,
      location: cctv.location,
      personCount,
      thresholds,
      score,
      level,
      timestamp: new Date(),
      dataAvailable: true,
      historyLength: history.length,
      recentHistory: history.slice(-10) // 최근 10개 데이터
    });

  } catch (err) {
    console.error('개별 혼잡도 데이터 조회 실패:', err);
    res.status(500).json({ 
      message: '혼잡도 데이터를 가져오는데 실패했습니다.',
      error: err.message 
    });
  }
};