JOB_ROLES = {
    "Data Scientist": [
        "Python",
        "SQL",
        "Pandas",
        "NumPy",
        "Scikit-learn",
        "Machine Learning",
        "Statistics",
        "Data Visualization",
        "Power BI",
    ],

    "Data Analyst": [
        "Python",
        "SQL",
        "Pandas",
        "NumPy",
        "Power BI",
        "Excel",
        "Data Visualization",
        "Statistics",
    ],

    "Python Developer": [
        "Python",
        "Django",
        "Flask",
        "SQL",
        "REST API",
        "Git",
        "GitHub",
        "Object-Oriented Programming",
    ],

    "ML Engineer": [
        "Python",
        "SQL",
        "Machine Learning",
        "Scikit-learn",
        "Pandas",
        "NumPy",
        "Git",
        "REST API",
    ],

    "AI Engineer": [
        "Python",
        "Machine Learning",
        "Deep Learning",
        "NLP",
        "SQL",
        "REST API",
        "Git",
    ],
}


SKILL_RECOMMENDATIONS = {
    "Statistics": "Learn descriptive statistics, probability, hypothesis testing, and basic statistical analysis.",
    
    "Data Visualization": "Practice creating clear dashboards and visualizations using Power BI, Matplotlib, Seaborn, or Plotly.",
    
    "Excel": "Practice Excel formulas, PivotTables, charts, lookup functions, and data cleaning.",
    
    "Deep Learning": "Learn neural networks, CNNs, RNNs, and basic TensorFlow or PyTorch workflows.",
    
    "NLP": "Learn text preprocessing, embeddings, text classification, and basic NLP pipelines.",
    
    "Docker": "Learn Docker fundamentals, images, containers, Dockerfiles, and containerized application deployment.",
    
    "AWS": "Learn AWS fundamentals including EC2, S3, IAM, and basic cloud deployment.",
    
    "REST API": "Practice building and consuming REST APIs using Django REST Framework or Flask.",
    
    "Git": "Practice Git branching, merging, pull requests, and collaborative GitHub workflows.",
}


def get_recommendations(missing_skills):
    recommendations = []

    for skill in missing_skills:
        recommendation = SKILL_RECOMMENDATIONS.get(skill)

        if recommendation:
            recommendations.append({
                "skill": skill,
                "recommendation": recommendation
            })
        else:
            recommendations.append({
                "skill": skill,
                "recommendation": f"Learn and practice {skill}."
            })

    return recommendations

def get_required_skills(role):
    return JOB_ROLES.get(role, [])