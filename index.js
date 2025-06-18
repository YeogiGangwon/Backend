const app = require('./app');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
require('./data/cctvScheduler');

dotenv.config();
connectDB();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
