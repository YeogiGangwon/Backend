// backend/data/cctvWorker.js
const axios       = require('axios');
const fs          = require('fs');
const path        = require('path');
const FormData    = require('form-data'); 
const cctvList    = require('./cctvList');
const Congestion  = require('../models/congestion.model');

const CROWDED_THRESHOLD = 20;

// 히스토리 JSON 저장 디렉토리
const HIST_DIR = path.join(__dirname, 'history');
if (!fs.existsSync(HIST_DIR)) fs.mkdirSync(HIST_DIR);

// 이미지 저장 디렉토리
const IMG_DIR = path.join(__dirname, 'images');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR);

// 유틸: 사분위 계산
function quantile(arr, q) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a,b)=>a-b);
  const pos    = (sorted.length - 1) * q;
  const base   = Math.floor(pos);
  const rest   = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base+1] - sorted[base])
    : sorted[base];
}

// 유틸: 히스토리 로드/저장
function loadHistory(id) {
  const file = path.join(HIST_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file));
}
function saveHistory(id, arr) {
  fs.writeFileSync(
    path.join(HIST_DIR, `${id}.json`),
    JSON.stringify(arr.slice(-500))  // 마지막 500개만 보관
  );
}

// 이미지 저장 함수
async function saveImage(id, imgBuf, timestamp) {
  const fileName = `${id}_${timestamp.getTime()}.jpg`;
  await fs.promises.writeFile(path.join(IMG_DIR, fileName), imgBuf);
  return fileName;
}

// 재시도 로직
const MAX_RETRIES = 3;
async function retryOperation(operation, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

// 단일 CCTV 처리
async function analyzeCamera(cam) {
  const now = new Date();

  // 1) 이미지 다운로드
  const resp   = await axios.get(cam.url, { responseType: 'arraybuffer' });
  const imgBuf = resp.data;
  // const imgBuf = fs.readFileSync(path.join(__dirname, '../python-api/test_image.jpg'));
  // 2) Python API 호출 (YOLOv5 추론)
  // const { data } = await axios.post(
  //   'http://localhost:8000/congestion',
  //   imgBuf,
  //   { headers: { 'Content-Type': 'application/octet-stream' } }
  // );
  // const personCount = data.person_count || 0;

  // 2) Python API 호출 (YOLOv5 추론)
  // 환경 변수에서 Python API 주소 가져오기 (없을 경우 기본값 사용)
  const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000/congestion';

  const form = new FormData();
  // 'file'이라는 필드 이름은 Python FastAPI의 `File(...)` 매개변수 이름과 일치해야 합니다.
  form.append('file', imgBuf, `${cam.id}.jpg`);

  const { data } = await axios.post(
    pythonApiUrl, // <--- 2. 하드코딩된 주소를 환경 변수로 교체
    form,
    { headers: form.getHeaders() } // form-data 라이브러리가 헤더를 자동으로 생성해줍니다.
  );
  const personCount = data.person_count || 0;

  // 3) 히스토리 업데이트
  const hist = loadHistory(cam.id);
  hist.push(personCount);
  saveHistory(cam.id, hist);

  // 4) 사분위 기준 산출 (25%,50%,75%)
  const q1 = quantile(hist, 0.25);
  const q2 = quantile(hist, 0.50);
  const q3 = quantile(hist, 0.75);

  // 5) 레벨 분류
  let level;
  if (personCount <= q1) {
    level = 'Low';
  } else if (personCount <= q2) {
    level = 'Moderate';
  } else if (personCount <= q3 || personCount < CROWDED_THRESHOLD) { 
    // q3를 초과했더라도, 전체 인원이 기준값(20명) 미만이면 'Crowded'로 유지
    level = 'Crowded';
  } else {
    // q3를 초과하고, 전체 인원도 기준값을 넘었을 때만 'Very Crowded'
    level = 'Very Crowded';
  }                            level = 'Very Crowded';

  // 6) 점수 계산 (0~100)
  const score = Math.min(100, Math.round((personCount / (q3 + 5)) * 100));

  // 7) **DB 저장**
  await Congestion.create({
    cameraId:    cam.id,
    timestamp:   now,
    personCount,
    thresholds:  [q1, q2, q3],
    score,
    level
  });

  // 8) 결과 반환
  return {
    id:          cam.id,
    name:        cam.name,
    location:    cam.location,
    personCount,
    thresholds:  [q1, q2, q3],
    score,
    level,
    timestamp:   now.toISOString()
  };
}

// 전체 CCTV 순회
async function collectAll() {
  const results = [];
  for (const cam of cctvList) {
    try {
      const res = await analyzeCamera(cam);
      results.push(res);
    } catch (err) {
      // 상세한 에러 로그를 출력하도록 변경
      console.error(`[Worker] ${cam.id} 분석 실패`);
      if (err.response) {
        // 서버가 상태 코드로 응답한 경우 (4xx, 5xx 에러)
        console.error('에러 데이터:', err.response.data);
        console.error('에러 상태 코드:', err.response.status);
        console.error('요청 URL:', err.config.url); // 어떤 URL에서 에러가 났는지 확인
      } else if (err.request) {
        // 요청은 보냈으나 응답을 받지 못한 경우
        console.error('응답 없음. 요청 정보:', err.request);
      } else {
        // 요청 설정 중에 에러가 발생한 경우
        console.error('요청 설정 에러:', err.message);
      }
    }
  }
  return results;
}

module.exports = { collectAll };
