from rest_framework import serializers
from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Resume
        fields = [
            "id",
            "title",
            "file",
            "uploaded_at",
            "extracted_text",
        ]
        read_only_fields = [
            "id",
            "extracted_text",
            "uploaded_at",
]