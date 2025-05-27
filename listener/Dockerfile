# Dockerfile
FROM node:20-slim

# 작업 디렉토리 생성
WORKDIR /app

# 패키지 복사 및 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 지정 (Web이 아닌 Listener라 생략 가능)
EXPOSE 3000

# 실행
CMD ["node", "index.js"]
