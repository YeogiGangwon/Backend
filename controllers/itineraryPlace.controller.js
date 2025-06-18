const ItineraryPlace = require('../models/itineraryplace.model');

// 일정에 장소 추가
exports.addPlaceToItinerary = async (req, res) => {
  try {
    const newEntry = new ItineraryPlace(req.body);
    await newEntry.save();
    res.status(201).json({ message: '장소가 일정에 추가되었습니다.', data: newEntry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '장소 추가 실패' });
  }
};

// 선택 일정의 장소 목록 조회 (방문 순서대로 정렬)
exports.getPlacesByItinerary = async (req, res) => {
  try {
    const itinerary_id = req.params.itinerary_id;
    const places = await ItineraryPlace.find({ itinerary_id })
      .populate('place_id')
      .sort({ visit_order: 1 }); // 방문 순서대로 정렬
    res.status(200).json(places);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '일정의 장소 조회 실패' });
  }
};

// 장소 내용 수정 (메모, 순서, 소요 시간 등)
exports.updateItineraryPlace = async (req, res) => {
  try {
    const updated = await ItineraryPlace.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: '장소 항목을 찾을 수 없습니다.' });
    res.status(200).json({ message: '장소 정보가 수정되었습니다.', data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '장소 수정 실패' });
  }
};

// 장소 삭제 (일정에서 해당 장소 제거)
exports.removePlaceFromItinerary = async (req, res) => {
  try {
    const deleted = await ItineraryPlace.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: '삭제할 장소를 찾을 수 없습니다.' });
    res.status(200).json({ message: '장소가 일정에서 삭제되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '장소 삭제 실패' });
  }
};
