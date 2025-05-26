// /data/cctvWorker.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cctvList = require('./cctvList');

const saveDir = path.join(__dirname, '../public/images/cctv');

// 저장 폴더 없으면 생성
if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

async function fetchAndSaveCCTVImages() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  for (const cam of cctvList) {
    try {
      const response = await axios.get(cam.url, { responseType: 'arraybuffer' });

      const filename = `${cam.region}_${cam.name}_${timestamp}.jpg`;
      const filepath = path.join(saveDir, filename);

      fs.writeFileSync(filepath, response.data);
      console.log(`[✔] 저장됨: ${filepath}`);
    } catch (err) {
      console.error(`[✘] 오류 (${cam.name}): ${err.message}`);
    }
  }
}

module.exports = { fetchAndSaveCCTVImages };
