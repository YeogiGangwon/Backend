서버 실행 방법 
- 루트 폴더 : Backend 기준
1. Node.js 의존성 설치
     npm install
2. .env 와 secrets 설정 (git에 올라가지 않음)
   -> notion
3. docker 환경에서 이미지 빌드 및 컨테이너 실행
   터미널이 Backend에 있는지 확인하고
   docker-compose up -d --build 실행
4. 서버 동작 확인
   docker-compose logs -f backend
   -> 서버 실행 중..., MongoDB 연결 성공 ...  메시지 보이면 성공
