from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser


from .models import Resume, ResumeAnalysis
from .serializers import ResumeSerializer
from .utils import extract_text_from_pdf


class ResumeUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ResumeSerializer(data=request.data)

        if serializer.is_valid():
            resume = serializer.save(user=request.user)

            extracted_text = extract_text_from_pdf(resume.file)

            resume.extracted_text = extracted_text
            resume.save(update_fields=["extracted_text"])

            return Response(
                ResumeSerializer(resume).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )



class ResumeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resumes = Resume.objects.filter(user=request.user).order_by("-uploaded_at")

        serializer = ResumeSerializer(resumes, many=True)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
class ResumeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(
                id=pk,
                user=request.user
            )
        except Resume.DoesNotExist:
            return Response(
                {"detail": "Resume not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ResumeSerializer(resume)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def delete(self, request, pk):
        try:
            resume = Resume.objects.get(
                id=pk,
                user=request.user
            )
        except Resume.DoesNotExist:
            return Response(
                {"detail": "Resume not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        resume.delete()

        return Response(
            {"message": "Resume deleted successfully."},
            status=status.HTTP_200_OK
        )


class ResumeAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(
                id=pk,
                user=request.user
            )
        except Resume.DoesNotExist:
            return Response(
                {"detail": "Resume not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            analysis = resume.analysis
        except ResumeAnalysis.DoesNotExist:
            return Response(
                {"detail": "Resume analysis not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "resume": resume.title,
                "skills": analysis.skills,
                "experience": analysis.experience,
                "education": analysis.education,
                "projects": analysis.projects,
                "certifications": analysis.certifications,
            },
            status=status.HTTP_200_OK
        )



class ResumeTargetRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            resume = Resume.objects.get(
                id=pk,
                user=request.user
            )
        except Resume.DoesNotExist:
            return Response(
                {"detail": "Resume not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        target_role = request.data.get("target_role", "").strip()

        if not target_role:
            return Response(
                {"detail": "target_role is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        analysis, created = ResumeAnalysis.objects.get_or_create(
            resume=resume
        )

        analysis.target_role = target_role
        analysis.save(update_fields=["target_role"])

        return Response(
            {
                "resume": resume.title,
                "target_role": analysis.target_role
            },
            status=status.HTTP_200_OK
        )

class ResumeMatchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(
                id=pk,
                user=request.user
            )
        except Resume.DoesNotExist:
            return Response(
                {"detail": "Resume not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            analysis = resume.analysis
        except ResumeAnalysis.DoesNotExist:
            return Response(
                {"detail": "Resume analysis not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not analysis.target_role:
            return Response(
                {"detail": "Target role not set."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .services import calculate_resume_match

        result = calculate_resume_match(resume)

        return Response(
            result,
            status=status.HTTP_200_OK
        )