const Favorite = require('../models/favorite.model');
const mongoose = require('mongoose');

// 즐겨찾기 등록
exports.addFavorite = async (req, res) => {
  try {
    const { place_id } = req.body;
    const user_id = req.userId;

    console.log('즐겨찾기 추가 요청:', { place_id, user_id });

    // 유효성 검증
    if (!place_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'place_id가 필요합니다.' 
      });
    }

    if (!user_id) {
      return res.status(401).json({ 
        success: false, 
        message: '인증이 필요합니다.' 
      });
    }

    // ObjectId 유효성 검사
    if (!mongoose.Types.ObjectId.isValid(place_id)) {
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 장소 ID입니다.' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 사용자 ID입니다.' 
      });
    }

    const exists = await Favorite.findOne({ 
      user_id: new mongoose.Types.ObjectId(user_id), 
      place_id: new mongoose.Types.ObjectId(place_id) 
    });
    
    if (exists) {
      return res.status(409).json({ 
        success: false, 
        message: '이미 즐겨찾기에 추가된 장소입니다.' 
      });
    }

    const favorite = new Favorite({ 
      user_id: new mongoose.Types.ObjectId(user_id), 
      place_id: new mongoose.Types.ObjectId(place_id) 
    });
    await favorite.save();

    // 추가된 즐겨찾기를 populate해서 반환
    const populatedFavorite = await Favorite.findById(favorite._id).populate('place_id');

    res.status(201).json({ 
      success: true, 
      message: '즐겨찾기에 추가되었습니다.',
      id: populatedFavorite._id.toString(),
      user_id: populatedFavorite.user_id.toString(),
      place_id: populatedFavorite.place_id,
      created_at: populatedFavorite.createdAt
    });
  } catch (err) {
    console.error('즐겨찾기 추가 상세 오류:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      success: false, 
      message: '즐겨찾기 추가 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
      id: fav._id.toString(),
      user_id: fav.user_id.toString(),
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

    console.log('즐겨찾기 삭제 요청 (placeId):', { placeId, user_id });

    if (!user_id) {
      return res.status(401).json({ 
        success: false, 
        message: '인증이 필요합니다.' 
      });
    }

    if (!placeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'placeId가 필요합니다.' 
      });
    }

    // ObjectId 유효성 검사
    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 장소 ID입니다.' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 사용자 ID입니다.' 
      });
    }

    const result = await Favorite.findOneAndDelete({ 
      user_id: new mongoose.Types.ObjectId(user_id), 
      place_id: new mongoose.Types.ObjectId(placeId) 
    });
    
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
    console.error('즐겨찾기 삭제 상세 오류:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      success: false, 
      message: '즐겨찾기 삭제 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// 즐겨찾기 상태 확인
exports.getFavoriteStatus = async (req, res) => {
  try {
    const { placeId } = req.params;
    const user_id = req.userId;

    console.log('즐겨찾기 상태 확인 요청:', {
      placeId,
      user_id,
      userIdType: typeof user_id,
      placeIdType: typeof placeId
    });

    if (!user_id) {
      console.log('인증 토큰이 없음');
      return res.status(401).json({ 
        success: false, 
        message: '인증이 필요합니다.' 
      });
    }

    if (!placeId) {
      console.log('placeId가 없음');
      return res.status(400).json({ 
        success: false, 
        message: 'placeId가 필요합니다.' 
      });
    }

    // ObjectId 유효성 검사
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      console.log('유효하지 않은 placeId:', placeId);
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 장소 ID입니다.' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      console.log('유효하지 않은 user_id:', user_id);
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 사용자 ID입니다.' 
      });
    }

    console.log('즐겨찾기 조회 시작...');
    const favorite = await Favorite.findOne({ 
      user_id: new mongoose.Types.ObjectId(user_id), 
      place_id: new mongoose.Types.ObjectId(placeId) 
    });
    
    console.log('즐겨찾기 조회 결과:', favorite ? '찾음' : '없음');
    
    // 프론트엔드 모델에 맞는 필드명 사용
    res.status(200).json({ 
      is_favorite: !!favorite 
    });
  } catch (err) {
    console.error('즐겨찾기 상태 확인 상세 오류:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      success: false, 
      message: '즐겨찾기 상태 확인 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
