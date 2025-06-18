const cron      = require('node-cron');
const cctvWorker = require('./cctvWorker');

// 10분마다 전체 CCTV 수집
cron.schedule('*/10 * * * *', async () => {
  console.log(`[Scheduler] ${new Date().toISOString()} - 수집 시작`);
  try {
    const results = await cctvWorker.collectAll();
    // personCount 기준 내림차순 정렬
    results.sort((a, b) => b.personCount - a.personCount);
    console.log(`[Scheduler] 완료:\n`, results);
  } catch (err) {
    console.error('[Scheduler] 에러:', err);
  }
});
