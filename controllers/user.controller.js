const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { generateToken } = require('../utils/tokenUtils');

exports.signup = async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    // 필수 필드 검증
    if (!email || !password || !nickname) {
      return res.status(400).json({ 
        success: false,
        message: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.' 
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: '올바른 이메일 형식을 입력해주세요.' 
      });
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: '비밀번호는 최소 6자 이상이어야 합니다.' 
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ 
        success: false,
        message: '이미 가입된 이메일입니다.' 
      });
    }

    const hashedPw = await bcrypt.hash(password, 10);

    const newUser = new User({ 
      email, 
      password: hashedPw, 
      nickname,
      created_at: new Date()
    });
    await newUser.save();

    res.status(201).json({ 
      success: true,
      message: '회원가입이 완료되었습니다!' 
    });
  } catch (err) {
    console.error('회원가입 오류:', err);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.' 
      });
    }

    // 마지막 로그인 시간 업데이트
    user.last_login = new Date();
    await user.save();

    const token = generateToken(user._id);
    
    res.status(200).json({ 
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname
      },
      message: '로그인 성공!' 
    });
  } catch (err) {
    console.error('로그인 오류:', err);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.' 
    });
  }
};

// 사용자 정보 조회 (토큰 검증용)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: '사용자를 찾을 수 없습니다.' 
      });
    }

    res.status(200).json({ 
      success: true,
      user 
    });
  } catch (err) {
    console.error('프로필 조회 오류:', err);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.' 
    });
  }
};
