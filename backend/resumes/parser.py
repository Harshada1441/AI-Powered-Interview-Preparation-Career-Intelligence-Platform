import re


SKILLS = [
    "Python",
    "SQL",
    "Django",
    "Flask",
    "Machine Learning",
    "Scikit-learn",
    "Pandas",
    "NumPy",
    "Power BI",
    "Streamlit",
    "Plotly",
    "Matplotlib",
    "Seaborn",
    "MySQL",
    "SQLite",
    "Git",
    "GitHub",
    "REST API",
    "HTML",
    "CSS",
    "JavaScript",
]


def extract_skills(text):
    found_skills = []

    for skill in SKILLS:
        if re.search(
            r"\b" + re.escape(skill) + r"\b",
            text,
            re.IGNORECASE
        ):
            found_skills.append(skill)

    return found_skills


def extract_education(text):
    education = []

    patterns = [
        r"(?i)(B\.?Tech[^.\n]*)",
        r"(?i)(B\.?E\.?[^.\n]*)",
        r"(?i)(Diploma[^.\n]*)",
        r"(?i)(Higher Secondary Certificate[^.\n]*)",
        r"(?i)(Secondary School Certificate[^.\n]*)",
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text)

        for match in matches:
            value = match.strip()

            if value and value not in education:
                education.append(value)

    return education


def extract_certifications(text):
    certifications = []

    start = re.search(
        r"(?i)CERTIFICATIONS\s*&?\s*ACHIEVEMENTS",
        text
    )

    if start:
        section = text[start.end():]

        section = re.split(
            r"\n[A-Z][A-Z &]+(?:\n|$)",
            section,
            maxsplit=1
        )[0]

        for line in section.splitlines():
            line = line.strip(" •-\t")

            if not line:
                continue

            if line.lower().startswith("volunteer"):
                continue

            certifications.append(line)

    return certifications


def extract_experience(text):
    experience = []

    match = re.search(
        r"(?is)(?:^|\n)\s*EXPERIENCE\s*(?:\n|$)"
        r"(.*?)(?=\n\s*PROJECTS\s*(?:\n|$)|\Z)",
        text
    )

    if not match:
        return experience

    section = match.group(1).strip()

    lines = [
        line.strip(" •-\t")
        for line in section.splitlines()
        if line.strip()
    ]

    for line in lines:
        if line not in experience:
            experience.append(line)

    return experience


def extract_projects(text):
    projects = []

    match = re.search(
        r"(?is)(?:^|\n)\s*PROJECTS\s*(?:\n|$)"
        r"(.*?)(?=\n\s*EDUCATION\s*(?:\n|$)|\Z)",
        text
    )

    if not match:
        return projects

    section = match.group(1).strip()

    lines = [
        line.strip(" •-\t")
        for line in section.splitlines()
        if line.strip()
    ]

    for line in lines:
        if line not in projects:
            projects.append(line)

    return projects


def extract_structured_experience(text):
    experience = extract_experience(text)

    if not experience:
        return []

    role = experience[0]

    responsibilities = experience[1:]

    # PDF line-breaks merge करणे
    cleaned_responsibilities = []
    current = ""

    for line in responsibilities:
        if current:
            current += " " + line
        else:
            current = line

        # sentence पूर्ण झाल्यावर separate item
        if line.endswith("."):
            cleaned_responsibilities.append(current.strip())
            current = ""

    if current:
        cleaned_responsibilities.append(current.strip())

    return [
        {
            "role": role,
            "responsibilities": cleaned_responsibilities
        }
    ]


def extract_structured_projects(text):
    projects = extract_projects(text)

    if not projects:
        return []

    structured_projects = []

    current_project = None

    for line in projects:

        # GitHub project links
        if line.startswith("github.com/"):
            if current_project:
                current_project["github"] = line
            continue

        # Technology line
        if " · " in line:
            if current_project:
                current_project["technologies"] = [
                    tech.strip()
                    for tech in line.split("·")
                ]
            continue

        # Detect project names
        if (
            "Platform" in line
            or "Intelligence" in line
            or "Analytics" in line
        ):
            if current_project:
                structured_projects.append(current_project)

            current_project = {
                "name": line,
                "technologies": [],
                "github": "",
                "description": []
            }

            continue

        # Description
        if current_project:
            current_project["description"].append(line)

    if current_project:
        structured_projects.append(current_project)

    return structured_projects



def parse_resume(text):
    return {
        "skills": extract_skills(text),
        "experience": extract_experience(text),
        "education": extract_education(text),
        "projects": extract_projects(text),
        "certifications": extract_certifications(text),
    }