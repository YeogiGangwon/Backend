# 강원도 여행 추천 시스템 - Backend

## 서버 실행 방법

### 1. 환경 설정
1. **Node.js 의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   - `env.example` 파일을 `.env`로 복사
   ```bash
   cp env.example .env
   ```
   - `.env` 파일에서 다음 값들을 설정:
     - `JWT_SECRET`: JWT 토큰 암호화 키 (랜덤한 긴 문자열)
     - `MONGO_URI`: MongoDB 연결 문자열
     - `PORT`: 서버 포트 (기본값: 8080)

3. **MongoDB 설정**
   - MongoDB가 실행 중이어야 함
   - Docker를 사용하는 경우: `docker-compose up -d mongo`

### 2. 개발 모드 실행
```bash
# 개발 모드 (자동 재시작)
npm run dev

# 또는 일반 실행
npm start
```

### 3. Docker 환경에서 실행
```bash
# 전체 서비스 빌드 및 실행
npm run docker:build

# 로그 확인
npm run docker:logs

# 서비스 중지
npm run docker:down
```

### 4. 서버 동작 확인
- 브라우저에서 `http://localhost:8080/api/health` 접속
- "Server is running" 메시지가 표시되면 성공

## API 엔드포인트

### 인증
- `POST /api/users/signup` - 회원가입
- `POST /api/users/login` - 로그인
- `GET /api/users/profile` - 사용자 정보 조회 (인증 필요)

### 헬스체크
- `GET /api/health` - 서버 상태 확인

## 문제 해결

1. **MongoDB 연결 실패**
   - MongoDB 서비스가 실행 중인지 확인
   - 연결 문자열이 올바른지 확인

2. **JWT 토큰 오류**
   - `.env` 파일의 `JWT_SECRET`이 설정되었는지 확인

3. **포트 충돌**
   - 다른 서비스가 8080 포트를 사용 중인지 확인
   - `.env`에서 `PORT` 변경
