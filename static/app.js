// --- Constants & Global State ---
const API_BASE = window.location.origin;

let state = {
    profile: null,
    applications: [],
    activeTab: 'dashboard',
    selectedApplicationId: null,
    activeTailoredTab: 'resume',
    activeInterviewQuestion: null,
    skills: {
        frontend: [],
        backend: [],
        databases: [],
        tools: []
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupTabNavigation();
    setupProfileForm();
    setupManualAppModal();
    setupJobAnalyzer();
    setupTailorWorkspace();
    setupAutofillSimulator();
    setupInterviewPrep();
    
    // Load initial data
    await loadInitialData();
}

async function loadInitialData() {
    try {
        await Promise.all([
            fetchProfile(),
            fetchApplications()
        ]);
        renderDashboard();
        populateProfileForm();
        renderTailorAppSidebar();
        populateInterviewJobSelector();
    } catch (err) {
        console.error("Error loading initial data:", err);
    }
}

// --- Tab Routing ---
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    state.activeTab = tabId;
    
    // Update active nav link
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update active pane
    document.querySelectorAll('.tab-pane').forEach(pane => {
        if (pane.id === `tab-${tabId}`) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    // Update header title and subtitle
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    const titles = {
        dashboard: { title: "Dashboard", sub: "Track, tailor, and automate your job applications" },
        profile: { title: "Master Profile", sub: "Manage your education, experience, skills and preferences" },
        analyzer: { title: "Job Analyzer", sub: "Verify your profile fit and extract role specifications" },
        tailor: { title: "Tailoring Workspace", sub: "Side-by-side optimization of your resume and cover letter" },
        autofill: { title: "Autofill Extension Simulator", sub: "Demonstrate one-click autofilling on external career portals" },
        interview: { title: "Interview Prep Sandbox", sub: "Practice answering custom technical and behavioral questions" }
    };

    if (titles[tabId]) {
        pageTitle.innerText = titles[tabId].title;
        pageSubtitle.innerText = titles[tabId].sub;
    }

    // Refresh context-specific components
    if (tabId === 'dashboard') {
        renderDashboard();
    } else if (tabId === 'tailor') {
        renderTailorAppSidebar();
    } else if (tabId === 'interview') {
        populateInterviewJobSelector();
    }
}

// --- API Helpers ---
async function fetchProfile() {
    const res = await fetch(`${API_BASE}/api/profile`);
    state.profile = await res.json();
    
    // Ensure profile sub-fields exist
    if (!state.profile.personal) state.profile.personal = {};
    if (!state.profile.education) state.profile.education = [];
    if (!state.profile.experience) state.profile.experience = [];
    if (!state.profile.projects) state.profile.projects = [];
    if (!state.profile.skills) {
        state.profile.skills = { frontend: [], backend: [], databases: [], tools: [] };
    }
    state.skills = state.profile.skills;
}

async function saveProfileAPI() {
    const res = await fetch(`${API_BASE}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.profile)
    });
    state.profile = await res.json();
    
    // Sync footer username
    if (state.profile.personal && state.profile.personal.name) {
        document.getElementById('footer-username').innerText = state.profile.personal.name;
    }
}

async function fetchApplications() {
    const res = await fetch(`${API_BASE}/api/applications`);
    state.applications = await res.json();
}

async function createApplicationAPI(appData) {
    const res = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
    });
    const newApp = await res.json();
    state.applications.push(newApp);
    return newApp;
}

async function updateApplicationAPI(appId, appData) {
    const res = await fetch(`${API_BASE}/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
    });
    const updated = await res.json();
    
    // Sync local array
    const index = state.applications.findIndex(a => a.id === appId);
    if (index !== -1) {
        state.applications[index] = updated;
    }
    return updated;
}

async function deleteApplicationAPI(appId) {
    await fetch(`${API_BASE}/api/applications/${appId}`, {
        method: 'DELETE'
    });
    state.applications = state.applications.filter(a => a.id !== appId);
}

// --- Dashboard & Kanban Board ---
function renderDashboard() {
    // 1. Calculate Stats
    const totalApps = state.applications.length;
    document.getElementById('stat-total-apps').innerText = totalApps;
    
    const scores = state.applications.map(a => a.match_score).filter(s => s > 0);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    document.getElementById('stat-avg-match').innerText = `${avgScore}%`;

    const interviews = state.applications.filter(a => a.status === 'Interviewing').length;
    document.getElementById('stat-interviews').innerText = interviews;

    const offers = state.applications.filter(a => a.status === 'Offer').length;
    document.getElementById('stat-offers').innerText = offers;

    // 2. Clear Kanban Lists
    const columns = ['Discovered', 'Tailored', 'Applied', 'Interviewing', 'Offer', 'Rejected'];
    columns.forEach(col => {
        const listEl = document.getElementById(`col-${col.toLowerCase()}`);
        if (listEl) listEl.innerHTML = '';
        const countEl = document.getElementById(`count-${col.toLowerCase()}`);
        if (countEl) countEl.innerText = '0';
    });

    // 3. Render Cards in columns
    state.applications.forEach(app => {
        const status = app.status || 'Discovered';
        const colId = `col-${status.toLowerCase()}`;
        const countId = `count-${status.toLowerCase()}`;
        
        const listEl = document.getElementById(colId);
        const countEl = document.getElementById(countId);
        
        if (listEl) {
            const card = createJobCard(app);
            listEl.appendChild(card);
        }
        if (countEl) {
            countEl.innerText = parseInt(countEl.innerText) + 1;
        }
    });
}

function createJobCard(app) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', app.id);
    
    // Match score class
    let scoreClass = 'score-low';
    if (app.match_score >= 80) scoreClass = 'score-high';
    else if (app.match_score >= 60) scoreClass = 'score-mid';
    
    card.innerHTML = `
        <div class="job-card-header">
            <span class="job-card-title">${app.role}</span>
            <span class="job-card-score ${scoreClass}">${app.match_score}%</span>
        </div>
        <div class="job-card-company">${app.company}</div>
        <div class="job-card-notes">${app.notes || 'No notes added.'}</div>
        <div class="job-card-footer">
            <span class="job-card-date">${app.date_created}</span>
            <div class="job-card-actions">
                <button class="job-card-btn btn-tailor" title="Tailor"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
                <button class="job-card-btn btn-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `;

    // Event listeners
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    // Tailor button click
    card.querySelector('.btn-tailor').addEventListener('click', (e) => {
        e.stopPropagation();
        state.selectedApplicationId = app.id;
        switchTab('tailor');
        loadApplicationToWorkspace(app.id);
    });

    // Delete button click
    card.querySelector('.btn-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete ${app.role} at ${app.company}?`)) {
            await deleteApplicationAPI(app.id);
            renderDashboard();
        }
    });

    // General card click to open detail edit
    card.addEventListener('click', () => {
        openManualAppModal(app);
    });

    return card;
}

// Kanban Drag and Drop Logic
let draggedCardId = null;

function handleDragStart(e) {
    draggedCardId = this.getAttribute('data-id');
    this.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
    this.style.opacity = '1';
    
    // Reset columns styling
    document.querySelectorAll('.kanban-column').forEach(col => {
        col.style.backgroundColor = 'rgba(15, 23, 42, 0.4)';
    });
}

// Setup column drop targets
document.querySelectorAll('.kanban-column').forEach(col => {
    col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.style.backgroundColor = 'rgba(15, 23, 42, 0.7)';
    });

    col.addEventListener('dragleave', () => {
        col.style.backgroundColor = 'rgba(15, 23, 42, 0.4)';
    });

    col.addEventListener('drop', async (e) => {
        e.preventDefault();
        const targetStatus = col.getAttribute('data-status');
        if (draggedCardId) {
            await updateApplicationAPI(draggedCardId, { status: targetStatus });
            renderDashboard();
        }
    });
});

// --- Manual Add/Edit Application Modal ---
function setupManualAppModal() {
    const modal = document.getElementById('modal-add-app');
    const form = document.getElementById('form-manual-app');
    const btnAdd = document.getElementById('btn-add-app-manual');
    const btnClose = document.getElementById('btn-close-app-modal');
    const btnCancel = document.getElementById('btn-cancel-app-modal');

    btnAdd.addEventListener('click', () => {
        openManualAppModal();
    });

    const closeModal = () => modal.classList.add('hidden');
    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const appId = form.getAttribute('data-active-id');
        
        const appData = {
            company: document.getElementById('modal-company').value,
            role: document.getElementById('modal-role').value,
            url: document.getElementById('modal-url').value,
            status: document.getElementById('modal-status').value,
            match_score: parseInt(document.getElementById('modal-score').value) || 0,
            notes: document.getElementById('modal-notes').value
        };

        if (appId) {
            // Edit existing
            await updateApplicationAPI(appId, appData);
        } else {
            // Create new
            await createApplicationAPI(appData);
        }
        
        closeModal();
        renderDashboard();
    });
}

function openManualAppModal(app = null) {
    const modal = document.getElementById('modal-add-app');
    const form = document.getElementById('form-manual-app');
    const title = modal.querySelector('h3');
    
    if (app) {
        // Edit Mode
        title.innerText = "Edit Opportunity details";
        form.setAttribute('data-active-id', app.id);
        document.getElementById('modal-company').value = app.company;
        document.getElementById('modal-role').value = app.role;
        document.getElementById('modal-url').value = app.url || '';
        document.getElementById('modal-status').value = app.status || 'Discovered';
        document.getElementById('modal-score').value = app.match_score || 0;
        document.getElementById('modal-notes').value = app.notes || '';
    } else {
        // Create Mode
        title.innerText = "Add New Job Opportunity";
        form.removeAttribute('data-active-id');
        form.reset();
        document.getElementById('modal-status').value = 'Discovered';
        document.getElementById('modal-score').value = '';
    }
    
    modal.classList.remove('hidden');
}

// --- Master Profile Section Layout ---
function setupProfileForm() {
    const sidebarItems = document.querySelectorAll('.profile-nav-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const targetSec = item.getAttribute('data-profile-sec');
            document.querySelectorAll('.profile-section').forEach(sec => {
                if (sec.id === `sec-${targetSec}`) {
                    sec.classList.add('active');
                } else {
                    sec.classList.remove('active');
                }
            });
        });
    });

    // Education, Experience, Project triggers
    document.getElementById('btn-add-edu').addEventListener('click', () => addEducationRow());
    document.getElementById('btn-add-exp').addEventListener('click', () => addExperienceRow());
    document.getElementById('btn-add-project').addEventListener('click', () => addProjectRow());

    // Skills inputs tag setup
    const tagInputs = document.querySelectorAll('.input-tag');
    tagInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const category = input.getAttribute('data-cat');
                const val = input.value.trim();
                if (val && !state.skills[category].includes(val)) {
                    state.skills[category].push(val);
                    renderSkillCategoryTags(category);
                    input.value = '';
                }
            }
        });
    });

    // Profile Submit logic
    document.getElementById('form-master-profile').addEventListener('submit', async (e) => {
        e.preventDefault();
        saveProfileFromForm();
        
        const saveMsg = document.getElementById('profile-save-message');
        saveMsg.classList.remove('hidden');
        
        await saveProfileAPI();
        
        setTimeout(() => {
            saveMsg.classList.add('hidden');
        }, 3000);
    });

    // Real Resume Parser triggers
    const fileInput = document.getElementById('resume-file-input');
    const parseBtn = document.getElementById('btn-parse-resume-mock');
    
    parseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleResumeUpload);
}

function renderSkillCategoryTags(category) {
    const container = document.getElementById(`tags-${category}`);
    container.innerHTML = '';
    
    state.skills[category].forEach(skill => {
        const pill = document.createElement('div');
        pill.className = 'skill-pill';
        pill.innerHTML = `${skill} <span data-skill="${skill}">&times;</span>`;
        
        pill.querySelector('span').addEventListener('click', () => {
            state.skills[category] = state.skills[category].filter(s => s !== skill);
            renderSkillCategoryTags(category);
        });
        
        container.appendChild(pill);
    });
}

function addEducationRow(edu = {}) {
    const container = document.getElementById('education-list-container');
    const block = document.createElement('div');
    block.className = 'dynamic-block education-block';
    block.innerHTML = `
        <button type="button" class="btn-remove-block">&times;</button>
        <div class="form-grid">
            <div class="form-group">
                <label>Degree Name</label>
                <input type="text" class="edu-degree" placeholder="e.g. Bachelor of Science" value="${edu.degree || ''}">
            </div>
            <div class="form-group">
                <label>Institution / School</label>
                <input type="text" class="edu-school" placeholder="e.g. State University" value="${edu.school || ''}">
            </div>
        </div>
        <div class="form-grid mt-3">
            <div class="form-group">
                <label>Major / Field of Study</label>
                <input type="text" class="edu-field" placeholder="e.g. Computer Science" value="${edu.field || ''}">
            </div>
            <div class="form-grid" style="margin-top:0">
                <div class="form-group">
                    <label>Start / End Year</label>
                    <div style="display:flex; gap:8px">
                        <input type="text" class="edu-start" placeholder="2020" value="${edu.start_year || ''}">
                        <input type="text" class="edu-end" placeholder="2024" value="${edu.end_year || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Grade / GPA</label>
                    <input type="text" class="edu-grade" placeholder="3.8 GPA" value="${edu.grade || ''}">
                </div>
            </div>
        </div>
    `;

    block.querySelector('.btn-remove-block').addEventListener('click', () => block.remove());
    container.appendChild(block);
}

function addExperienceRow(exp = {}) {
    const container = document.getElementById('experience-list-container');
    const block = document.createElement('div');
    block.className = 'dynamic-block experience-block';
    block.setAttribute('data-id', exp.id || `exp_${Math.random().toString(36).substr(2, 9)}`);
    
    block.innerHTML = `
        <button type="button" class="btn-remove-block">&times;</button>
        <div class="form-grid">
            <div class="form-group">
                <label>Job Title</label>
                <input type="text" class="exp-title" placeholder="e.g. Software Engineer" value="${exp.title || ''}">
            </div>
            <div class="form-group">
                <label>Company</label>
                <input type="text" class="exp-company" placeholder="e.g. Stripe" value="${exp.company || ''}">
            </div>
        </div>
        <div class="form-grid mt-3">
            <div class="form-group">
                <label>Location & Work Mode</label>
                <input type="text" class="exp-location" placeholder="Remote / SF, CA" value="${exp.location || ''}">
            </div>
            <div class="form-group">
                <label>Dates Worked</label>
                <div style="display:flex; gap:8px">
                    <input type="text" class="exp-start" placeholder="2022-05" value="${exp.start_date || ''}">
                    <input type="text" class="exp-end" placeholder="Present" value="${exp.end_date || ''}">
                </div>
            </div>
        </div>
        <div class="form-group mt-3">
            <label>Roles & Responsibilities Bullet Points</label>
            <textarea class="exp-desc" rows="4" placeholder="Mention core technical implementations and metrics optimized...">${exp.description || ''}</textarea>
        </div>
        <div class="form-group mt-3">
            <label>Skills Utilized (comma separated)</label>
            <input type="text" class="exp-skills" placeholder="React, Flask, SQL" value="${(exp.skills || []).join(', ')}">
        </div>
    `;

    block.querySelector('.btn-remove-block').addEventListener('click', () => block.remove());
    container.appendChild(block);
}

function addProjectRow(proj = {}) {
    const container = document.getElementById('project-list-container');
    const block = document.createElement('div');
    block.className = 'dynamic-block project-block';
    block.setAttribute('data-id', proj.id || `proj_${Math.random().toString(36).substr(2, 9)}`);
    
    block.innerHTML = `
        <button type="button" class="btn-remove-block">&times;</button>
        <div class="form-grid">
            <div class="form-group">
                <label>Project Title</label>
                <input type="text" class="proj-title" placeholder="e.g. Developer Portfolio" value="${proj.title || ''}">
            </div>
            <div class="form-group">
                <label>Role</label>
                <input type="text" class="proj-role" placeholder="e.g. Sole Creator" value="${proj.role || ''}">
            </div>
        </div>
        <div class="form-group mt-3">
            <label>Project Link / Repository</label>
            <input type="url" class="proj-link" placeholder="https://github.com/..." value="${proj.link || ''}">
        </div>
        <div class="form-group mt-3">
            <label>Project Summary & Architecture</label>
            <textarea class="proj-desc" rows="3" placeholder="Designed and implemented...">${proj.description || ''}</textarea>
        </div>
        <div class="form-group mt-3">
            <label>Technologies Used (comma separated)</label>
            <input type="text" class="proj-tech" placeholder="Python, SQLite, Docker" value="${(proj.technologies || []).join(', ')}">
        </div>
    `;

    block.querySelector('.btn-remove-block').addEventListener('click', () => block.remove());
    container.appendChild(block);
}

function populateProfileForm() {
    if (!state.profile) return;
    
    // Personal Details
    const pers = state.profile.personal || {};
    document.getElementById('prof-name').value = pers.name || '';
    document.getElementById('prof-email').value = pers.email || '';
    document.getElementById('prof-phone').value = pers.phone || '';
    document.getElementById('prof-linkedin').value = pers.linkedin || '';
    document.getElementById('prof-github').value = pers.github || '';
    document.getElementById('prof-website').value = pers.website || '';
    
    // Sync footer name
    if (pers.name) {
        document.getElementById('footer-username').innerText = pers.name;
    }

    // Education
    const eduContainer = document.getElementById('education-list-container');
    eduContainer.innerHTML = '';
    (state.profile.education || []).forEach(edu => addEducationRow(edu));

    // Experience
    const expContainer = document.getElementById('experience-list-container');
    expContainer.innerHTML = '';
    (state.profile.experience || []).forEach(exp => addExperienceRow(exp));

    // Projects
    const projContainer = document.getElementById('project-list-container');
    projContainer.innerHTML = '';
    (state.profile.projects || []).forEach(proj => addProjectRow(proj));

    // Skills
    const cats = ['frontend', 'backend', 'databases', 'tools'];
    cats.forEach(cat => renderSkillCategoryTags(cat));

    // Preferences
    const prefs = state.profile.preferences || {};
    document.getElementById('pref-titles').value = (prefs.titles || []).join(', ');
    document.getElementById('pref-min-salary').value = prefs.min_salary || '';
    document.getElementById('pref-locations').value = (prefs.locations || []).join(', ');
    
    const modes = prefs.work_modes || [];
    document.getElementById('mode-remote').checked = modes.includes('Remote');
    document.getElementById('mode-hybrid').checked = modes.includes('Hybrid');
    document.getElementById('mode-onsite').checked = modes.includes('On-site');
}

function saveProfileFromForm() {
    state.profile.personal = {
        name: document.getElementById('prof-name').value,
        email: document.getElementById('prof-email').value,
        phone: document.getElementById('prof-phone').value,
        linkedin: document.getElementById('prof-linkedin').value,
        github: document.getElementById('prof-github').value,
        website: document.getElementById('prof-website').value
    };

    // Education
    state.profile.education = [];
    document.querySelectorAll('.education-block').forEach(block => {
        state.profile.education.push({
            degree: block.querySelector('.edu-degree').value,
            school: block.querySelector('.edu-school').value,
            field: block.querySelector('.edu-field').value,
            start_year: block.querySelector('.edu-start').value,
            end_year: block.querySelector('.edu-end').value,
            grade: block.querySelector('.edu-grade').value
        });
    });

    // Experience
    state.profile.experience = [];
    document.querySelectorAll('.experience-block').forEach(block => {
        state.profile.experience.push({
            id: block.getAttribute('data-id'),
            title: block.querySelector('.exp-title').value,
            company: block.querySelector('.exp-company').value,
            location: block.querySelector('.exp-location').value,
            start_date: block.querySelector('.exp-start').value,
            end_date: block.querySelector('.exp-end').value,
            description: block.querySelector('.exp-desc').value,
            skills: block.querySelector('.exp-skills').value.split(',').map(s => s.trim()).filter(s => s)
        });
    });

    // Projects
    state.profile.projects = [];
    document.querySelectorAll('.project-block').forEach(block => {
        state.profile.projects.push({
            id: block.getAttribute('data-id'),
            title: block.querySelector('.proj-title').value,
            role: block.querySelector('.proj-role').value,
            link: block.querySelector('.proj-link').value,
            description: block.querySelector('.proj-desc').value,
            technologies: block.querySelector('.proj-tech').value.split(',').map(t => t.trim()).filter(t => t)
        });
    });

    // Skills are saved in real-time by tag input handler
    state.profile.skills = state.skills;

    // Preferences
    const modes = [];
    if (document.getElementById('mode-remote').checked) modes.push('Remote');
    if (document.getElementById('mode-hybrid').checked) modes.push('Hybrid');
    if (document.getElementById('mode-onsite').checked) modes.push('On-site');

    state.profile.preferences = {
        titles: document.getElementById('pref-titles').value.split(',').map(t => t.trim()).filter(t => t),
        min_salary: document.getElementById('pref-min-salary').value,
        locations: document.getElementById('pref-locations').value.split(',').map(l => l.trim()).filter(l => l),
        work_modes: modes
    };
}

// Real Resume Upload Handler
async function handleResumeUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const loader = document.getElementById('parse-loader');
    const loaderText = document.getElementById('parse-loader-text');
    const button = document.getElementById('btn-parse-resume-mock');

    loader.classList.remove('hidden');
    loaderText.innerText = "Extracting details from PDF...";
    button.disabled = true;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_BASE}/api/profile/upload-resume`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to parse resume.");
        }

        state.profile = data.profile;
        state.skills = data.profile.skills;
        
        populateProfileForm();
        alert("Resume uploaded and parsed successfully! Details extracted from the PDF.");
    } catch (err) {
        console.error(err);
        alert(`Error: ${err.message}`);
    } finally {
        loader.classList.add('hidden');
        button.disabled = false;
        e.target.value = '';
    }
}

// --- Job Analyzer ---
let currentAnalysisResult = null;

function setupJobAnalyzer() {
    const form = document.getElementById('form-job-analyzer');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const jobDesc = document.getElementById('anal-jd').value;
        const url = document.getElementById('anal-url').value;
        const company = document.getElementById('anal-company').value;
        const role = document.getElementById('anal-role').value;
        
        // Switch screens
        document.getElementById('analyzer-idle-screen').classList.add('hidden');
        document.getElementById('analyzer-results-screen').classList.add('hidden');
        const loader = document.getElementById('scan-loading-screen');
        loader.classList.remove('hidden');
        
        // Staggered status animation text
        const statusText = document.getElementById('scan-status-text');
        const progressFill = document.getElementById('scan-progress-bar');
        
        const setProgress = (w, txt) => {
            progressFill.style.width = `${w}%`;
            statusText.innerText = txt;
        };

        setTimeout(() => setProgress(20, "Resolving URL parameters..."), 400);
        setTimeout(() => setProgress(45, "Scraping career description content..."), 900);
        setTimeout(() => setProgress(70, "Mapping candidate skills keyword variables..."), 1400);
        setTimeout(() => setProgress(90, "Evaluating experience thresholds..."), 1800);
        
        // Fire API call
        try {
            const res = await fetch(`${API_BASE}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_description: jobDesc,
                    url: url,
                    company: company,
                    role: role
                })
            });
            
            const results = await res.json();
            
            setTimeout(() => {
                setProgress(100, "Done!");
                loader.classList.add('hidden');
                renderAnalysisResults(results);
            }, 2300);
            
        } catch (err) {
            console.error("Analysis Error:", err);
            loader.classList.add('hidden');
            document.getElementById('analyzer-idle-screen').classList.remove('hidden');
            alert("Error running analysis. Please verify Flask backend is running.");
        }
    });

    // Save and Tailor button binds
    document.getElementById('btn-save-anal-to-pipeline').addEventListener('click', saveAnalyzedJobToPipeline);
    document.getElementById('btn-trigger-tailoring').addEventListener('click', triggerTailoringFromAnalyzer);
}

function renderAnalysisResults(results) {
    currentAnalysisResult = results;
    
    // Render text
    document.getElementById('res-role').innerText = results.role;
    document.getElementById('res-company').innerText = results.company;
    document.getElementById('res-meta-details').innerHTML = `
        <i class="fa-solid fa-location-dot"></i> ${results.location} &nbsp;•&nbsp; 
        <i class="fa-solid fa-clock"></i> ${results.work_mode}
    `;

    // Circular dial score
    const ring = document.getElementById('score-ring-fill');
    const scoreVal = document.getElementById('res-score-value');
    const pct = results.match_score;
    
    // Math: circumference = 2 * pi * r = 2 * 3.14159 * 40 = 251.2
    const offset = 251.2 - (pct / 100) * 251.2;
    ring.style.strokeDashoffset = offset;
    scoreVal.innerText = `${pct}%`;

    // Breakdown bars
    document.getElementById('breakdown-skills-fill').style.width = `${results.breakdown.skills}%`;
    document.getElementById('breakdown-skills-val').innerText = `${results.breakdown.skills}%`;
    document.getElementById('breakdown-exp-fill').style.width = `${results.breakdown.experience}%`;
    document.getElementById('breakdown-exp-val').innerText = `${results.breakdown.experience}%`;
    document.getElementById('breakdown-prefs-fill').style.width = `${results.breakdown.preferences}%`;
    document.getElementById('breakdown-prefs-val').innerText = `${results.breakdown.preferences}%`;

    // Skills clouds
    const matchedCloud = document.getElementById('res-matched-skills-cloud');
    matchedCloud.innerHTML = '';
    results.matched_skills.forEach(s => {
        const p = document.createElement('span');
        p.className = 'pill pill-success';
        p.innerText = s;
        matchedCloud.appendChild(p);
    });
    if (!results.matched_skills.length) {
        matchedCloud.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted)">None detected.</span>';
    }

    const missingCloud = document.getElementById('res-missing-skills-cloud');
    missingCloud.innerHTML = '';
    results.missing_skills.forEach(s => {
        const p = document.createElement('span');
        p.className = 'pill pill-danger';
        p.innerText = s;
        missingCloud.appendChild(p);
    });
    if (!results.missing_skills.length) {
        missingCloud.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted)">None! Outstanding skill fit.</span>';
    }

    // Recommendations
    const recList = document.getElementById('res-recommendation-list');
    recList.innerHTML = '';
    results.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.innerText = rec;
        recList.appendChild(li);
    });

    // Reveal Screen
    document.getElementById('analyzer-results-screen').classList.remove('hidden');
}

async function saveAnalyzedJobToPipeline() {
    if (!currentAnalysisResult) return;
    
    const appData = {
        company: currentAnalysisResult.company,
        role: currentAnalysisResult.role,
        url: document.getElementById('anal-url').value || '',
        status: 'Discovered',
        match_score: currentAnalysisResult.match_score,
        notes: `Analyzed match: ${currentAnalysisResult.match_score}%. Missing: ${currentAnalysisResult.missing_skills.join(', ')}.`
    };

    const newApp = await createApplicationAPI(appData);
    alert(`Saved ${newApp.role} at ${newApp.company} to your Discovered pipeline!`);
}

async function triggerTailoringFromAnalyzer() {
    if (!currentAnalysisResult) return;
    
    // Save first to get ID
    const appData = {
        company: currentAnalysisResult.company,
        role: currentAnalysisResult.role,
        url: document.getElementById('anal-url').value || '',
        status: 'Tailored',
        match_score: currentAnalysisResult.match_score,
        notes: `Analyzed fit: ${currentAnalysisResult.match_score}%`
    };

    const newApp = await createApplicationAPI(appData);
    
    // Load to workspace
    state.selectedApplicationId = newApp.id;
    switchTab('tailor');
    
    // Tailor on server
    const jobDesc = document.getElementById('anal-jd').value;
    
    // Show Workspace Loader inside workspace body
    const workspaceBody = document.getElementById('tailor-workspace-body');
    workspaceBody.innerHTML = `
        <div class="scan-loading-card" style="width:100%; border:none">
            <div class="spinner-small" style="width:40px; height:40px; border-width:4px"></div>
            <h3 class="mt-4">Tailoring Resume and Letter...</h3>
            <p class="text-secondary mt-1">AI matches experience details and crafts bullet points...</p>
        </div>
    `;
    
    try {
        const res = await fetch(`${API_BASE}/api/tailor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_id: newApp.id,
                job_description: jobDesc,
                company: newApp.company,
                role: newApp.role
            })
        });
        
        await res.json();
        await fetchApplications(); // Refresh lists
        
        // Re-render layout
        setupTailorWorkspaceLayout();
        loadApplicationToWorkspace(newApp.id);
        
    } catch (err) {
        console.error(err);
        alert("Tailoring API failed.");
        setupTailorWorkspaceLayout();
    }
}

// --- Tailoring Workspace Hub ---
function setupTailorWorkspace() {
    // Tab toggles inside pane
    const paneTabs = document.querySelectorAll('.pane-tab');
    paneTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            paneTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const target = tab.getAttribute('data-tailored-tab');
            state.activeTailoredTab = target;
            
            document.querySelectorAll('.tailored-tab-pane').forEach(p => {
                if (p.id === `pane-tailored-${target}`) {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });
        });
    });

    // Document print triggers
    document.getElementById('btn-print-resume').addEventListener('click', () => {
        window.print();
    });
    
    document.getElementById('btn-print-letter').addEventListener('click', () => {
        // Toggle to letter tab first so it prints active letter content
        document.querySelector('[data-tailored-tab="letter"]').click();
        setTimeout(() => window.print(), 100);
    });

    // Auto save typing changes in editor
    document.getElementById('tailored-summary-input').addEventListener('input', debounce(saveTailoredTextFromEditor, 1000));
    document.getElementById('tailored-letter-input').addEventListener('input', debounce(saveTailoredTextFromEditor, 1000));

    // Autofill Portal trigger
    document.getElementById('btn-apply-portal-redirect').addEventListener('click', () => {
        switchTab('autofill');
        loadApplicationToAutofill(state.selectedApplicationId);
    });
}

function setupTailorWorkspaceLayout() {
    // Reset basic HTML workspace block
    const workspaceBody = document.getElementById('tailor-workspace-body');
    workspaceBody.innerHTML = `
        <!-- Empty state when no app is loaded -->
        <div class="empty-state-card" id="tailor-empty-workspace">
            <div class="empty-state-icon">
                <i class="fa-solid fa-folder-open"></i>
            </div>
            <h3>No Application Loaded</h3>
            <p>Select one of your tracked applications from the left panel, or scan a new job opportunity in the Job Analyzer to tailor your profile documents.</p>
        </div>

        <!-- Active Workspace Split -->
        <div class="tailor-split-panes hidden" id="tailor-active-panes">
            <!-- Left: Original Profile Reference -->
            <div class="tailor-pane pane-original">
                <div class="pane-header">
                    <h4>Master Profile Reference</h4>
                </div>
                <div class="pane-content-scroll">
                    <div class="profile-preview-card">
                        <h5>Professional Summary</h5>
                        <p class="text-secondary mt-1 text-sm">Baseline profile summary.</p>
                        <div class="preview-box mt-3" id="ref-master-summary"></div>
                    </div>
                    <div class="profile-preview-card mt-4">
                        <h5>Work History Bullets</h5>
                        <div id="ref-master-experience-bullets" class="mt-2"></div>
                    </div>
                </div>
            </div>

            <!-- Right: Tailored Outputs Area -->
            <div class="tailor-pane pane-tailored">
                <div class="pane-header">
                    <div class="pane-tabs">
                        <button class="pane-tab active" data-tailored-tab="resume">Tailored Resume</button>
                        <button class="pane-tab" data-tailored-tab="letter">Tailored Cover Letter</button>
                    </div>
                    <span class="badge badge-success"><i class="fa-solid fa-sparkles"></i> AI Tailored</span>
                </div>
                <div class="pane-content-scroll">
                    <!-- TAB 1: TAILORED RESUME CONTENT -->
                    <div class="tailored-tab-pane active" id="pane-tailored-resume">
                        <div class="print-document" id="printable-resume">
                            <div class="document-header">
                                <h1 id="doc-res-name">Alex Carter</h1>
                                <p id="doc-res-contact">alex.carter@email.com | +1 (555) 019-2834</p>
                                <p id="doc-res-links">linkedin.com/in/alexcarter-dev</p>
                            </div>
                            <div class="doc-section">
                                <h2 class="doc-sec-title">Professional Summary</h2>
                                <textarea id="tailored-summary-input" rows="5" class="doc-editor-textarea"></textarea>
                            </div>
                            <div class="doc-section mt-4">
                                <h2 class="doc-sec-title">Skills</h2>
                                <p id="doc-res-skills" class="doc-text-block"></p>
                            </div>
                            <div class="doc-section mt-4">
                                <h2 class="doc-sec-title">Experience</h2>
                                <div id="doc-res-experience-container"></div>
                            </div>
                            <div class="doc-section mt-4">
                                <h2 class="doc-sec-title">Projects</h2>
                                <div id="doc-res-projects-container"></div>
                            </div>
                            <div class="doc-section mt-4">
                                <h2 class="doc-sec-title">Education</h2>
                                <div id="doc-res-education-container"></div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: TAILORED COVER LETTER CONTENT -->
                    <div class="tailored-tab-pane" id="pane-tailored-letter">
                        <div class="print-document" id="printable-letter">
                            <div class="document-header text-left">
                                <h1 id="doc-let-name">Alex Carter</h1>
                                <p id="doc-let-contact">alex.carter@email.com</p>
                                <hr class="doc-divider">
                            </div>
                            <textarea id="tailored-letter-input" rows="22" class="doc-editor-textarea mt-4"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    setupTailorWorkspace(); // Re-bind events
}

function renderTailorAppSidebar() {
    const listContainer = document.getElementById('tailor-sidebar-app-list');
    listContainer.innerHTML = '';
    
    state.applications.forEach(app => {
        const card = document.createElement('div');
        card.className = `tailor-app-card ${state.selectedApplicationId === app.id ? 'active' : ''}`;
        
        let scoreClass = 'text-danger';
        if (app.match_score >= 80) scoreClass = 'text-success';
        else if (app.match_score >= 60) scoreClass = 'text-cyan';

        card.innerHTML = `
            <h4>${app.role}</h4>
            <p>${app.company}</p>
            <div class="tailor-app-card-meta">
                <span class="badge ${app.tailored_resume ? 'badge-success' : 'badge-indigo'}">${app.tailored_resume ? 'Tailored' : 'Pending'}</span>
                <strong class="${scoreClass}">${app.match_score}% Match</strong>
            </div>
        `;
        
        card.addEventListener('click', () => {
            document.querySelectorAll('.tailor-app-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            state.selectedApplicationId = app.id;
            loadApplicationToWorkspace(app.id);
        });
        
        listContainer.appendChild(card);
    });

    if (!state.applications.length) {
        listContainer.innerHTML = '<p class="text-secondary text-sm text-center mt-4">No applications to display. Add one on the dashboard.</p>';
    }
}

async function loadApplicationToWorkspace(appId) {
    const app = state.applications.find(a => a.id === appId);
    if (!app) return;
    
    // Set Header display labels
    document.getElementById('tailor-title-display').innerText = app.role;
    document.getElementById('tailor-company-display').innerText = `${app.company}  •  Match Score: ${app.match_score}%`;

    // Handle Split View visibility
    document.getElementById('tailor-empty-workspace').classList.add('hidden');
    document.getElementById('tailor-active-panes').classList.remove('hidden');

    // Render Original References
    document.getElementById('ref-master-summary').innerText = 
        `Detail-oriented Software Engineer with skills in React, Python, Flask, Javascript and Docker. Experienced optimizing database logic and full-stack modules.`;
    
    const originalBulletContainer = document.getElementById('ref-master-experience-bullets');
    originalBulletContainer.innerHTML = '';
    state.profile.experience.forEach(exp => {
        const item = document.createElement('div');
        item.style.marginBottom = '12px';
        item.innerHTML = `
            <strong class="text-sm">${exp.title} (${exp.company})</strong>
            <p class="text-secondary text-xs mt-1" style="font-family:monospace">${exp.description}</p>
        `;
        originalBulletContainer.appendChild(item);
    });

    // Check if tailored details exist. If not, trigger a mock tailoring sequence
    if (!app.tailored_resume) {
        // Trigger simulated tailoring
        const workspaceBody = document.getElementById('tailor-workspace-body');
        workspaceBody.innerHTML = `
            <div class="scan-loading-card" style="width:100%; border:none">
                <div class="spinner-small" style="width:40px; height:40px; border-width:4px"></div>
                <h3 class="mt-4">Tailoring Resume and Letter...</h3>
                <p class="text-secondary mt-1">Structuring sentences and matching keyword variables...</p>
            </div>
        `;
        
        try {
            const res = await fetch(`${API_BASE}/api/tailor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    app_id: app.id,
                    job_description: app.notes || "Software Engineering Role with Python, Flask, React, and REST APIs.",
                    company: app.company,
                    role: app.role
                })
            });
            await res.json();
            await fetchApplications(); // Refresh list
            
            setupTailorWorkspaceLayout();
            loadApplicationToWorkspace(appId);
            renderTailorAppSidebar();
        } catch (err) {
            console.error(err);
            setupTailorWorkspaceLayout();
        }
        return;
    }

    // Populate tailored items in form views
    const resName = state.profile.personal.name || "Candidate Name";
    document.getElementById('doc-res-name').innerText = resName;
    document.getElementById('doc-let-name').innerText = resName;
    
    const contactStr = `${state.profile.personal.email || 'email'} | ${state.profile.personal.phone || 'phone'} | ${state.profile.preferences.locations[0] || 'Location'}`;
    document.getElementById('doc-res-contact').innerText = contactStr;
    document.getElementById('doc-let-contact').innerText = `${state.profile.personal.email || 'email'} | ${state.profile.personal.phone || 'phone'}`;
    
    document.getElementById('doc-res-links').innerText = `${state.profile.personal.linkedin || ''}  |  ${state.profile.personal.github || ''}`;

    // Summary Textarea
    document.getElementById('tailored-summary-input').value = app.tailored_resume.summary;

    // Skills block
    const allSkills = [];
    Object.values(state.profile.skills).forEach(list => allSkills.push(...list));
    document.getElementById('doc-res-skills').innerText = allSkills.join(', ');

    // Experience container
    const expContainer = document.getElementById('doc-res-experience-container');
    expContainer.innerHTML = '';
    app.tailored_resume.experience.forEach(exp => {
        const item = document.createElement('div');
        item.style.marginBottom = '12px';
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:0.85rem">
                <span>${exp.title} - ${exp.company}</span>
            </div>
            <textarea class="doc-editor-textarea exp-tailored-bullet-input" data-exp-id="${exp.id}" rows="3" style="width:100%; margin-top:4px">${exp.description}</textarea>
        `;
        
        // Auto-save changes in exp bullets
        item.querySelector('textarea').addEventListener('input', debounce(saveTailoredTextFromEditor, 1000));
        
        expContainer.appendChild(item);
    });

    // Projects Container
    const projContainer = document.getElementById('doc-res-projects-container');
    projContainer.innerHTML = '';
    state.profile.projects.forEach(proj => {
        const div = document.createElement('div');
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:0.85rem">
                <span>${proj.title}</span>
                <span>${proj.role}</span>
            </div>
            <p class="doc-text-block text-xs" style="color:#4B5563; font-style:italic">Tech: ${proj.technologies.join(', ')}</p>
            <p class="doc-text-block text-sm" style="margin-top:2px">${proj.description}</p>
        `;
        projContainer.appendChild(div);
    });

    // Education Container
    const eduContainer = document.getElementById('doc-res-education-container');
    eduContainer.innerHTML = '';
    state.profile.education.forEach(edu => {
        const div = document.createElement('div');
        div.style.marginBottom = '8px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:0.85rem">
                <span>${edu.degree} in ${edu.field}</span>
                <span>${edu.start_year} - ${edu.end_year}</span>
            </div>
            <p class="doc-text-block text-sm">${edu.school} (${edu.grade})</p>
        `;
        eduContainer.appendChild(div);
    });

    // Letter Textarea
    document.getElementById('tailored-letter-input').value = app.tailored_cover_letter;
}

async function saveTailoredTextFromEditor() {
    if (!state.selectedApplicationId) return;
    
    const app = state.applications.find(a => a.id === state.selectedApplicationId);
    if (!app) return;

    // Gather summary & cover letter
    const summary = document.getElementById('tailored-summary-input').value;
    const letter = document.getElementById('tailored-letter-input').value;

    // Experience bullets
    const experiences = [];
    document.querySelectorAll('.exp-tailored-bullet-input').forEach(textarea => {
        experiences.push({
            id: textarea.getAttribute('data-exp-id'),
            description: textarea.value
        });
    });

    const tailored_resume = {
        summary: summary,
        experience: experiences
    };

    // Update API
    await updateApplicationAPI(state.selectedApplicationId, {
        tailored_resume: tailored_resume,
        tailored_cover_letter: letter
    });
}

// --- Autofill Chrome Extension Simulator ---
let autofillAppId = null;

function setupAutofillSimulator() {
    document.getElementById('btn-trigger-autofill-action').addEventListener('click', triggerAutofillAnimation);
}

function loadApplicationToAutofill(appId) {
    autofillAppId = appId;
    const app = state.applications.find(a => a.id === appId);
    if (!app) return;

    // Render extension card text
    document.getElementById('ext-job-title').innerText = app.role;
    document.getElementById('ext-job-company').innerText = app.company;
    document.getElementById('ext-job-score').innerText = `${app.match_score}%`;
    document.getElementById('ext-resume-status').innerText = app.tailored_resume ? "Ready (Tailored Resume)" : "Pending";
}

function triggerAutofillAnimation() {
    const app = state.applications.find(a => a.id === (autofillAppId || state.selectedApplicationId)) || state.applications[0];
    if (!app) {
        alert("Please load or add a job application first.");
        return;
    }

    const personal = state.profile.personal || {};
    
    // Clean fields first
    const inputs = {
        'sim-first-name': personal.name ? personal.name.split(' ')[0] : 'Alex',
        'sim-last-name': personal.name ? personal.name.split(' ').slice(1).join(' ') : 'Carter',
        'sim-email': personal.email || 'alex.carter@email.com',
        'sim-phone': personal.phone || '+1 (555) 019-2834',
        'sim-linkedin': personal.linkedin || 'https://linkedin.com/in/alexcarter-dev'
    };

    // Animate inputs
    let delay = 100;
    Object.keys(inputs).forEach(id => {
        const val = inputs[id];
        const inputEl = document.getElementById(id);
        
        setTimeout(() => {
            inputEl.value = '';
            inputEl.classList.add('highlight-fill');
            
            // Typewriter effect
            let charIndex = 0;
            const timer = setInterval(() => {
                if (charIndex < val.length) {
                    inputEl.value += val[charIndex];
                    charIndex++;
                } else {
                    clearInterval(timer);
                    setTimeout(() => inputEl.classList.remove('highlight-fill'), 800);
                }
            }, 30);
            
        }, delay);
        delay += 600;
    });

    // Resume file upload box animation
    setTimeout(() => {
        const resumeBox = document.getElementById('sim-resume-upload-box');
        resumeBox.classList.add('uploaded');
        document.getElementById('sim-resume-status').innerHTML = `
            <i class="fa-solid fa-file-pdf"></i> 
            <strong>${personal.name ? personal.name.replace(/\s+/g, '_') : 'Alex_Carter'}_Resume_${app.company.replace(/\s+/g, '')}.pdf</strong>
        `;
    }, delay);

    // Cover letter textarea animation
    delay += 500;
    setTimeout(() => {
        const area = document.getElementById('sim-cover-letter-text');
        area.value = '';
        area.classList.add('highlight-fill');
        const letterVal = app.tailored_cover_letter || `Dear Hiring Team,\n\nI am thrilled to apply for the position...`;
        
        let charIndex = 0;
        const speed = 2; // Type faster for long blocks
        const timer = setInterval(() => {
            if (charIndex < letterVal.length) {
                area.value += letterVal.substr(charIndex, speed);
                charIndex += speed;
                area.scrollTop = area.scrollHeight;
            } else {
                clearInterval(timer);
                setTimeout(() => area.classList.remove('highlight-fill'), 800);
            }
        }, 10);
    }, delay);
}

// --- Interview Prep Sandbox ---
function setupInterviewPrep() {
    document.getElementById('btn-generate-prep-questions').addEventListener('click', generateMockQuestions);
    document.getElementById('btn-dictate-mock-answer').addEventListener('click', triggerSimulatedDictation);
    document.getElementById('btn-submit-answer-feedback').addEventListener('click', evaluateMockAnswer);
}

function populateInterviewJobSelector() {
    const select = document.getElementById('prep-job-selector');
    select.innerHTML = '';
    
    state.applications.forEach(app => {
        const opt = document.createElement('option');
        opt.value = app.id;
        opt.innerText = `${app.role} at ${app.company}`;
        select.appendChild(opt);
    });

    if (!state.applications.length) {
        select.innerHTML = '<option value="">No applications tracked</option>';
    }
}

async function generateMockQuestions() {
    const select = document.getElementById('prep-job-selector');
    const appId = select.value;
    const app = state.applications.find(a => a.id === appId);
    if (!app) return;

    const list = document.getElementById('prep-questions-list');
    list.innerHTML = `
        <div class="text-center py-6">
            <div class="spinner-small" style="margin: 0 auto"></div>
            <p class="text-secondary text-sm mt-3">Synthesizing job requirements...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE}/api/interview/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: app.role,
                company: app.company,
                job_description: app.notes || ""
            })
        });
        
        const questions = await res.json();
        renderPrepQuestionsList(questions);
    } catch (err) {
        console.error(err);
        list.innerHTML = '<p class="text-danger text-sm text-center py-4">Error generating questions.</p>';
    }
}

function renderPrepQuestionsList(questions) {
    const list = document.getElementById('prep-questions-list');
    list.innerHTML = '';

    questions.forEach(q => {
        const card = document.createElement('div');
        card.className = 'q-select-card';
        
        let typeClass = 'q-badge-tech';
        if (q.type === 'Behavioral') typeClass = 'q-badge-beh';
        else if (q.type === 'Situational') typeClass = 'q-badge-sit';

        card.innerHTML = `
            <div class="q-select-card-header">
                <span class="q-badge ${typeClass}">${q.type}</span>
            </div>
            <p>${q.question}</p>
        `;

        card.addEventListener('click', () => {
            document.querySelectorAll('.q-select-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            loadQuestionToSandbox(q);
        });

        list.appendChild(card);
    });
}

function loadQuestionToSandbox(q) {
    state.activeInterviewQuestion = q;
    
    // Show sandbox elements
    document.getElementById('sandbox-idle').classList.add('hidden');
    const sandbox = document.getElementById('sandbox-active');
    sandbox.classList.remove('hidden');

    document.getElementById('active-q-type').innerText = q.type;
    
    // Style active question badge
    const badge = document.getElementById('active-q-type');
    badge.className = 'badge';
    if (q.type === 'Behavioral') badge.classList.add('badge-indigo');
    else if (q.type === 'Technical') badge.classList.add('badge-success');
    else badge.classList.add('badge-indigo'); // default

    document.getElementById('active-q-text').innerText = q.question;
    
    // Reset answers
    document.getElementById('interview-answer-input').value = '';
    document.getElementById('interview-eval-card').classList.add('hidden');
}

function triggerSimulatedDictation() {
    const area = document.getElementById('interview-answer-input');
    area.value = '';
    area.focus();
    
    const mockSpeechText = 
        "Well, in my previous role at PixelCraft Studio, we ran into an issue where the main page load time was climbing. " +
        "I realized this was due to excessive API requests hitting our database. So, I took action by refactoring the " +
        "SQL joins in our Flask backend and configuring query caching. As a result, page latency dropped by 15% and " +
        "we noticed a marked improvement in user satisfaction scores.";
        
    let charIndex = 0;
    const speed = 25; // millisecond per character dictation speed
    
    const timer = setInterval(() => {
        if (charIndex < mockSpeechText.length) {
            area.value += mockSpeechText[charIndex];
            charIndex++;
            area.scrollTop = area.scrollHeight;
        } else {
            clearInterval(timer);
        }
    }, speed);
}

async function evaluateMockAnswer() {
    if (!state.activeInterviewQuestion) return;
    
    const answer = document.getElementById('interview-answer-input').value;
    const evalCard = document.getElementById('interview-eval-card');
    
    // Loading indicator
    evalCard.classList.remove('hidden');
    evalCard.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-small" style="margin: 0 auto"></div>
            <p class="text-secondary text-xs mt-2">AI grading answers using STAR matrices...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE}/api/interview/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: state.activeInterviewQuestion.question,
                answer: answer
            })
        });

        const feedback = await res.json();
        
        setTimeout(() => {
            evalCard.innerHTML = `
                <div class="eval-header">
                    <h4 class="text-success"><i class="fa-solid fa-circle-nodes"></i> Response Analysis</h4>
                    <div class="eval-score" id="eval-score-grade">${feedback.score}%</div>
                </div>
                <hr class="section-divider">
                <div class="eval-body">
                    <h5>Constructive Critique:</h5>
                    <p class="text-sm mt-1" id="eval-critique-text">${feedback.feedback}</p>
                    
                    <h5 class="mt-4 text-cyan">Strong STAR Model Response Example:</h5>
                    <p class="text-sm mt-1 font-mono italic" id="eval-suggested-text">${feedback.suggested_answer}</p>
                </div>
            `;
        }, 1200);

    } catch (err) {
        console.error(err);
        evalCard.classList.add('hidden');
        alert("Evaluation API failed.");
    }
}

// --- Utils ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
