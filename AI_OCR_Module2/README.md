# AI-OCR and Document Verification (Module 2)

## Overview
This module extracts and verifies KYC information (Aadhaar, PAN) using OCR and regex validation.

## Setup
```bash
pip install -r requirements.txt
```

Ensure **Tesseract OCR** is installed on your system.
- Windows: https://github.com/tesseract-ocr/tesseract
- Linux/macOS:
  ```bash
  sudo apt install tesseract-ocr
  ```

## Run
```bash
python ai_ocr_verification.py
```
Outputs are saved in `output/results.json` and `output/results.csv`.
