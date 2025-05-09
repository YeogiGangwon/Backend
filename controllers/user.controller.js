const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { generateToken } = require('../utils/tokenUtils');

exports.signup = async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: '이미 가입된 이메일입니다.' });

    const hashedPw = await bcrypt.hash(password, 10);

    const newUser = new User({ email, password: hashedPw, nickname });
    await newUser.save();

    res.status(201).json({ message: '회원가입 완료!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: '이메일이 존재하지 않습니다.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: '비밀번호가 틀립니다.' });

    const token = generateToken(user._id);
    res.status(200).json({ token, message: '로그인 성공!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
};
