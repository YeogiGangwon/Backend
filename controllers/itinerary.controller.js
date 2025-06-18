const Itinerary = require('../models/itinerary.model');

// 일정 생성
exports.createItinerary = async (req, res) => {
  try {
    const itinerary = new Itinerary(req.body);
    await itinerary.save();
    res.status(201).json({ message: '일정 생성 완료', itinerary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '일정 생성 실패' });
  }
};

// 일정에 장소 추가
exports.addPlaceToItinerary = async (req, res) => {
  const { place_id, visit_order, memo } = req.body;
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ message: '일정 없음' });

    itinerary.places.push({ place_id, visit_order, memo });
    await itinerary.save();
    res.status(200).json({ message: '장소 추가 완료', itinerary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '장소 추가 실패' });
  }
};

// 일정 삭제
exports.deleteItinerary = async (req, res) => {
  try {
    const result = await Itinerary.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: '일정 없음' });
    res.status(200).json({ message: '일정 삭제 완료' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '일정 삭제 실패' });
  }
};

// 일정 내 장소 삭제
exports.removePlaceFromItinerary = async (req, res) => {
  const { place_id } = req.body;
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ message: '일정 없음' });

    itinerary.places = itinerary.places.filter(p => p.place_id.toString() !== place_id);
    await itinerary.save();
    res.status(200).json({ message: '장소 제거 완료', itinerary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '장소 제거 실패' });
  }
};

// 일정 수정()
exports.updateItinerary = async (req, res) => {
  try {
    const updated = await Itinerary.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: '일정 없음' });
    res.status(200).json({ message: '일정 수정 완료', updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '일정 수정 실패' });
  }
};

// 사용자 전체 일정 조회
exports.getUserItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ user_id: req.params.user_id }).populate('places.place_id');
    res.status(200).json(itineraries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '일정 조회 실패' });
  }
};

// 일정 상세 조회
exports.getItineraryById = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id).populate('places.place_id');
    if (!itinerary) return res.status(404).json({ message: '일정 없음' });
    res.status(200).json(itinerary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '일정 상세 조회 실패' });
  }
};
