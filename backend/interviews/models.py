from django.db import models
from django.conf import settings
from resumes.models import Resume


class Interview(models.Model):
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

    role = models.CharField(max_length=100)

    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default="medium"
    )

    total_questions = models.PositiveIntegerField(default=10)

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
        return f"{self.role} - {self.user}"


class InterviewQuestion(models.Model):
    interview = models.ForeignKey(
        Interview,
        on_delete=models.CASCADE,
        related_name="questions"
    )

    question = models.TextField()

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
        return f"Q{self.order} - {self.interview.role}"