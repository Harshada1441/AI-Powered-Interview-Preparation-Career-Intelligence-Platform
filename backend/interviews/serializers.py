from rest_framework import serializers
from .models import Interview, InterviewQuestion


class InterviewQuestionSerializer(serializers.ModelSerializer):

    class Meta:
        model = InterviewQuestion

        fields = [
            "id",
            "question",
            "difficulty",
            "order",
            "user_answer",
            "answer_score",
            "answer_feedback",
            "is_correct",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "answer_score",
            "answer_feedback",
            "is_correct",
            "created_at",
        ]


class InterviewSerializer(serializers.ModelSerializer):

    questions = InterviewQuestionSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Interview
        fields = [
            "id",
            "role",
            "difficulty",
            "total_questions",
            "score",
            "feedback",
            "created_at",
            "questions",
        ]

        read_only_fields = [
            "id",
            "score",
            "feedback",
            "created_at",
            "questions",
        ]