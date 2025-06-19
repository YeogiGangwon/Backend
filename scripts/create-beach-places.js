const mongoose = require('mongoose');
const Place = require('../models/place.model');
const beaches = require('../data/beaches');

// MongoDB 연결
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tour_gangwon');
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
}

// 해수욕장을 Place로 생성
async function createBeachPlaces() {
  try {
    // 기존 해수욕장 Place 삭제
    await Place.deleteMany({ category: 'beach' });
    console.log('기존 해수욕장 Place 데이터 삭제 완료');

    const placesToCreate = beaches.map((beach, index) => ({
      _id: new mongoose.Types.ObjectId().toString(),
      name: beach.name,
      description: beach.description,
      category: 'beach',
      address: beach.tourInfo?.addr1 || `${beach.city} ${beach.name}`,
      latitude: beach.location.lat,
      longitude: beach.location.lon,
      image_url: beach.tourInfo?.firstimage || '',
      open_hours: beach.tourInfo?.usetime || '연중무휴',
      fee_info: '무료',
      indoor: false
    }));

    const createdPlaces = await Place.insertMany(placesToCreate);
    console.log(`${createdPlaces.length}개의 해수욕장 Place 생성 완료`);

    // ID 매핑 정보 출력
    console.log('\n=== Beach ID와 Place ID 매핑 ===');
    beaches.forEach((beach, index) => {
      console.log(`${beach.id} (${beach.name}) -> ${createdPlaces[index]._id}`);
    });

    return createdPlaces;
  } catch (error) {
    console.error('Place 생성 실패:', error);
    throw error;
  }
}

// 메인 실행 함수
async function main() {
  try {
    await connectDB();
    await createBeachPlaces();
    console.log('\n해수욕장 Place 생성 작업 완료!');
  } catch (error) {
    console.error('작업 실패:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
  }
}

// 스크립트가 직접 실행된 경우에만 실행
if (require.main === module) {
  main();
}

module.exports = { createBeachPlaces }; 