from .models import ResumeAnalysis
from .job_roles import get_required_skills,get_recommendations
from .parser import (
    parse_resume,
    extract_structured_experience,
    extract_structured_projects,
)


def analyze_resume(resume):
    result = parse_resume(resume.extracted_text or "")

    structured_experience = extract_structured_experience(
        resume.extracted_text or ""
    )

    structured_projects = extract_structured_projects(
        resume.extracted_text or ""
    )

    analysis, created = ResumeAnalysis.objects.update_or_create(
        resume=resume,
        defaults={
            "skills": result["skills"],
            "experience": structured_experience,
            "education": result["education"],
            "projects": structured_projects,
            "certifications": result["certifications"],
        }
    )

    return analysis



def normalize_skill(skill):
    """
    Normalize skill names so small formatting differences
    do not prevent matching.
    """

    return (
        skill.lower()
        .strip()
        .replace("-", "")
        .replace("_", "")
        .replace(" ", "")
        .replace(".", "")
    )


def calculate_resume_match(resume):

    analysis = resume.analysis

    target_role = analysis.target_role

    required_skills = get_required_skills(target_role)

    resume_skills = analysis.skills or []

    # Normalize resume skills
    normalized_resume_skills = {
        normalize_skill(skill)
        for skill in resume_skills
    }

    matched_skills = []
    missing_skills = []

    for required_skill in required_skills:

        normalized_required = normalize_skill(required_skill)

        if normalized_required in normalized_resume_skills:
            matched_skills.append(required_skill)
        else:
            missing_skills.append(required_skill)

    total_required = len(required_skills)

    if total_required == 0:
        score = 0
    else:
        score = round(
            (len(matched_skills) / total_required) * 100,
            2
        )

    return {
        "target_role": target_role,
        "score": score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "total_required_skills": total_required,
        "recommendations": get_recommendations(missing_skills),
    }
