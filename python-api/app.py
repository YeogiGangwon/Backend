import os
import sys
import pathlib
import traceback
import logging

# ─── 로깅 설정 ───────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ─── WindowsPath ↔ PosixPath 버그 대응 ────────────────────────
if sys.platform == "win32":
    pathlib.PosixPath = pathlib.WindowsPath
else:
    pathlib.WindowsPath = pathlib.PosixPath

# ─── 기본 라이브러리 임포트 ───────────────────────────────────
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# OpenCV 영상 I/O 우선순위 조정 (Windows)
os.environ['OPENCV_VIDEOIO_PRIORITY_MSMF'] = '0'
import cv2

# PyTorch
import torch

# ─── FastAPI 앱 초기화 ────────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ─── 디바이스 결정 & 정보 출력 ────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

# ─── 모델 경로 & 존재 여부 체크 ───────────────────────────────
MODEL_PATH = os.getenv('MODEL_PATH', '/models/best.pt')
logger.info(f"모델 경로: {MODEL_PATH}")
if not os.path.isfile(MODEL_PATH):
    raise FileNotFoundError(f"모델 파일을 찾을 수 없습니다: {MODEL_PATH}")

# ─── 모델 로드 ────────────────────────────────────────────────
try:
    logger.info("모델 로딩 시작...")
    # CPU만 사용하도록 강제 (Intel GPU/CUDA가 없는 환경)
    os.environ['CUDA_VISIBLE_DEVICES'] = ''
    torch.set_num_threads(4)

    model = torch.hub.load(
        'ultralytics/yolov5',  # YOLOv5 허브 repo
        'custom',              # 커스텀 모델
        path=MODEL_PATH,       # 로컬 weight 경로
        force_reload=False     # 캐시 사용
    )
    model.to(device)

    # 정밀도 설정: CUDA 환경에서만 FP16, 아니면 FP32
    if device.type == "cuda":
        model.half()
        logger.info("모델을 FP16 모드로 전환 (CUDA)")
    else:
        model.float()
        logger.info("모델을 FP32 모드로 전환 (CPU)")

    model.eval()
    logger.info("모델 로딩 완료")
except Exception as e:
    logger.error("모델 로드 실패", exc_info=True)
    raise

# ─── 엔드포인트: /congestion ──────────────────────────────────
@app.post("/congestion")
async def congestion(file: UploadFile = File(...)):
    try:
        # 1) 파일 타입 체크
        logger.info(f"받은 파일 타입: {file.content_type}")
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="이미지 파일만 업로드하세요")

        # 2) 바이트 → OpenCV 이미지
        data = await file.read()
        npimg = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="이미지 디코딩 실패")

        # 3) 크기 제한 (최대 640px)
        h, w = img.shape[:2]
        if max(h, w) > 640:
            scale = 640 / max(h, w)
            img = cv2.resize(img, (int(w*scale), int(h*scale)))

        # 4) 추론
        logger.info("YOLO 추론 시작")
        with torch.no_grad():
            # AutoShape이 numpy array→tensor 변환을 알아서 해 줍니다.
            results = model(img, size=640)

        # 사람(class 0) 개수 집계
        person_count = int((results.xyxyn[0][:, -1] == 0).sum().item())
        logger.info(f"감지된 사람 수: {person_count}")

        # 5) JSON 반환
        return {"person_count": person_count}

    except HTTPException:
        # 클라이언트 에러는 그대로 던집니다.
        raise
    except Exception as e:
        # 서버 에러는 로그와 함께 500으로 반환
        logger.error("추론 중 오류 발생", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ─── Uvicorn 실행 ─────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
