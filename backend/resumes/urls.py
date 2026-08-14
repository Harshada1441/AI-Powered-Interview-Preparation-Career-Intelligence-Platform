from django.urls import path
from .views import ResumeUploadView, ResumeListView, ResumeDetailView

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
]