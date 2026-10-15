import os
import json
import base64
import time
from io import BytesIO
from flask import Flask, request, jsonify, send_from_directory
from PIL import ImageGrab, Image

# Import official Google GenAI SDK
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("\n[!] Please install dependencies first:\n    pip install google-genai flask pillow\n")

app = Flask(__name__, static_folder='dist')

API_KEY = os.environ.get("GEMINI_API_KEY", "")

def get_gemini_client():
    key = API_KEY or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please set GEMINI_API_KEY.")
    return genai.Client(api_key=key)

@app.route('/api/analyze', methods=['POST'])
def analyze():
    start_time = time.time()
    try:
        data = request.get_json(force=True)
        img_b64 = data.get("image")
        text_prompt = data.get("text", "")
        lang = data.get("language", "auto")
        subject = data.get("subject", "auto")

        client = get_gemini_client()
        contents = []

        # Parse base64 image if provided
        if img_b64:
            if "," in img_b64:
                img_b64 = img_b64.split(",")[1]
            img_bytes = base64.b64decode(img_b64)
            # Downscale for < 3s latency
            img = Image.open(BytesIO(img_bytes))
            max_dim = 1080
            if max(img.size) > max_dim:
                img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            buffered = BytesIO()
            img.save(buffered, format="JPEG", quality=76)
            contents.append(
                types.Part.from_bytes(data=buffered.getvalue(), mime_type="image/jpeg")
            )

        prompt = f"""
You are a rapid educational AI tutor solving questions from screen sharing or user input.
Solve in under 2.5 seconds.
Target Language: {lang}
Subject: {subject}
{f'Question: {text_prompt}' if text_prompt else ''}

Return ONLY valid JSON with keys:
questionText (string)
detectedSubject (string)
detectedLanguage (string)
isMultipleChoice (boolean)
options (list of {{"label": "A/B/C/D", "text": "...", "isCorrect": true/false}})
correctAnswerLabel (string, e.g. "B")
correctAnswerText (string)
confidence (string: "HIGH")
confidenceScore (int: 100)
stepByStepExplanation (list of 2 concise strings)
summaryExplanation (1 clear sentence)
"""
        contents.append(prompt)

        # Call fastest model
        response = client.models.generate_content(
            model='gemini-flash-lite-latest',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=600,
            )
        )

        resp_text = response.text.strip()
        if resp_text.startswith("```"):
            resp_text = resp_text.split("```")[1]
            if resp_text.startswith("json"):
                resp_text = resp_text[4:].strip()

        parsed = json.loads(resp_text)
        duration_ms = int((time.time() - start_time) * 1000)
        parsed["durationMs"] = duration_ms

        return jsonify({
            "success": True,
            "data": parsed,
            "durationMs": duration_ms
        })

    except Exception as e:
        print("[!] Error in /api/analyze:", e)
        return jsonify({"success": False, "error": str(e)}), 500

# Standalone local screen snap endpoint
@app.route('/api/snap-my-screen', methods=['GET', 'POST'])
def snap_screen():
    """Captures the local PC desktop screen directly using PIL ImageGrab"""
    try:
        screenshot = ImageGrab.grab()
        screenshot.thumbnail((1080, 1080), Image.Resampling.LANCZOS)
        buffered = BytesIO()
        screenshot.save(buffered, format="JPEG", quality=76)
        b64_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return jsonify({"success": True, "image": f"data:image/jpeg;base64,{b64_str}"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 3000))
    print(f"\n=======================================================")
    print(f"  AI Study Assistant (Python Backend)")
    print(f"  Running on: http://localhost:{port}")
    print(f"=======================================================\n")
    app.run(host='0.0.0.0', port=port, debug=False)
