import json
import os
import tempfile
import subprocess
import time

from google import genai
from dotenv import load_dotenv
from imageio_ffmpeg import get_ffmpeg_exe


load_dotenv()


# =========================================================
# GENERATE INTERVIEW QUESTIONS
# =========================================================

def generate_interview_questions(
    role,
    difficulty="medium",
    total_questions=10,
    resume_text=""
):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured."
        )

    client = genai.Client(
        api_key=api_key
    )

    resume_text = (
        resume_text or ""
    ).strip()

    if len(resume_text) > 12000:
        resume_text = resume_text[:12000]

    prompt = f"""
You are an expert technical interviewer conducting
a personalized job interview.

Target Job Role:
{role}

Interview Difficulty:
{difficulty}

Candidate Resume:
{resume_text}

Generate {total_questions} interview questions.

Requirements:

1. Questions must be relevant to the selected job role.
2. Questions must be personalized using the candidate's resume.
3. Ask questions about skills mentioned in the resume.
4. Ask questions about projects mentioned in the resume.
5. Ask practical and scenario-based questions.
6. Include a mixture of:
   - Resume-based questions
   - Technical questions
   - Practical questions
   - Scenario-based questions
7. Do not invent skills, projects, education,
   or experience.
8. Avoid duplicate questions.
9. Questions must be suitable for a real job interview.
10. Keep questions clear and interview-friendly.
11. Return ONLY valid JSON.
12. Do not use markdown.

Return exactly:

[
    {{
        "question": "Question text",
        "difficulty": "{difficulty}"
    }}
]
"""

    models = [
        "gemini-3.1-flash-lite",
        "gemini-3.6-flash",
    ]

    last_error = None

    for model in models:

        for attempt in range(3):

            try:

                print(
                    f"Trying Gemini model: {model} "
                    f"(attempt {attempt + 1}/3)"
                )

                response = (
                    client.models.generate_content(
                        model=model,
                        contents=prompt
                    )
                )

                response_text = (
                    response.text.strip()
                )

                if response_text.startswith("```"):
                    response_text = (
                        response_text
                        .replace("```json", "")
                        .replace("```", "")
                        .strip()
                    )

                questions = json.loads(
                    response_text
                )

                if not isinstance(
                    questions,
                    list
                ):
                    raise ValueError(
                        "Gemini returned invalid question format."
                    )

                return questions

            except Exception as e:

                last_error = e

                error_text = str(e)

                print(
                    f"Gemini error: {error_text}"
                )

                temporary_error = (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                    or "429" in error_text
                    or "RESOURCE_EXHAUSTED" in error_text
                )

                if temporary_error and attempt < 2:

                    delay = 3 * (
                        2 ** attempt
                    )

                    print(
                        f"Retrying in {delay} seconds..."
                    )

                    time.sleep(delay)

                    continue

                break

    raise RuntimeError(
        "Gemini interview generation failed "
        f"after retries: {last_error}"
    )


# =========================================================
# EVALUATE AUDIO ANSWER
# =========================================================

def evaluate_audio_answer(
    audio_file,
    question,
    role,
    difficulty="medium"
):
    """
    Receives browser-recorded audio.

    Flow:

    Browser WebM
        ↓
    Temporary WebM file
        ↓
    FFmpeg
        ↓
    WAV 16kHz mono
        ↓
    Gemini
        ↓
    Transcript + Score + Feedback
    """

    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured."
        )

    client = genai.Client(
        api_key=api_key
    )

    webm_path = None
    wav_path = None
    uploaded_audio = None

    try:

        # =================================================
        # 1. SAVE BROWSER AUDIO
        # =================================================

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".webm"
        ) as temp_file:

            for chunk in audio_file.chunks():
                temp_file.write(chunk)

            webm_path = temp_file.name

        print(
            f"Audio saved: {webm_path}"
        )

        # =================================================
        # 2. GET FFMPEG
        # =================================================

        ffmpeg = get_ffmpeg_exe()

        print(
            f"FFmpeg: {ffmpeg}"
        )

        # =================================================
        # 3. WEBM → WAV
        # =================================================

        wav_path = (
            webm_path
            .replace(
                ".webm",
                ".wav"
            )
        )

        command = [
            ffmpeg,
            "-y",
            "-i",
            webm_path,
            "-ar",
            "16000",
            "-ac",
            "1",
            "-vn",
            wav_path,
        ]

        print(
            "Converting WebM to WAV..."
        )

        result = subprocess.run(
            command,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:

            print(
                "FFmpeg stderr:",
                result.stderr
            )

            raise RuntimeError(
                "Failed to convert recorded audio to WAV."
            )

        if not os.path.exists(
            wav_path
        ):

            raise RuntimeError(
                "WAV file was not created."
            )

        wav_size = os.path.getsize(
            wav_path
        )

        print(
            f"WAV created: {wav_size} bytes"
        )

        if wav_size < 1000:

            raise RuntimeError(
                "Recorded audio is empty or too small."
            )

        # =================================================
        # 4. UPLOAD WAV TO GEMINI
        # =================================================

        print(
            "Uploading audio to Gemini..."
        )

        uploaded_audio = client.files.upload(
            file=wav_path
        )

        print(
            "Audio uploaded successfully."
        )

        # =================================================
        # 5. AI INTERVIEW EVALUATION PROMPT
        # =================================================

        prompt = f"""
You are an expert technical interviewer.

Candidate Role:
{role}

Interview Difficulty:
{difficulty}

Interview Question:
{question}

The attached audio contains the candidate's
spoken answer to the interview question.

Your tasks:

1. Listen carefully to the complete audio.
2. Transcribe what the candidate actually said.
3. Do not invent words or information.
4. Evaluate whether the answer addresses the question.
5. Evaluate technical correctness.
6. Evaluate completeness.
7. Evaluate clarity.
8. Give a score from 0 to 10.
9. Give concise professional feedback.
10. If the candidate did not answer properly,
   reflect that in the score and feedback.

Return ONLY valid JSON.

Do not use markdown.

Return exactly:

{{
    "transcript": "Exact transcription of candidate answer",
    "score": 8,
    "feedback": "Concise professional interview feedback"
}}
"""

        # =================================================
        # 6. GEMINI MODEL FALLBACK
        # =================================================

        models = [
            "gemini-3.6-flash",
            "gemini-2.5-flash",
        ]

        response = None
        last_error = None

        for model in models:

            try:

                print(
                    f"Evaluating audio using {model}..."
                )

                response = (
                    client.models.generate_content(
                        model=model,
                        contents=[
                            prompt,
                            uploaded_audio
                        ]
                    )
                )

                if response:
                    break

            except Exception as e:

                last_error = e

                print(
                    f"Model {model} failed:"
                    f" {e}"
                )

                error_text = str(e)

                temporary_error = (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                    or "429" in error_text
                    or "RESOURCE_EXHAUSTED"
                    in error_text
                )

                if temporary_error:
                    time.sleep(2)
                    continue

        if response is None:

            raise RuntimeError(
                "All Gemini audio models failed: "
                f"{last_error}"
            )

        # =================================================
        # 7. READ GEMINI RESPONSE
        # =================================================

        response_text = (
            response.text.strip()
        )

        print(
            "Gemini response:"
        )

        print(
            response_text
        )

        # Remove markdown if returned
        if response_text.startswith("```"):

            response_text = (
                response_text
                .replace(
                    "```json",
                    ""
                )
                .replace(
                    "```",
                    ""
                )
                .strip()
            )

        # =================================================
        # 8. PARSE JSON
        # =================================================

        result = json.loads(
            response_text
        )

        if not isinstance(
            result,
            dict
        ):
            raise ValueError(
                "Gemini returned invalid evaluation format."
            )

        transcript = str(
            result.get(
                "transcript",
                ""
            )
        ).strip()

        feedback = str(
            result.get(
                "feedback",
                ""
            )
        ).strip()

        try:

            score = float(
                result.get(
                    "score",
                    0
                )
            )

        except (
            ValueError,
            TypeError
        ):

            score = 0

        score = max(
            0,
            min(
                10,
                score
            )
        )

        # =================================================
        # 9. VALIDATE TRANSCRIPT
        # =================================================

        if not transcript:

            raise ValueError(
                "Gemini could not detect any speech "
                "in the recorded audio."
            )

        return {
            "transcript": transcript,
            "score": score,
            "feedback": feedback,
        }

    finally:

        # =================================================
        # 10. CLEAN TEMP FILES
        # =================================================

        if webm_path and os.path.exists(
            webm_path
        ):

            try:
                os.remove(
                    webm_path
                )
            except OSError:
                pass

        if wav_path and os.path.exists(
            wav_path
        ):

            try:
                os.remove(
                    wav_path
                )
            except OSError:
                pass

        print(
            "Temporary audio files cleaned."
        )