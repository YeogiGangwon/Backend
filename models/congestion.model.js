// models/congestion.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CongestionSchema = new Schema({
  cameraId:    { type: String,  required: true, index: true },  // cctvList.js 의 id
  timestamp:   { type: Date,    required: true, default: Date.now, index: true },
  personCount: { type: Number,  required: true },               // YOLOv5에서 받은 인원 수
  thresholds:  { type: [Number], required: true },               // [q1, q2, q3] 사분위 기준
  score:       { type: Number,  required: true },               // 0~100 점수
  level:       { type: String,  required: true }                // Low, Moderate, Crowded, Very Crowded
});

// 'Congestion' 컬렉션 이름으로 모델 등록
module.exports = mongoose.model('Congestion', CongestionSchema);
