import cv2
import pytesseract
from PIL import Image
import re
import json
import os
import pandas as pd

# -----------------------------------------------------
# MODULE 2: AI-OCR AND DOCUMENT VERIFICATION
# -----------------------------------------------------
# Purpose: Extract Aadhaar/PAN card data using OCR and validate it using regex.
# -----------------------------------------------------

# 1️⃣ OCR FUNCTION
def extract_text(image_path):
    """Extract raw text from image using Tesseract OCR"""
    try:
        img = cv2.imread(image_path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (3, 3), 0)
        text = pytesseract.image_to_string(gray)
        return text
    except Exception as e:
        print("Error during OCR:", e)
        return ""

# 2️⃣ FIELD EXTRACTION USING REGEX
def extract_fields(text):
    """Extract Name, DOB, and Aadhaar number using regex patterns"""
    aadhaar_pattern = r"\b\d{4}\s\d{4}\s\d{4}\b"
    dob_pattern = r"\b(\d{2}[/-]\d{2}[/-]\d{4})\b"
    name_pattern = r"([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)"

    aadhaar = re.findall(aadhaar_pattern, text)
    dob = re.findall(dob_pattern, text)
    name = re.findall(name_pattern, text)

    data = {
        "Name": name[0] if name else "Not Found",
        "DOB": dob[0] if dob else "Not Found",
        "Aadhaar_No": aadhaar[0] if aadhaar else "Not Found",
        "Extracted_Text": text.strip()
    }
    return data

# 3️⃣ VERIFICATION FUNCTION
def verify_fields(data):
    """Validate Aadhaar and DOB format"""
    aadhaar_valid = bool(re.match(r"^\d{4}\s\d{4}\s\d{4}$", data["Aadhaar_No"]))
    dob_valid = bool(re.match(r"^\d{2}[/-]\d{2}[/-]\d{4}$", data["DOB"]))

    if aadhaar_valid and dob_valid and data["Name"] != "Not Found":
        data["Verification_Status"] = "✅ Passed"
    else:
        data["Verification_Status"] = "⚠️ Failed"
    return data

# 4️⃣ SAVE RESULTS TO JSON + CSV
def save_results(data, output_json="output/results.json", output_csv="output/results.csv"):
    """Save verified data in JSON and CSV formats"""
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, "w") as f:
        json.dump(data, f, indent=4)
    df = pd.DataFrame([data])
    df.to_csv(output_csv, index=False)
    print(f"Results saved to {output_json} and {output_csv}")

# 5️⃣ MAIN EXECUTION
if __name__ == "__main__":
    image_path = "data/sample_aadhaar.jpg"  # Update this path to your image
    print("🔹 Starting AI-OCR and Verification...")
    text = extract_text(image_path)
    data = extract_fields(text)
    verified_data = verify_fields(data)
    save_results(verified_data)
    print("\n✅ Verification Completed Successfully!")
    print(json.dumps(verified_data, indent=2))
