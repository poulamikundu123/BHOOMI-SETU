"""
Image Preprocessing Pipeline using OpenCV.
Graceful fallback if OpenCV is unavailable.
"""
import os
import shutil
from typing import Optional
from app.config import settings

class PreprocessingResult:
    def __init__(self, output_path: str, steps: list, success: bool):
        self.output_path = output_path
        self.steps = steps
        self.success = success

def preprocess_document(input_path: str, output_dir: str = None) -> PreprocessingResult:
    """Full preprocessing pipeline: grayscale -> denoise -> deskew -> threshold"""
    if output_dir is None:
        output_dir = settings.PROCESSED_DIR
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.basename(input_path)
    base, ext = os.path.splitext(filename)
    output_path = os.path.join(output_dir, f"{base}_processed{ext}")
    steps = []
    try:
        import cv2
        import numpy as np
        img = cv2.imread(input_path)
        if img is None:
            raise ValueError("Could not read image")
        # 1. Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        steps.append("grayscale")
        # 2. Denoise
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        steps.append("denoising")
        # 3. Deskew
        coords = np.column_stack(np.where(denoised > 0))
        if len(coords) > 0:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            (h, w) = denoised.shape[:2]
            M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
            deskewed = cv2.warpAffine(denoised, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        else:
            deskewed = denoised
        steps.append("deskew")
        # 4. Contrast enhancement (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(deskewed)
        steps.append("contrast_enhancement")
        # 5. Adaptive thresholding
        thresh = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        steps.append("thresholding")
        # 6. Sharpen
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        sharpened = cv2.filter2D(thresh, -1, kernel)
        steps.append("sharpening")
        cv2.imwrite(output_path, sharpened)
        return PreprocessingResult(output_path=output_path, steps=steps, success=True)
    except ImportError:
        # OpenCV not available — copy original
        shutil.copy2(input_path, output_path)
        steps.append("passthrough_no_opencv")
        return PreprocessingResult(output_path=output_path, steps=steps, success=True)
    except Exception as e:
        shutil.copy2(input_path, output_path)
        steps.append(f"error: {str(e)}")
        return PreprocessingResult(output_path=output_path, steps=steps, success=False)