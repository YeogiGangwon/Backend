# 즐겨찾기 기능 설정 가이드

## 🚨 중요: 환경변수 설정이 필요합니다

500 에러가 발생하는 원인은 환경변수가 설정되지 않았기 때문입니다.

## 1. .env 파일 생성

`back/` 폴더에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 서버 설정
PORT=8080
NODE_ENV=development

# MongoDB 연결
MONGO_URI=mongodb://root:sdsqkqh!@localhost:27017/admin?authSource=admin

# JWT 설정
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random_12345678901234567890
JWT_EXPIRES_IN=7d

# Python API 설정
PYTHON_API_URL=http://localhost:8000/congestion
```

## 2. 환경변수 설정 확인

```bash
cd back
node -e "console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET'); console.log('MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');"
```

## 3. 서버 재시작

환경변수 설정 후 서버를 재시작하세요:

```bash
cd back
npm start
```

## 4. 즐겨찾기 API 테스트

서버가 실행되면 다음 API들을 테스트할 수 있습니다:

- `GET /api/favorites` - 즐겨찾기 목록 조회
- `POST /api/favorites` - 즐겨찾기 추가
- `GET /api/favorites/status/:placeId` - 즐겨찾기 상태 확인
- `DELETE /api/favorites/place/:placeId` - 즐겨찾기 삭제

## 5. 데이터베이스 연결 확인

```bash
cd back
node test_favorite_api.js
```

## 수정된 주요 사항

1. **데이터 타입 통일**: 모든 ID를 String으로 통일 (MongoDB ObjectId 호환)
2. **에러 처리 개선**: 상세한 에러 로깅과 검증 로직 추가
3. **ObjectId 검증**: 유효하지 않은 ObjectId 형식 처리
4. **환경변수 검증**: JWT_SECRET, MONGO_URI 등 필수 환경변수 확인

## 트러블슈팅

### 500 에러가 계속 발생하는 경우:
1. `.env` 파일이 `back/` 폴더에 있는지 확인
2. 환경변수가 올바르게 설정되었는지 확인
3. MongoDB가 실행중인지 확인
4. 서버 로그를 확인해서 상세한 에러 메시지 확인

### 인증 에러가 발생하는 경우:
1. 로그인이 되어 있는지 확인
2. JWT 토큰이 올바른지 확인
3. Authorization 헤더가 올바르게 설정되었는지 확인 