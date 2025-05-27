const Favorite = require('../models/favorite.model');

// 즐겨찾기 등록
exports.addFavorite = async (req, res) => {
  try {
    const { place_id } = req.body;
    const user_id = req.user.id;

    const exists = await Favorite.findOne({ user_id, place_id });
    if (exists) return res.status(409).json({ message: '이미 즐겨찾기됨' });

    const favorite = new Favorite({ user_id, place_id });
    await favorite.save();

    res.status(201).json({ message: '즐겨찾기 완료', favorite });
  } catch (err) {
    console.error('즐겨찾기 등록 실패' ,err);
    res.status(500).json({ message: '즐겨찾기 실패' });
  }
};

// 즐겨찾기 조회
exports.getFavorites = async (req, res) => {
  try {
    const user_id = req.user.id;

    const favorites = await Favorite.find({ user_id }).populate('place_id');
    res.status(200).json(favorites);
  } catch (err) {
    console.error('즐겨찾기 조회 실패', err);
    res.status(500).json({ message: '조회 실패' });
  }
};

// 즐겨찾기 삭제
exports.deleteFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await Favorite.findOneAndDelete({ _id: id, user_id });
    if (!result) return res.status(404).json({ message: '해당 즐겨찾기를 찾을 수 없음' });

    res.status(200).json({ message: '삭제 완료' });
  } catch (err) {
    console.error('즐겨찾기 삭제 실패' ,err);
    res.status(500).json({ message: '삭제 실패' });
  }
};
