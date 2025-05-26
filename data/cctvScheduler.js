// /data/cctvScheduler.js
const cron = require('node-cron');
const { fetchAndSaveCCTVImages } = require('./cctvWorker');

// 매 10분마다 실행 (원하면 5분도 가능)
cron.schedule('*/10 * * * *', () => {
  console.log('[🕒] CCTV 이미지 수집 시작');
  fetchAndSaveCCTVImages();
});
