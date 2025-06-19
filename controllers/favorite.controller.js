const Favorite = require('../models/favorite.model');

// 즐겨찾기 등록
exports.addFavorite = async (req, res) => {
  try {
    const { place_id } = req.body;
    const user_id = req.userId;

    // 유효성 검증
    if (!place_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'place_id가 필요합니다.' 
      });
    }

    const exists = await Favorite.findOne({ user_id, place_id });
    if (exists) {
      return res.status(409).json({ 
        success: false, 
        message: '이미 즐겨찾기에 추가된 장소입니다.' 
      });
    }

    const favorite = new Favorite({ user_id, place_id });
    await favorite.save();

    res.status(201).json({ 
      success: true, 
      message: '즐겨찾기에 추가되었습니다.',
      id: favorite._id,
      user_id: favorite.user_id,
      place_id: favorite.place_id,
      created_at: favorite.createdAt
    });
  } catch (err) {
    console.error('즐겨찾기 추가 오류:', err);
    res.status(500).json({ 
      success: false, 
      message: '즐겨찾기 추가 중 오류가 발생했습니다.' 
    });
  }
};

// 즐겨찾기 목록 조회
exports.getFavorites = async (req, res) => {
  try {
    const user_id = req.userId;

    const favorites = await Favorite.find({ user_id }).populate('place_id');
    
    // 응답 형식을 프론트엔드 모델에 맞게 변환
    const formattedFavorites = favorites.map(fav => ({
      id: fav._id,
      user_id: fav.user_id,
      place_id: fav.place_id, // populated Place 객체
      created_at: fav.createdAt
    }));

    res.status(200).json(formattedFavorites);
  } catch (err) {
    console.error('즐겨찾기 목록 조회 오류:', err);
    res.status(500).json({ 
      success: false, 
      message: '즐겨찾기 목록 조회 중 오류가 발생했습니다.' 
    });
  }
};

// 즐겨찾기 삭제 (favorite ID 기반)
exports.deleteFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.userId;

    const result = await Favorite.findOneAndDelete({ _id: id, user_id });
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: '즐겨찾기에서 찾을 수 없는 장소입니다.' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: '즐겨찾기에서 삭제되었습니다.' 
    });
  } catch (err) {
    console.error('즐겨찾기 삭제 오류:', err);
    res.status(500).json({ 
      success: false, 
      message: '즐겨찾기 삭제 중 오류가 발생했습니다.' 
    });
  }
};

// 즐겨찾기 삭제 (place ID 기반)
exports.deleteFavoriteByPlaceId = async (req, res) => {
  try {
    const { placeId } = req.params;
    const user_id = req.userId;

    const result = await Favorite.findOneAndDelete({ user_id, place_id: placeId });
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: '즐겨찾기에서 찾을 수 없는 장소입니다.' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: '즐겨찾기에서 삭제되었습니다.' 
    });
  } catch (err) {
    console.error('즐겨찾기 삭제 오류:', err);
    res.status(500).json({ 
      success: false, 
      message: '즐겨찾기 삭제 중 오류가 발생했습니다.' 
    });
  }
};

// 즐겨찾기 상태 확인
exports.getFavoriteStatus = async (req, res) => {
  try {
    const { placeId } = req.params;
    const user_id = req.userId;

    if (!user_id) {
      return res.status(401).json({ 
        success: false, 
        message: '인증이 필요합니다.' 
      });
    }

    const favorite = await Favorite.findOne({ user_id, place_id: placeId });
    
    // 프론트엔드 모델에 맞는 필드명 사용
    res.status(200).json({ 
      is_favorite: !!favorite 
    });
  } catch (err) {
    console.error('즐겨찾기 상태 확인 오류:', err);
    res.status(500).json({ 
      success: false, 
      message: '즐겨찾기 상태 확인 중 오류가 발생했습니다.' 
    });
  }
};
