from django.urls import path

from .views import (
    InterviewCreateView,
    InterviewListView,
    InterviewAnswerView,
)


urlpatterns = [

    path(
        "create/",
        InterviewCreateView.as_view(),
        name="interview-create"
    ),

    path(
        "list/",
        InterviewListView.as_view(),
        name="interview-list"
    ),

    path(
        "<int:interview_id>/questions/<int:question_id>/answer/",
        InterviewAnswerView.as_view(),
        name="interview-answer"
    ),
]

