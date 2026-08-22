from django.db import models
from django.conf import settings
from resumes.models import Resume


class Interview(models.Model):

    INTERVIEW_MODE_CHOICES = [
        ("resume", "Resume Based"),
        ("topic", "Topic Based"),
        ("hr", "HR Interview"),
    ]

    DIFFICULTY_CHOICES = [
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interviews"
    )

    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="interviews",
        null=True,
        blank=True
    )

    # -----------------------------------------
    # Interview Mode
    # -----------------------------------------

    mode = models.CharField(
        max_length=20,
        choices=INTERVIEW_MODE_CHOICES,
        default="resume"
    )

    # Used for Topic Based Interview
    topic = models.CharField(
        max_length=150,
        blank=True,
        default=""
    )

    role = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default="medium"
    )

    total_questions = models.PositiveIntegerField(
        default=10
    )

    score = models.FloatField(
        null=True,
        blank=True
    )

    feedback = models.TextField(
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.mode} - {self.role or self.topic} - {self.user}"


class InterviewQuestion(models.Model):

    QUESTION_TYPE_CHOICES = [
        ("introduction", "Self Introduction"),
        ("technical", "Technical"),
        ("hr", "HR"),
    ]

    interview = models.ForeignKey(
        Interview,
        on_delete=models.CASCADE,
        related_name="questions"
    )

    question = models.TextField()

    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPE_CHOICES,
        default="technical"
    )

    difficulty = models.CharField(
        max_length=20,
        default="medium"
    )

    order = models.PositiveIntegerField()

    user_answer = models.TextField(
        blank=True,
        default=""
    )

    answer_score = models.FloatField(
        null=True,
        blank=True
    )

    answer_feedback = models.TextField(
        blank=True,
        default=""
    )

    is_correct = models.BooleanField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"Q{self.order} - "
            f"{self.interview.role or self.interview.topic}"
        )
    