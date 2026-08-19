import json
import os
import time

from google import genai
from dotenv import load_dotenv


load_dotenv()


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

    client = genai.Client(api_key=api_key)

    # Limit resume text
    resume_text = (resume_text or "").strip()

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
4. Ask questions about the candidate's projects when relevant.
5. Ask practical and scenario-based technical questions.
6. Include a mixture of:
   - Resume-based questions
   - Technical questions
   - Practical questions
   - Scenario-based questions
7. Do not invent projects, skills, education, or experience
   that are not present in the resume.
8. Avoid duplicate questions.
9. Questions should be suitable for a real job interview.
10. Keep questions clear and interview-friendly.
11. Return ONLY valid JSON.
12. Do not add markdown or ```.

Return this exact JSON format:

[
    {{
        "question": "Question text",
        "difficulty": "{difficulty}"
    }}
]
"""

    # Models to try
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

                response = client.models.generate_content(
                    model=model,
                    contents=prompt
                )

                response_text = response.text.strip()

                questions = json.loads(response_text)

                if not isinstance(questions, list):
                    raise ValueError(
                        "Gemini returned an invalid question format."
                    )

                return questions

            except Exception as e:

                last_error = e

                error_text = str(e)

                print(
                    f"Gemini error using {model}: "
                    f"{error_text}"
                )

                # Retry only temporary server/rate-limit errors
                if (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                    or "429" in error_text
                    or "RESOURCE_EXHAUSTED" in error_text
                ):

                    if attempt < 2:

                        delay = 3 * (2 ** attempt)

                        print(
                            f"Retrying in {delay} seconds..."
                        )

                        time.sleep(delay)

                        continue

                # Do not retry invalid API key,
                # bad request, etc.
                break

    raise RuntimeError(
        f"Gemini interview generation failed after retries: "
        f"{last_error}"
    )

def evaluate_audio_answer(
    audio_file,
    question,
    role,
    difficulty="medium"
):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured."
        )

    client = genai.Client(api_key=api_key)

    uploaded_audio = client.files.upload(
        file=audio_file
    )

    prompt = f"""
You are an expert technical interviewer.

Candidate Role:
{role}

Interview Difficulty:
{difficulty}

Interview Question:
{question}

The attached audio contains the candidate's spoken answer.

Analyze the candidate's answer.

Return ONLY valid JSON.

Requirements:

1. Transcribe the candidate's spoken answer.
2. Evaluate how relevant the answer is to the question.
3. Evaluate technical correctness.
4. Evaluate completeness.
5. Give a score from 0 to 10.
6. Give concise constructive feedback.
7. Do not invent information that the candidate did not say.

Return exactly:

{{
    "transcript": "Transcribed answer",
    "score": 8.5,
    "feedback": "Constructive feedback about the answer"
}}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            prompt,
            uploaded_audio
        ]
    )

    response_text = response.text.strip()

    result = json.loads(response_text)

    if not isinstance(result, dict):
        raise ValueError(
            "Gemini returned an invalid evaluation format."
        )

    return result