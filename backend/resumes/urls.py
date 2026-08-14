from django.urls import path

from .views import (
    ResumeUploadView,
    ResumeListView,
    ResumeDetailView,
    ResumeAnalysisView,
    ResumeTargetRoleView,
    ResumeMatchView,
)

urlpatterns = [
    path(
        "upload/",
        ResumeUploadView.as_view(),
        name="resume-upload"
    ),

    path(
        "list/",
        ResumeListView.as_view(),
        name="resume-list"
    ),

    path(
        "<int:pk>/",
        ResumeDetailView.as_view(),
        name="resume-detail"
    ),

    path(
        "<int:pk>/analysis/",
        ResumeAnalysisView.as_view(),
        name="resume-analysis"
    ),
    path(
        "<int:pk>/target-role/",
        ResumeTargetRoleView.as_view(),
        name="resume-target-role"
    ),
    path(
        "<int:pk>/match/",
        ResumeMatchView.as_view(),
        name="resume-match"
    ),
]