import os
import sys
import pathlib
import traceback
import logging

# ──────────────── Pathlib 호환성 설정 ─────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 윈도우와 리눅스 간 pathlib 충돌 방지 (Docker 컨테이너 내부에서 실행될 때 WindowsPath 에러 우회)
if sys.platform == "win32":
    pathlib.PosixPath = pathlib.WindowsPath
else:
    pathlib.WindowsPath = pathlib.PosixPath

# ──────────────── 기본 라이브러리 임포트 ─────────────────
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ──────────────── OpenCV 임포트 ─────────────────
os.environ['OPENCV_VIDEOIO_PRIORITY_MSMF'] = '0'
try:
    import cv2
    print(f"OpenCV 버전: {cv2.__version__}")
except ImportError as e:
    print(f"OpenCV 임포트 실패: {e}")
    raise

# ──────────────── PyTorch 임포트 ─────────────────
try:
    import torch
    print(f"PyTorch 버전: {torch.__version__}")
except ImportError as e:
    print(f"PyTorch 임포트 실패: {e}")
    raise

# ──────────────── FastAPI 앱 생성 ─────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # 개발 중에는 모든 오리진 허용 (배포 시 적절히 조정)
    allow_methods=["POST"],    # POST 요청만 허용
    allow_headers=["*"],
)

# ──────────────── 모델 경로 설정 ─────────────────
MODEL_PATH = os.getenv('MODEL_PATH', '/models/best.pt')
print(f"모델 경로: {MODEL_PATH}")
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"모델 파일을 찾을 수 없습니다: {MODEL_PATH}")

# ──────────────── YOLOv5 모델 로드(모두 float32로 강제 변환) ─────────────────
try:
    print("모델 로딩 시작...")
    # CPU를 쓰도록 강제
    os.environ['CUDA_VISIBLE_DEVICES'] = ''
    torch.set_num_threads(4)

    # torch.hub.load 로 custom 모델을 불러올 때 device='cpu' 지정
    # → 이 단계에서 내부적으로 일부 레이어가 Half precision이 될 수 있으므로
    #    바로 float32 로 강제 변환을 추가로 해준다.
    model = torch.hub.load(
        'ultralytics/yolov5',
        'custom',
        path=MODEL_PATH,
        force_reload=True,
        device='cpu'
    )

    # **핵심**: CPU에서 half‐precision 연산이 불가능하므로 .float() 로 전체 레이어를 Full‐precision(f32)으로 변환
    model = model.float()

    # 모델을 평가 모드로 세팅
    model.eval()
    print("모델 로딩 완료 (float32)")
except Exception as e:
    print(f"모델 로드 실패: {e}")
    print(f"상세 에러: {type(e).__name__}")
    raise

# ──────────────── 엔드포인트 정의 (/congestion) ─────────────────
@app.post("/congestion")
async def congestion(file: UploadFile = File(...)):
    try:
        # 1) 업로드된 파일의 Content-Type 체크
        logger.info(f"받은 파일 타입: {file.content_type}")
        if file.content_type.split("/")[0] != "image":
            raise HTTPException(status_code=400, detail="이미지 파일만 업로드하세요")

        # 2) 바이트 버퍼로부터 OpenCV 이미지 생성
        logger.info("파일 읽기 시작")
        data = await file.read()
        npimg = np.frombuffer(data, dtype=np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="이미지 디코딩 실패")

        # 3) 이미지 크기 최적화 (너비/높이가 640px을 넘으면 축소)
        max_size = 640
        height, width = img.shape[:2]
        if height > max_size or width > max_size:
            scale = max_size / max(height, width)
            img = cv2.resize(img, (int(width * scale), int(height * scale)))

        # 4) YOLOv5 추론
        logger.info("YOLO 추론 시작")
        with torch.no_grad():
            # model(img) → 모델이 Full‐precision(f32) 이므로 Half 연산 시도 없이 안전하게 추론됨
            results = model(img, size=640)

        # class 0 = person 이므로, 사람으로 인식된 객체 개수 세기
        person_count = int((results.xyxyn[0][:, -1] == 0).sum().item())
        logger.info(f"감지된 사람 수: {person_count}")

        # 5) JSON으로 결과 반환
        return {"person_count": person_count}

    except HTTPException:
        # FastAPI HTTPException은 그대로 던져주기
        raise

    except Exception as e:
        # 내부 에러 발생 시, 로그 출력 후 500 에러로 응답
        logger.error(f"에러 발생: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500,
                            detail=f"서버 에러: {e}\n{traceback.format_exc()}")

# ──────────────── 메인 함수(직접 실행 시 Uvicorn 실행) ─────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
