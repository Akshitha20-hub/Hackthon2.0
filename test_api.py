import unittest
import json
import os
from app import app, DB_FILE

class TestApplyAPI(unittest.TestCase):
    
    def setUp(self):
        # Configure app for testing
        app.config['TESTING'] = True
        self.client = app.test_client()
        
        # Backup existing database
        self.db_existed = os.path.exists(DB_FILE)
        if self.db_existed:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                self.db_backup = f.read()
                
        # Write dummy seed data for tests
        test_data = {
            "profile": {
                "personal": {"name": "Test Candidate", "email": "test@email.com"},
                "skills": {
                    "frontend": ["React", "JavaScript"],
                    "backend": ["Python", "Flask"],
                    "databases": ["PostgreSQL"],
                    "tools": ["Git"]
                },
                "experience": [],
                "projects": [],
                "preferences": {"work_modes": ["Remote"], "titles": ["Software Engineer"]}
            },
            "applications": []
        }
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(test_data, f)

    def tearDown(self):
        # Restore backup database
        if self.db_existed:
            with open(DB_FILE, 'w', encoding='utf-8') as f:
                f.write(self.db_backup)
        elif os.path.exists(DB_FILE):
            os.remove(DB_FILE)

    def test_get_profile(self):
        response = self.client.get('/api/profile')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['personal']['name'], 'Test Candidate')

    def test_get_applications(self):
        response = self.client.get('/api/applications')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data), 0)

    def test_job_analysis(self):
        job_data = {
            "job_description": "We are seeking a React developer with experience in Python and Flask.",
            "url": "https://company.com/job/1"
        }
        response = self.client.post('/api/analyze', 
                                   data=json.dumps(job_data),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Verify heuristic match
        self.assertIn("React", data["matched_skills"])
        self.assertIn("Flask", data["matched_skills"])
        self.assertGreaterEqual(data["match_score"], 50)
        self.assertEqual(data["work_mode"], "Hybrid") # defaults to hybrid if no remote keyword

    def test_tailoring(self):
        tailor_data = {
            "job_description": "React developer with Python and Flask experience.",
            "company": "TechCorp",
            "role": "Fullstack Developer"
        }
        response = self.client.post('/api/tailor', 
                                   data=json.dumps(tailor_data),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("TechCorp", data["tailored_cover_letter"])
        self.assertIn("Fullstack Developer", data["tailored_cover_letter"])
        self.assertTrue("summary" in data["tailored_resume"])

if __name__ == '__main__':
    unittest.main()
