# 멀티 스테이지 빌드 - 빌더 스테이지
FROM python:3.9-slim as builder

WORKDIR /app

# 빌드 도구 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# pip 업그레이드
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# requirements.txt 복사 및 의존성 설치
COPY python-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 실행 스테이지
FROM python:3.9-slim

WORKDIR /app

# OpenCV 및 기타 필요한 시스템 라이브러리 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# 빌더에서 Python 패키지 복사
COPY --from=builder /usr/local/lib/python3.9/site-packages/ /usr/local/lib/python3.9/site-packages/

# 필요한 파일들 복사
COPY python-api/app.py .
COPY models/best.pt /models/best.pt

# 환경 변수 설정
ENV PYTHONUNBUFFERED=1
ENV TORCH_HOME=/app/.torch
ENV MODEL_PATH=/models/best.pt
ENV OPENCV_VIDEOIO_PRIORITY_MSMF=0
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app
ENV PATH_TYPE=posix

# YOLOv5 캐시 디렉토리 생성 및 초기화
RUN mkdir -p /app/.torch && \
    rm -rf /app/.torch/hub/* || true

EXPOSE 8000
CMD ["python", "app.py"]