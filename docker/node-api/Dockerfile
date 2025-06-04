# 베이스 이미지 설정
FROM node:18-alpine

# 앱 디렉터리 생성 및 이동
WORKDIR /app

# package.json과 package-lock.json만 먼저 복사
COPY package*.json ./
RUN npm ci --production

# 소스 복사
COPY . .

# 포트 개방
EXPOSE 8080

# 실행 명령어
CMD ["npm", "run", "start"]
