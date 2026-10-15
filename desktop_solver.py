"""
AI Study Assistant - Desktop Screen Solver (Python Edition)
No Node.js or Docker required! Works on any Windows/Mac/Linux with Python.

Run with:
    pip install google-genai pillow
    python desktop_solver.py
"""

import os
import sys
import json
import time
import tkinter as tk
from tkinter import ttk, messagebox
from io import BytesIO
from PIL import ImageGrab, Image

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("\n[!] Please install google-genai first:\n    pip install google-genai pillow\n")
    sys.exit(1)

# Default to environment variable or prompt user
API_KEY = os.environ.get("GEMINI_API_KEY", "")

class DesktopStudyAssistant(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("AI Study Assistant - Screen Solver (Python)")
        self.geometry("520x680")
        self.configure(bg="#0b0f19")
        self.attributes('-topmost', True)  # Keep window floating over tests/exams

        self.api_key = API_KEY
        self.create_widgets()

    def create_widgets(self):
        # Header frame
        header = tk.Frame(self, bg="#0f172a", pady=12, padx=16)
        header.pack(fill="x")

        title_lbl = tk.Label(
            header,
            text="⚡ AI Study Assistant",
            font=("Segoe UI", 16, "bold"),
            fg="#38bdf8",
            bg="#0f172a"
        )
        title_lbl.pack(anchor="w")

        sub_lbl = tk.Label(
            header,
            text="Floating Screen Solver (< 3 Seconds) • Python Native",
            font=("Segoe UI", 9),
            fg="#94a3b8",
            bg="#0f172a"
        )
        sub_lbl.pack(anchor="w")

        # API Key bar if not in env
        if not self.api_key:
            key_frame = tk.Frame(self, bg="#1e293b", padx=10, pady=8)
            key_frame.pack(fill="x", padx=12, pady=8)
            tk.Label(key_frame, text="Gemini API Key:", fg="#cbd5e1", bg="#1e293b", font=("Segoe UI", 9)).pack(anchor="w")
            self.key_entry = tk.Entry(key_frame, bg="#0f172a", fg="white", insertbackground="white", font=("Segoe UI", 9))
            self.key_entry.pack(fill="x", pady=4)
        else:
            self.key_entry = None

        # Main Big Action Button
        btn_frame = tk.Frame(self, bg="#0b0f19", padx=12, pady=6)
        btn_frame.pack(fill="x")

        self.solve_btn = tk.Button(
            btn_frame,
            text="📸 CAPTURE SCREEN & SOLVE (< 3s)",
            font=("Segoe UI", 12, "bold"),
            bg="#4f46e5",
            fg="white",
            activebackground="#4338ca",
            activeforeground="white",
            relief="flat",
            padx=16,
            pady=12,
            cursor="hand2",
            command=self.capture_and_solve
        )
        self.solve_btn.pack(fill="x")

        # Status / Latency indicator
        self.status_lbl = tk.Label(
            self,
            text="Ready. Position this window beside your test and click Capture.",
            font=("Segoe UI", 9),
            fg="#38bdf8",
            bg="#0b0f19",
            pady=4
        )
        self.status_lbl.pack()

        # Results Display Card
        res_frame = tk.Frame(self, bg="#111827", padx=12, pady=12, relief="groove", bd=1)
        res_frame.pack(fill="both", expand=True, padx=12, pady=8)

        # Choice label
        self.ans_badge = tk.Label(
            res_frame,
            text="CORRECT ANSWER WILL APPEAR HERE",
            font=("Segoe UI", 13, "bold"),
            fg="#10b981",
            bg="#111827"
        )
        self.ans_badge.pack(anchor="w", pady=(0, 6))

        # Text area for question & step-by-step reasoning
        self.res_text = tk.Text(
            res_frame,
            wrap="word",
            bg="#0a0e17",
            fg="#e2e8f0",
            insertbackground="white",
            font=("Segoe UI", 10),
            padx=10,
            pady=10,
            relief="flat"
        )
        self.res_text.pack(fill="both", expand=True)

    def capture_and_solve(self):
        key = self.key_entry.get().strip() if self.key_entry else self.api_key
        if not key:
            messagebox.showerror("API Key Missing", "Please enter your free Gemini API key from aistudio.google.com/app/apikey")
            return

        self.solve_btn.config(state="disabled", text="⏳ Analyzing Screen...", bg="#374151")
        self.status_lbl.config(text="Taking screen snapshot...", fg="#f59e0b")
        self.update()

        t0 = time.time()
        try:
            # 1. Hide window for 150ms to capture clean desktop screen underneath
            self.withdraw()
            time.sleep(0.18)
            screenshot = ImageGrab.grab()
            self.deiconify()

            # Downscale for ultra-fast upload
            max_dim = 1080
            if max(screenshot.size) > max_dim:
                screenshot.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            buffered = BytesIO()
            screenshot.save(buffered, format="JPEG", quality=76)
            img_bytes = buffered.getvalue()

            self.status_lbl.config(text="Sending to Gemini AI (< 3s)...", fg="#38bdf8")
            self.update()

            client = genai.Client(api_key=key)

            prompt = """
Analyze the question on the screen.
Solve in under 2 seconds.
Return valid JSON only with keys:
correctAnswerLabel: (string, e.g. "B")
correctAnswerText: (string)
questionText: (string)
stepByStepExplanation: (array of 2 short steps)
summaryExplanation: (1 short sentence)
"""
            part = types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg")
            response = client.models.generate_content(
                model='gemini-flash-lite-latest',
                contents=[part, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    max_output_tokens=500
                )
            )

            raw = response.text.strip()
            if raw.startswith("```"):
                raw = raw.replace("```json", "").replace("```", "").strip()

            parsed = json.loads(raw)
            duration = round(time.time() - t0, 2)

            # Update GUI
            choice = parsed.get("correctAnswerLabel", "Answer")
            ans_val = parsed.get("correctAnswerText", "")
            self.ans_badge.config(
                text=f"🎯 CORRECT: [{choice}] {ans_val}",
                fg="#10b981"
            )

            steps = parsed.get("stepByStepExplanation", [])
            steps_str = "\n".join([f"• {s}" for s in steps])
            summary = parsed.get("summaryExplanation", "")
            q_text = parsed.get("questionText", "")

            display_content = f"QUESTION:\n{q_text}\n\nREASONING ({duration}s):\n{steps_str}\n\nSUMMARY:\n{summary}"
            self.res_text.delete("1.0", tk.END)
            self.res_text.insert(tk.END, display_content)

            self.status_lbl.config(text=f"⚡ Solved in {duration}s!", fg="#10b981")

        except Exception as e:
            self.deiconify()
            self.status_lbl.config(text=f"Error: {str(e)[:60]}", fg="#ef4444")
            self.res_text.delete("1.0", tk.END)
            self.res_text.insert(tk.END, f"Error occurred: {str(e)}")
        finally:
            self.solve_btn.config(state="normal", text="📸 CAPTURE SCREEN & SOLVE (< 3s)", bg="#4f46e5")

if __name__ == "__main__":
    app = DesktopStudyAssistant()
    app.mainloop()
