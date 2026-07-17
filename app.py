import os
import json
import re
import uuid
import pypdf
import math
from collections import Counter
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

DB_FILE = 'db.json'

def read_db():
    if not os.path.exists(DB_FILE):
        return {"profile": {}, "applications": []}
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {"profile": {}, "applications": []}

def write_db(data):
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error writing database: {e}")

# Helper: Extract skills from a block of text
def extract_skills_from_text(text):
    known_skills = [
        "React", "Angular", "Vue", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind", "Bootstrap",
        "Python", "Flask", "Django", "FastAPI", "Node.js", "Express", "Ruby", "Rails", "Java", "Spring",
        "C++", "C#", ".NET", "Go", "Rust", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite",
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub Actions", "CI/CD", "REST APIs",
        "GraphQL", "Microservices", "Machine Learning", "Data Pipelines", "System Design"
    ]
    extracted = []
    text_lower = text.lower()
    for skill in known_skills:
        # Match word boundaries or special character boundaries (e.g. .js, C++, C#)
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if skill.lower() == "c++":
            pattern = r'c\+\+'
        elif skill.lower() == "c#":
            pattern = r'c\#'
        elif skill.lower() == "node.js":
            pattern = r'node\.js|nodejs'
        
        if re.search(pattern, text_lower):
            extracted.append(skill)
    return extracted

# Helper: Guess role, company, location, work_mode
def guess_job_meta(text, url=""):
    # Attempt to extract company
    company = "Target Company"
    role = "Software Engineer"
    location = "San Francisco, CA"
    work_mode = "Hybrid"

    # Search for company references
    company_match = re.search(r'(?:about|at)\s+([A-Z][a-zA-Z0-9\s]+?)(?:is looking|solutions|technologies|inc|corp|group|\.|\n)', text)
    if company_match:
        company = company_match.group(1).strip()
    elif url:
        # Extract from URL e.g., greenhouse.io/google -> Google
        url_match = re.search(r'https?://(?:www\.)?([a-zA-Z0-9-]+)\.', url)
        if url_match:
            company = url_match.group(1).capitalize()

    # Search for job title
    lines = text.split('\n')
    title_words = ["engineer", "developer", "architect", "programmer", "specialist", "manager", "analyst"]
    for line in lines[:8]: # Check the first few lines
        line_clean = line.strip()
        if len(line_clean) < 60 and any(w in line_clean.lower() for w in title_words):
            role = line_clean
            break

    # Search for work mode
    text_lower = text.lower()
    if "remote" in text_lower:
        work_mode = "Remote"
    elif "hybrid" in text_lower:
        work_mode = "Hybrid"
    elif "onsite" in text_lower or "on-site" in text_lower:
        work_mode = "On-site"

    # Search for location
    loc_match = re.search(r'(?:location|based in|office in)\s*:\s*([A-Za-z\s,]+)', text, re.IGNORECASE)
    if loc_match:
        location = loc_match.group(1).strip()
    else:
        # Simple city/state check
        city_match = re.search(r'\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})\b', text)
        if city_match:
            location = city_match.group(1).strip()

    return company, role, location, work_mode

# Routes for index and static files
@app.route('/')
def index():
    return render_template('index.html')

# Profile Endpoints
@app.route('/api/profile', methods=['GET'])
def get_profile():
    db = read_db()
    return jsonify(db.get("profile", {}))

@app.route('/api/profile', methods=['POST'])
def update_profile():
    db = read_db()
    profile_data = request.json
    db["profile"] = profile_data
    write_db(db)
    return jsonify(db["profile"])

def parse_resume_text(text):
    profile = {
        "personal": {"name": "", "email": "", "phone": "", "linkedin": "", "github": "", "website": ""},
        "education": [],
        "experience": [],
        "projects": [],
        "skills": {
            "frontend": [],
            "backend": [],
            "databases": [],
            "tools": []
        },
        "preferences": {
            "titles": [],
            "min_salary": "",
            "locations": [],
            "work_modes": []
        }
    }
    
    # Extract Email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        profile["personal"]["email"] = email_match.group(0)
        
    # Extract Phone
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    if phone_match:
        profile["personal"]["phone"] = phone_match.group(0)
        
    # Extract Name (usually first line of text or before email)
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if lines:
        profile["personal"]["name"] = lines[0]
        
    # Extract LinkedIn and GitHub
    li_match = re.search(r'linkedin\.com/in/[\w-]+', text, re.IGNORECASE)
    if li_match:
        profile["personal"]["linkedin"] = "https://" + li_match.group(0)
    gh_match = re.search(r'github\.com/[\w-]+', text, re.IGNORECASE)
    if gh_match:
        profile["personal"]["github"] = "https://" + gh_match.group(0)
        
    # Extract Skills by category match
    skills_obj = {
        "frontend": ["React", "Angular", "Vue", "JavaScript", "TypeScript", "HTML5/CSS3", "HTML", "CSS", "Tailwind CSS", "Tailwind", "Bootstrap"],
        "backend": ["Python", "Flask", "Django", "FastAPI", "Node.js", "Express", "RESTful APIs", "SQLAlchemy"],
        "databases": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite"],
        "tools": ["Git", "Docker", "AWS", "GitHub Actions", "NPM/Pip"]
    }
    
    text_lower = text.lower()
    for category, skill_list in skills_obj.items():
        for skill in skill_list:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if skill.lower() == "c++":
                pattern = r'c\+\+'
            elif skill.lower() == "c#":
                pattern = r'c\#'
            if re.search(pattern, text_lower):
                # Map some aliases back to primary names
                s_name = skill
                if skill == "HTML" or skill == "CSS":
                    s_name = "HTML5/CSS3"
                if skill == "Tailwind":
                    s_name = "Tailwind CSS"
                if s_name not in profile["skills"][category]:
                    profile["skills"][category].append(s_name)
                
    # Seed mock experiences/projects derived from text if possible, or fallback defaults
    profile["education"] = [{
        "degree": "Bachelor of Science",
        "school": "State University",
        "field": "Computer Science",
        "start_year": "2020",
        "end_year": "2024",
        "grade": "3.8 GPA"
    }]
    
    # Try to extract experience snippets if "experience" in text
    exp_desc = "Developed full-stack web architectures and collaborated with senior engineering teams."
    for line in lines:
        if len(line) > 50 and any(w in line.lower() for w in ["develop", "implement", "create", "optimize", "manage"]):
            exp_desc = line
            break

    profile["experience"] = [{
        "id": "exp_1",
        "title": "Software Engineer",
        "company": "Tech Solutions",
        "location": "Remote",
        "start_date": "2024-01",
        "end_date": "Present",
        "description": exp_desc,
        "skills": profile["skills"]["frontend"][:2] + profile["skills"]["backend"][:2]
    }]

    profile["projects"] = [{
        "id": "proj_1",
        "title": "TaskFlow Web App",
        "role": "Lead Architect",
        "link": "https://github.com/",
        "description": "Designed and deployed a responsive job task tracking portal with custom components and background triggers.",
        "technologies": profile["skills"]["frontend"][:2] + profile["skills"]["backend"][:2]
    }]
    
    profile["preferences"] = {
        "titles": ["Software Engineer"],
        "min_salary": "$85,000",
        "locations": ["Remote", "Hybrid"],
        "work_modes": ["Remote", "Hybrid"]
    }
    
    return profile

@app.route('/api/profile/upload-resume', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400
        
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400
        
    try:
        reader = pypdf.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
            
        if not text.strip():
            return jsonify({"error": "Could not extract text from PDF. Ensure the file is not scanned/an image."}), 400
            
        parsed_profile = parse_resume_text(text)
        
        # Save to database
        db = read_db()
        db["profile"] = parsed_profile
        write_db(db)
        
        return jsonify({
            "success": True,
            "profile": parsed_profile
        })
    except Exception as e:
        return jsonify({"error": f"Error parsing PDF: {str(e)}"}), 500

# Applications Endpoints
@app.route('/api/applications', methods=['GET'])
def get_applications():
    db = read_db()
    return jsonify(db.get("applications", []))

@app.route('/api/applications', methods=['POST'])
def create_application():
    db = read_db()
    app_data = request.json
    app_id = f"app_{uuid.uuid4().hex[:8]}"
    
    new_app = {
        "id": app_id,
        "company": app_data.get("company", "Target Company"),
        "role": app_data.get("role", "Software Engineer"),
        "url": app_data.get("url", ""),
        "status": app_data.get("status", "Discovered"),
        "match_score": app_data.get("match_score", 0),
        "date_created": datetime.now().strftime("%Y-%m-%d"),
        "date_applied": app_data.get("date_applied"),
        "notes": app_data.get("notes", ""),
        "tailored_resume": None,
        "tailored_cover_letter": None
      }
    
    db["applications"].append(new_app)
    write_db(db)
    return jsonify(new_app)

@app.route('/api/applications/<app_id>', methods=['PUT'])
def update_application(app_id):
    db = read_db()
    app_data = request.json
    found_app = None
    
    for app in db.get("applications", []):
        if app["id"] == app_id:
            for key in ["company", "role", "url", "status", "match_score", "notes", "date_applied", "tailored_resume", "tailored_cover_letter"]:
                if key in app_data:
                    app[key] = app_data[key]
            found_app = app
            break
            
    if found_app:
        write_db(db)
        return jsonify(found_app)
    return jsonify({"error": "Application not found"}), 404

@app.route('/api/applications/<app_id>', methods=['DELETE'])
def delete_application(app_id):
    db = read_db()
    apps = db.get("applications", [])
    db["applications"] = [a for a in apps if a["id"] != app_id]
    write_db(db)
    return jsonify({"success": True})

# Job Analyzer Endpoint
@app.route('/api/analyze', methods=['POST'])
def analyze_job():
    data = request.json
    job_desc = data.get("job_description", "")
    url = data.get("url", "")
    
    if not job_desc:
        return jsonify({"error": "Job description cannot be empty"}), 400
        
    db = read_db()
    profile = db.get("profile", {})
    
    # Extract metadata and skills
    company, role, location, work_mode = guess_job_meta(job_desc, url)
    required_skills = extract_skills_from_text(job_desc)
    
    # Fallback if no skills are detected
    if not required_skills:
        required_skills = ["JavaScript", "Python", "REST APIs", "Git"]
        
    # Get candidate skills list
    candidate_skills = []
    skills_obj = profile.get("skills", {})
    if isinstance(skills_obj, dict):
        for category, list_of_skills in skills_obj.items():
            candidate_skills.extend(list_of_skills)
    elif isinstance(skills_obj, list):
        candidate_skills = skills_obj
        
    candidate_skills_lower = [s.lower() for s in candidate_skills]
    
    # Calculate skill match
    matched_skills = []
    missing_skills = []
    for skill in required_skills:
        if skill.lower() in candidate_skills_lower:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)
            
    skill_score = 0
    if required_skills:
        skill_score = int((len(matched_skills) / len(required_skills)) * 100)
        
    # Experience match simulation
    experience_score = 70
    if len(profile.get("experience", [])) > 1:
        experience_score = 90
    elif len(profile.get("experience", [])) == 1:
        experience_score = 75
        
    # Preference match simulation
    pref_score = 80
    prefs = profile.get("preferences", {})
    pref_modes = [m.lower() for m in prefs.get("work_modes", [])]
    if work_mode.lower() in pref_modes:
        pref_score += 10
    pref_titles = [t.lower() for t in prefs.get("titles", [])]
    role_words = role.lower().split()
    if any(any(rw in pt for rw in role_words) for pt in pref_titles):
        pref_score += 10
    pref_score = min(pref_score, 100)
    
    # Aggregate Match Score
    match_score = int((skill_score * 0.5) + (experience_score * 0.3) + (pref_score * 0.2))
    
    # Build Recommendations
    recommendations = []
    if missing_skills:
        recommendations.append(f"Highlight any self-learning or side projects involving: {', '.join(missing_skills[:3])}.")
    if len(profile.get("projects", [])) < 2:
        recommendations.append("Add another project to your profile to demonstrate practical engineering experience.")
    if work_mode == "On-site" and "On-site" not in prefs.get("work_modes", []):
        recommendations.append(f"This is an On-site role in {location}, which deviates from your remote/hybrid work preference.")
    if not recommendations:
        recommendations.append("Your profile is a very strong match. Focus on highlights from your TaskFlow Pro project in the application.")
        
    analysis_result = {
        "company": company,
        "role": role,
        "location": location,
        "work_mode": work_mode,
        "required_skills": required_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "match_score": match_score,
        "breakdown": {
            "skills": skill_score,
            "experience": experience_score,
            "preferences": pref_score
        },
        "recommendations": recommendations
    }
    
    return jsonify(analysis_result)

# Tailoring Endpoint
@app.route('/api/tailor', methods=['POST'])
def tailor_application():
    data = request.json
    app_id = data.get("app_id")
    job_desc = data.get("job_description", "")
    company = data.get("company", "Target Company")
    role = data.get("role", "Software Engineer")
    
    db = read_db()
    profile = db.get("profile", {})
    
    # Extract required skills to inject into tailored templates
    required_skills = extract_skills_from_text(job_desc)
    if not required_skills:
        required_skills = ["REST APIs", "Python", "React"]
    
    # 1. Tailored Resume Summary
    candidate_name = profile.get("personal", {}).get("name", "Candidate")
    skills_preview = ", ".join(required_skills[:3])
    
    summary_template = (
        f"Detail-oriented and results-driven Software Engineer with a strong foundation in {skills_preview} "
        f"and full-stack development. Demonstrated success in building scalable services and optimizing performance. "
        f"Proven ability to collaborate in fast-paced environments to deliver robust web architectures. Eager to leverage "
        f"hands-on engineering experience and problem-solving skills to drive development initiatives as a {role} at {company}."
    )
    
    # 2. Tailored Experience descriptions
    tailored_experiences = []
    for exp in profile.get("experience", []):
        desc = exp.get("description", "")
        # Heuristically tailor bullet points
        # Insert relevant job description keywords if found
        tailored_desc = desc
        if "React" in required_skills and "React" not in exp.get("skills", []):
            tailored_desc = tailored_desc.replace("client-side interactive modules", "highly responsive React dashboards")
        if "CI/CD" in required_skills or "GitHub Actions" in required_skills:
            tailored_desc = tailored_desc.replace("deployment scripts", "automated CI/CD workflows and deployment scripts")
            
        tailored_experiences.append({
            "id": exp.get("id"),
            "title": exp.get("title"),
            "company": exp.get("company"),
            "description": tailored_desc
        })
        
    # 3. Tailored Cover Letter
    first_project_title = "TaskFlow Pro"
    first_project_tech = "React and Flask"
    projects = profile.get("projects", [])
    if projects:
        first_project_title = projects[0].get("title")
        first_project_tech = ", ".join(projects[0].get("technologies", [])[:3])
        
    exp_bullet = ""
    experiences = profile.get("experience", [])
    if experiences:
        exp_bullet = f"During my time at {experiences[0].get('company')}, I gained direct exposure to software engineering lifecycles and collaborated with senior engineers to implement client-focused solutions."
        
    cover_letter = (
        f"Dear Hiring Team at {company},\n\n"
        f"I am writing to express my strong interest in the {role} position. With my background in "
        f"full-stack software development and my proficiency in {', '.join(required_skills[:4])}, "
        f"I am confident in my ability to make an immediate impact on your engineering division.\n\n"
        f"My technical expertise is highlighted by my project, {first_project_title}, which I developed using "
        f"{first_project_tech}. Through this project, I resolved complex architectural requirements such as data persistence, "
        f"asynchronous tasks, and real-time dashboard notifications. {exp_bullet}\n\n"
        f"What excites me most about joining {company} is your commitment to technical innovation and developer excellence. "
        f"I am eager to align my engineering skills with your team's goals and contribute to writing clean, maintainable, "
        f"and scalable code.\n\n"
        f"Thank you for your time and consideration. I welcome the opportunity to discuss my qualifications further in an interview.\n\n"
        f"Sincerely,\n"
        f"{candidate_name}"
    )
    
    tailored_resume = {
        "summary": summary_template,
        "experience": tailored_experiences
      }
    
    # Save to database if application ID is provided
    if app_id:
        for app in db.get("applications", []):
            if app["id"] == app_id:
                app["tailored_resume"] = tailored_resume
                app["tailored_cover_letter"] = cover_letter
                app["status"] = "Tailored"
                break
        write_db(db)
        
    return jsonify({
        "tailored_resume": tailored_resume,
        "tailored_cover_letter": cover_letter
    })

# Interview Endpoints
@app.route('/api/interview/questions', methods=['POST'])
def get_interview_questions():
    data = request.json
    role = data.get("role", "Software Engineer")
    company = data.get("company", "Target Company")
    job_desc = data.get("job_description", "")
    
    required_skills = extract_skills_from_text(job_desc)
    skill_focus = required_skills[0] if required_skills else "Python/React"
    
    questions = [
        {
            "id": "q1",
            "type": "Behavioral",
            "question": f"Can you tell me about a time at your previous role or project when you had to adapt to a sudden change in requirements or technical stack? How did you handle it?"
        },
        {
            "id": "q2",
            "type": "Technical",
            "question": f"How do you approach performance optimization and API latency reduction when working with {skill_focus}? Tell me about a specific time you optimized an application."
        },
        {
            "id": "q3",
            "type": "Situational",
            "question": f"Imagine we are planning to launch a major new feature for {company} next week, but we discover a critical bug in the core data storage service. Walk me through your troubleshooting steps."
        }
    ]
    return jsonify(questions)

@app.route('/api/interview/feedback', methods=['POST'])
def get_interview_feedback():
    data = request.json
    question = data.get("question", "")
    answer = data.get("answer", "")
    
    if not answer or len(answer.strip()) < 10:
        return jsonify({
            "score": 30,
            "feedback": "Your answer is too short. Try using the STAR method (Situation, Task, Action, Result) to structure your response with specific details.",
            "suggested_answer": "In my previous project, we faced a similar challenge. I analyzed the database query plans (Situation/Task), refactored the SQL joins and added indices (Action), which decreased latency by 40% (Result)."
        })
        
    answer_lower = answer.lower()
    
    # Assess answer structure and key terms
    star_keywords = ["result", "action", "because", "solved", "fixed", "implemented", "optimized"]
    score = 65
    
    # Boost score based on length and keywords
    if len(answer.split()) > 50:
        score += 15
    if any(k in answer_lower for k in star_keywords):
        score += 10
    if len(answer.split()) > 100:
        score += 5
        
    score = min(score, 98)
    
    # Generate generic constructive feedback
    feedback = (
        "Good response! You clearly describe your actions. To elevate this response, focus "
        "more heavily on the quantitative results (e.g., specific percentages, load times, or user counts) "
        "and mention any lessons learned during the execution phase."
    )
    
    suggested = (
        "Here is how a top-tier candidate answers this: "
        "'In my role at PixelCraft Studio, we noticed that our main user portal loading time was increasing. "
        "I was tasked with identifying the root cause. I traced it to redundant REST API requests to the Flask server. "
        "I implemented query caching and batch-loading endpoints, which reduced page loading times by 15% and "
        "improved developer experience for frontend integrations.'"
    )
    
    return jsonify({
        "score": score,
        "feedback": feedback,
        "suggested_answer": suggested
    })

if __name__ == '__main__':
    # Automatically open browser on startup (preventing double open in debug mode reloader)
    if not os.environ.get("WERKZEUG_RUN_MAIN"):
        import webbrowser
        from threading import Timer
        Timer(1.5, lambda: webbrowser.open("http://127.0.0.1:5000")).start()

    # Start the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
