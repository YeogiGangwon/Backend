# python-api/app.py

import pathlib
pathlib.PosixPath = pathlib.WindowsPath

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import cv2
import torch

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    
    allow_methods=["POST"],
    allow_headers=["*"],
)

# 사전 로드된 YOLOv5 모델
model = torch.hub.load(
    'ultralytics/yolov5',      
    'custom',
    path='runs/train/cctv_person/weights/best.pt',
    force_reload=False
).autoshape()

@app.post("/congestion")
async def congestion(file: UploadFile = File(...)):
    # 1) 파일 타입 체크
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드하세요")
    # 2) 버퍼 읽기
    data = await file.read()
    npimg = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="이미지 디코딩 실패")
    # 3) YOLO 추론
    results = model(img)
    # class 0 = person
    person_count = int((results.xyxyn[0][:, -1] == 0).sum().item())
    # 4) JSON 반환
    return {"person_count": person_count}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
