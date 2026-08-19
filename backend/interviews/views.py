import json
import os
import tempfile
import subprocess

from google import genai
from google.genai import types
from dotenv import load_dotenv
from imageio_ffmpeg import get_ffmpeg_exe

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Interview, InterviewQuestion
from resumes.models import Resume
from .serializers import InterviewSerializer
from .services import (
    generate_interview_questions,
    evaluate_audio_answer,
)

class InterviewAnswerView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, interview_id, question_id):

        try:
            interview = Interview.objects.get(
                id=interview_id,
                user=request.user
            )

        except Interview.DoesNotExist:
            return Response(
                {"detail": "Interview not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            question = InterviewQuestion.objects.get(
                id=question_id,
                interview=interview
            )

        except InterviewQuestion.DoesNotExist:
            return Response(
                {"detail": "Interview question not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        audio_file = request.FILES.get("audio")

        if not audio_file:
            return Response(
                {"detail": "Audio file is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        load_dotenv()

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            return Response(
                {"detail": "GEMINI_API_KEY is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        webm_path = None
        wav_path = None

        try:

            # -----------------------------------------
            # SAVE RECORDED AUDIO
            # -----------------------------------------

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".webm"
            ) as temp_audio:

                for chunk in audio_file.chunks():
                    temp_audio.write(chunk)

                webm_path = temp_audio.name

            # -----------------------------------------
            # CONVERT WEBM → WAV
            # Gemini supports WAV reliably.
            # -----------------------------------------

            ffmpeg = get_ffmpeg_exe()

            wav_path = webm_path.replace(
                ".webm",
                ".wav"
            )

            subprocess.run(
                [
                    ffmpeg,
                    "-y",
                    "-i",
                    webm_path,
                    "-ar",
                    "16000",
                    "-ac",
                    "1",
                    wav_path
                ],
                check=True,
                capture_output=True
            )

            # -----------------------------------------
            # GEMINI
            # -----------------------------------------

            client = genai.Client(
                api_key=api_key
            )

            with open(
                wav_path,
                "rb"
            ) as audio:

                audio_bytes = audio.read()

            prompt = f"""
You are conducting a real technical job interview.

Target Role:
{interview.role}

Interview Difficulty:
{interview.difficulty}

Interview Question:
{question.question}

The candidate's answer is provided as audio.

Your tasks:

1. Carefully listen to the candidate's audio.
2. Transcribe exactly what the candidate said.
3. Evaluate the answer against the interview question.
4. Give a score from 0 to 10.
5. Give concise professional interview feedback.
6. Do not invent information that the candidate did not say.

Return ONLY valid JSON.

Use exactly this format:

{{
    "transcript": "What the candidate actually said",
    "score": 0,
    "feedback": "Professional feedback about the answer"
}}
"""

            # -----------------------------------------
            # MODEL WITH FALLBACK
            # -----------------------------------------

            models = [
                "gemini-3.6-flash",
                "gemini-2.5-flash",
            ]

            response = None
            last_error = None

            for model_name in models:

                try:

                    response = client.models.generate_content(
                        model=model_name,
                        contents=[
                            prompt,
                            types.Part.from_bytes(
                                data=audio_bytes,
                                mime_type="audio/wav"
                            )
                        ]
                    )

                    if response:
                        break

                except Exception as model_error:

                    last_error = model_error

                    print(
                        f"Gemini model failed: "
                        f"{model_name} -> {model_error}"
                    )

            if response is None:
                raise last_error

            # -----------------------------------------
            # PARSE GEMINI RESPONSE
            # -----------------------------------------

            response_text = (
                response.text
                .strip()
            )

            # Remove markdown fences if Gemini adds them
            if response_text.startswith("```"):
                response_text = (
                    response_text
                    .replace("```json", "")
                    .replace("```", "")
                    .strip()
                )

            result = json.loads(
                response_text
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
            except (ValueError, TypeError):
                score = 0

            score = max(
                0,
                min(
                    10,
                    score
                )
            )

            # -----------------------------------------
            # SAVE ANSWER
            # -----------------------------------------

            question.user_answer = transcript

            question.is_correct = (
                score >= 5
            )

            question.save(
                update_fields=[
                    "user_answer",
                    "is_correct"
                ]
            )

            return Response(
                {
                    "transcript": transcript,
                    "score": score,
                    "feedback": feedback
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:

            print(
                "Interview answer error:",
                repr(e)
            )

            return Response(
                {
                    "detail": "Failed to process audio answer.",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        finally:

            # -----------------------------------------
            # DELETE TEMP FILES
            # -----------------------------------------

            if webm_path and os.path.exists(
                webm_path
            ):
                try:
                    os.remove(webm_path)
                except OSError:
                    pass

            if wav_path and os.path.exists(
                wav_path
            ):
                try:
                    os.remove(wav_path)
                except OSError:
                    pass


                
class InterviewCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        resume_id = request.data.get("resume_id")
        role = request.data.get("role")
        difficulty = request.data.get("difficulty", "medium")
        total_questions = request.data.get("total_questions", 10)


        # Validate resume
        if not resume_id:
            return Response(
                {"detail": "Resume ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            resume = Resume.objects.get(
                id=resume_id,
                user=request.user
            )

        except Resume.DoesNotExist:
            return Response(
                {"detail": "Resume not found."},
                status=status.HTTP_404_NOT_FOUND
            )   
        
        # Validate role
        if not role:
            return Response(
                {"detail": "Role is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate difficulty
        valid_difficulties = [
            "easy",
            "medium",
            "hard"
        ]

        if difficulty not in valid_difficulties:
            return Response(
                {
                    "detail": "Difficulty must be easy, medium, or hard."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate number of questions
        try:
            total_questions = int(total_questions)

            if total_questions < 1 or total_questions > 50:
                raise ValueError

        except (ValueError, TypeError):
            return Response(
                {
                    "detail": "Number of questions must be between 1 and 50."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate AI questions
        try:
            questions = generate_interview_questions(
                role=role,
                difficulty=difficulty,
                total_questions=total_questions,
                resume_text=resume.extracted_text
            )

        except Exception as e:
            return Response(
                {
                    "detail": "Failed to generate interview questions.",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Create interview
        interview = Interview.objects.create(
            user=request.user,
            resume=resume,
            role=role,
            difficulty=difficulty,
            total_questions=total_questions
        )

        # Save generated questions
        for index, question_data in enumerate(
            questions,
            start=1
        ):

            InterviewQuestion.objects.create(
                interview=interview,
                question=question_data["question"],
                difficulty=question_data.get(
                    "difficulty",
                    difficulty
                ),
                order=index
            )

        # Return interview with questions
        serializer = InterviewSerializer(interview)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class InterviewAnswerView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, interview_id, question_id):

        audio_file = request.FILES.get("audio")

        if not audio_file:
            return Response(
                {"detail": "Audio file is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            interview = Interview.objects.get(
                id=interview_id,
                user=request.user
            )
        except Interview.DoesNotExist:
            return Response(
                {"detail": "Interview not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            question = InterviewQuestion.objects.get(
                id=question_id,
                interview=interview
            )
        except InterviewQuestion.DoesNotExist:
            return Response(
                {"detail": "Question not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:

            result = evaluate_audio_answer(
                audio_file=audio_file,
                question=question.question,
                role=interview.role,
                difficulty=interview.difficulty
            )

            transcript = result.get(
                "transcript",
                ""
            )

            score = result.get(
                "score",
                0
            )

            feedback = result.get(
                "feedback",
                ""
            )

            question.user_answer = transcript
            question.answer_score = score
            question.answer_feedback = feedback

            question.is_correct = (
                float(score) >= 5
            )

            question.save()

            return Response(
                {
                    "question_id": question.id,
                    "transcript": transcript,
                    "score": score,
                    "feedback": feedback
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:

            return Response(
                {
                    "detail": "Failed to evaluate audio answer.",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class InterviewListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        interviews = Interview.objects.filter(
            user=request.user
        ).order_by("-created_at")

        serializer = InterviewSerializer(
            interviews,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )