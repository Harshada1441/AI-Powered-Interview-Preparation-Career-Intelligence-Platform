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


class InterviewCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        resume_id = request.data.get("resume_id")
        role = request.data.get("role")
        difficulty = request.data.get("difficulty", "medium")
        total_questions = request.data.get(
            "total_questions",
            10
        )

        # -----------------------------------------
        # Validate resume
        # -----------------------------------------

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

        # -----------------------------------------
        # Validate role
        # -----------------------------------------

        if not role:
            return Response(
                {"detail": "Role is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Validate difficulty
        # -----------------------------------------

        valid_difficulties = [
            "easy",
            "medium",
            "hard"
        ]

        if difficulty not in valid_difficulties:
            return Response(
                {
                    "detail": (
                        "Difficulty must be "
                        "easy, medium, or hard."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Validate number of questions
        # -----------------------------------------

        try:

            total_questions = int(
                total_questions
            )

            if (
                total_questions < 1
                or total_questions > 50
            ):
                raise ValueError

        except (ValueError, TypeError):

            return Response(
                {
                    "detail": (
                        "Number of questions must "
                        "be between 1 and 50."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Generate AI questions
        # -----------------------------------------

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
                    "detail": (
                        "Failed to generate "
                        "interview questions."
                    ),
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # -----------------------------------------
        # Create interview
        # -----------------------------------------

        interview = Interview.objects.create(
            user=request.user,
            resume=resume,
            role=role,
            difficulty=difficulty,
            total_questions=total_questions
        )

        # -----------------------------------------
        # Save generated questions
        # -----------------------------------------

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

        # -----------------------------------------
        # Return interview
        # -----------------------------------------

        serializer = InterviewSerializer(
            interview
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class InterviewAnswerView(APIView):

    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
        interview_id,
        question_id
    ):

        # -----------------------------------------
        # Validate interview
        # -----------------------------------------

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

        # -----------------------------------------
        # Validate question
        # -----------------------------------------

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

        # -----------------------------------------
        # Get recorded audio
        # -----------------------------------------

        audio_file = request.FILES.get(
            "audio"
        )

        if not audio_file:

            return Response(
                {
                    "detail": (
                        "Audio file is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Evaluate audio using Gemini
        # -----------------------------------------

        try:

            result = evaluate_audio_answer(
                audio_file=audio_file,
                question=question.question,
                role=interview.role,
                difficulty=interview.difficulty
            )

            transcript = str(
                result.get(
                    "transcript",
                    ""
                )
            ).strip()

            score = float(
                result.get(
                    "score",
                    0
                )
            )

            feedback = str(
                result.get(
                    "feedback",
                    ""
                )
            ).strip()

            # -----------------------------------------
            # Validate transcript
            # -----------------------------------------

            if not transcript:

                return Response(
                    {
                        "detail": (
                            "No speech could be "
                            "detected in the "
                            "recorded audio."
                        )
                    },
                    status=(
                        status.HTTP_422_UNPROCESSABLE_ENTITY
                    )
                )

            # -----------------------------------------
            # Save question answer
            # -----------------------------------------

            question.user_answer = transcript
            question.answer_score = score
            question.answer_feedback = feedback
            question.is_correct = score >= 5

            question.save(
                update_fields=[
                    "user_answer",
                    "answer_score",
                    "answer_feedback",
                    "is_correct"
                ]
            )

            # -----------------------------------------
            # Calculate overall interview score
            # -----------------------------------------

            answered_questions = (
                interview.questions.filter(
                    answer_score__isnull=False
                )
            )

            if answered_questions.exists():

                total_score = sum(
                    float(q.answer_score)
                    for q in answered_questions
                )

                question_count = (
                    answered_questions.count()
                )

                overall_score = round(
                    total_score / question_count,
                    2
                )

                interview.score = (
                    overall_score
                )

                # -------------------------------------
                # Overall feedback
                # -------------------------------------

                if overall_score >= 8.5:

                    overall_feedback = (
                        "Excellent interview "
                        "performance. You demonstrated "
                        "strong technical knowledge, "
                        "good understanding of the "
                        "questions, and clear answers."
                    )

                elif overall_score >= 7:

                    overall_feedback = (
                        "Good interview performance. "
                        "You demonstrated a solid "
                        "understanding of the technical "
                        "concepts. Focus on improving "
                        "answer depth and clarity."
                    )

                elif overall_score >= 5:

                    overall_feedback = (
                        "Average interview performance. "
                        "You have a basic understanding "
                        "of the concepts, but you should "
                        "improve technical depth, "
                        "practical examples, and "
                        "answer clarity."
                    )

                else:

                    overall_feedback = (
                        "Your interview performance "
                        "needs improvement. Focus on "
                        "strengthening your technical "
                        "concepts and practicing "
                        "practical interview questions."
                    )

                interview.feedback = (
                    overall_feedback
                )

                interview.save(
                    update_fields=[
                        "score",
                        "feedback"
                    ]
                )

            # -----------------------------------------
            # Return result
            # -----------------------------------------

            return Response(
                {
                    "question_id": question.id,
                    "transcript": transcript,
                    "score": score,
                    "feedback": feedback,
                    "overall_score": (
                        interview.score
                    ),
                    "overall_feedback": (
                        interview.feedback
                    )
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:

            print(
                "Audio evaluation error:",
                repr(e)
            )

            return Response(
                {
                    "detail": (
                        "Failed to evaluate "
                        "audio answer."
                    ),
                    "error": str(e)
                },
                status=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            )


class InterviewListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        interviews = (
            Interview.objects
            .filter(
                user=request.user
            )
            .order_by("-created_at")
        )

        serializer = InterviewSerializer(
            interviews,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )