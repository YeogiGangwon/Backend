서버 실행 방법 
- 루트 폴더 : Backend 기준
1. <b> Node.js 의존성 설치 </b>  </br>
     npm install
2. <b>.env 와 secrets 설정 (git에 올라가지 않음)</b> </br>
   -> notion
3. <b>docker 환경에서 이미지 빌드 및 컨테이너 실행</b> </br>
   터미널이 Backend에 있는지 확인하고 </br>
   docker-compose up -d --build 실행 
4. <b>서버 동작 확인</b> </br>
   docker-compose logs -f backend </br>
   -> 서버 실행 중..., MongoDB 연결 성공 ...  메시지 보이면 성공
