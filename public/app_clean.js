// =======================
// GLOBAL STATE & SELECTORS
// =======================
let userEmail = localStorage.getItem('userEmail');
let isDarkMode = localStorage.getItem('theme') === 'dark';
let lastLoggedMood = localStorage.getItem('lastMood') || "Neutral";
let selectedDoctor = null;
let callInterval;
let callStartTime;
let localStream = null;
let moodChartInstance = null;
let largeMoodChartInstance = null;
let currentAudio = null;
let userAppointments = [];
let userJournals = [];
let userNotes = [];
let userReminders = [];
let activeActivityTab = 'appointments';
let breathingActive = false;
let breathingInterval;

// Selectors (initialized in DOMContentLoaded)
let els = {};

const initializeSelectors = () => {
    const ids = [
        'loggedInNav', 'loggedOutNav', 'navTrackMoodBtn', 'themeIcon', 'themeToggleBtn',
        'authModal', 'modalLoginTab', 'modalSignupTab', 'modalLoginForm', 'modalSignupForm', 'closeAuthBtn',
        'openLoginBtn', 'openSignupBtn', 'guestTrackMoodBtn',
        'chatbotToggleBtn', 'chatbotWindow', 'closeChatBtn', 'chatInput', 'sendMessageBtn', 'chatArea', 'navChatBtn', 'heroChatBtn',
        'emergencyBtn', 'emergencyModal', 'closeEmergencyBtn', 'profileBtn', 'profileModal', 'backProfileBtn',
        'profileName', 'profileEmail', 'joinedDateText', 'statMoods', 'statTasks', 'statFeedback',
        'profileView', 'profileEditView', 'editProfileBtn', 'cancelEditBtn', 'editProfileForm', 'editNameInput', 'editEmailInput',
        'landingView', 'dashboardView', 'backToHomeBtn', 'dashWelcomeTitle', 'dashJoinedDate', 'dashStatMoods', 'dashStatTasks', 'dashStatFeedback', 'dashActivityList',
        'moodModal', 'openMoodModalBtn', 'closeMoodModalBtn', 'finishMoodBtn', 'moodSelectionStep', 'moodResultsStep', 'modalResultsGrid', 'modalMoodTitle', 'backMoodBtn',
        'consultationFlowModal', 'step1DoctorList', 'step2ApptSlots', 'doctorListGrid', 'slotsGrid', 'selectedDocName', 'selectedDocSpecialty', 'confirmConsultBtn', 'backToDoctors', 'closeConsultFlowBtn',
        'videoConsultationModal', 'endCallBtn', 'callTimer', 'activeDocNameDisplay', 'soundscapeWidget', 'soundToggle', 'soundMenu', 'soundVolume', 'soundStatus',
        'breathingModal', 'breathingCircle', 'breathingText', 'startBreathingBtn', 'closeBreathingModalBtn', 'openBreathingModalBtn',
        'journalModal', 'openJournalModalBtn', 'closeJournalModalBtn', 'saveJournalBtn', 'journalTitleInput', 'journalContentInput',
        'noteModal', 'openNoteModalBtn', 'closeNoteModalBtn', 'saveNoteBtn', 'noteTitleInput', 'noteContentInput',
        'reminderModal', 'openReminderModalBtn', 'closeReminderModalBtn', 'saveReminderBtn', 'reminderMessageInput', 'reminderTimeInput',
        'sosFloatingBtn', 'indiaMapWrapper', 'mapStateInsights', 'historyTypeFilter', 'dashActivityList',
        'dashMoodChart', 'dashMoodChartLarge', 'doctorList', 'instantConsultBtn', 'backFromConsultBtn'
    ];
    ids.forEach(id => els[id] = document.getElementById(id));
};

// =======================
// UTILITIES
// =======================
function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';
    if (type === 'warning') iconName = 'alert-triangle';

    notification.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <div class="notification-content">
            <span class="notification-title">${type.toUpperCase()}</span>
            <span class="notification-msg">${message}</span>
        </div>
    `;

    container.appendChild(notification);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 400);
    }, 5000);
}

function updateNavbar() {
    if (userEmail) {
        if (els.loggedInNav) els.loggedInNav.style.display = 'flex';
        if (els.loggedOutNav) els.loggedOutNav.style.display = 'none';
        if (els.navTrackMoodBtn) els.navTrackMoodBtn.style.display = 'block';
        
        if (els.themeIcon) {
            els.themeIcon.setAttribute('data-lucide', isDarkMode ? 'sun' : 'moon');
            if (window.lucide) lucide.createIcons();
        }
    } else {
        if (els.loggedInNav) els.loggedInNav.style.display = 'none';
        if (els.loggedOutNav) els.loggedOutNav.style.display = 'flex';
        if (els.navTrackMoodBtn) els.navTrackMoodBtn.style.display = 'none';
    }
}

// =======================
// AUTH LOGIC
// =======================
function switchAuthTab(tab) {
    if (tab === 'login') {
        els.modalLoginTab?.classList.add('active');
        els.modalSignupTab?.classList.remove('active');
        els.modalLoginForm?.classList.add('active');
        els.modalSignupForm?.classList.remove('active');
    } else {
        els.modalSignupTab?.classList.add('active');
        els.modalLoginTab?.classList.remove('active');
        els.modalSignupForm?.classList.add('active');
        els.modalLoginForm?.classList.remove('active');
    }
}

async function handleModalAuthSubmit(e) {
    e.preventDefault();
    const isLogin = e.target.id === 'modalLoginForm';
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Processing...';
    btn.disabled = true;

    const emailInput = document.getElementById(isLogin ? 'loginEmail' : 'signupEmail');
    const passwordInput = document.getElementById(isLogin ? 'loginPassword' : 'signupPassword');
    const nameInput = document.getElementById('signupName');

    const email = emailInput?.value;
    const password = passwordInput?.value;
    const name = nameInput?.value || "";

    const endpoint = isLogin ? '/api/login' : '/api/signup';
    const body = isLogin ? { email, password } : { name, email, password };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('userEmail', email);
            userEmail = email;
            els.authModal?.classList.remove('active');
            updateNavbar();
            showNotification(`Welcome, ${data.user?.name || email}!`, "success");
            loadProfile();
            
            setTimeout(() => openMoodModal(), 800);
        } else {
            showNotification(data.error || "Auth failed", "error");
        }
    } catch (err) {
        showNotification("Connection error", "error");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// =======================
// PROFILE & DASHBOARD
// =======================
async function loadProfile() {
    if (!userEmail) return;
    try {
        const response = await fetch(`/api/user-profile?email=${encodeURIComponent(userEmail)}`);
        if (response.ok) {
            const data = await response.json();
            if (els.profileName) els.profileName.textContent = data.name;
            if (els.profileEmail) els.profileEmail.textContent = data.email;
            if (els.dashWelcomeTitle) els.dashWelcomeTitle.textContent = `Welcome back, ${data.name.split(' ')[0]}!`;
            if (els.dashJoinedDate) {
                const date = new Date(data.joinedAt);
                els.dashJoinedDate.textContent = data.joinedAt === "Legacy Member" ? "Legacy Member" : `Member since: ${date.toLocaleDateString()}`;
            }
            if (els.statMoods) els.statMoods.textContent = data.stats.moodsCount;
            if (els.dashStatMoods) els.dashStatMoods.textContent = data.stats.moodsCount;
            if (els.editNameInput) els.editNameInput.value = data.name;
            if (els.editEmailInput) els.editEmailInput.value = data.email;

            renderMoodChart();
            loadAppointments();
            loadJournals();
            loadNotes();
            loadReminders();
        }
    } catch(err) { console.error(err); }
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    const name = els.editNameInput.value;
    const newEmail = els.editEmailInput.value;
    const oldEmail = userEmail;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Updating...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldEmail, newEmail, name })
        });

        if (response.ok) {
            userEmail = newEmail;
            localStorage.setItem('userEmail', newEmail);
            showNotification("Profile updated successfully!");
            els.profileModal.classList.remove('active');
            loadProfile();
            updateNavbar();
        } else {
            const data = await response.json();
            showNotification(data.error || "Update failed", "error");
        }
    } catch (err) {
        showNotification("Connection error", "error");
    } finally {
        btn.textContent = 'Save Changes';
        btn.disabled = false;
    }
}

function showDashboard() {
    if (!userEmail) return showNotification("Please login", "warning");
    els.landingView?.classList.remove('active');
    els.landingView.style.display = 'none'; // Fallback
    
    // Hide global header
    const mainHeader = document.querySelector('.header');
    if (mainHeader) mainHeader.style.display = 'none';

    els.dashboardView?.classList.add('active');
    els.dashboardView.style.display = 'block'; // Fallback
    loadProfile();
    bindDashButtons();
    if (window.lucide) lucide.createIcons();
}

function showLanding() {
    els.dashboardView?.classList.remove('active');
    els.dashboardView.style.display = 'none';
    els.landingView?.classList.add('active');
    els.landingView.style.display = 'block';
    
    // Show global header
    const mainHeader = document.querySelector('.header');
    if (mainHeader) mainHeader.style.display = 'block';

    window.scrollTo(0, 0);
}

function switchDashView(viewName) {
    document.querySelectorAll('.dash-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`dashView-${viewName}`);
    if (target) target.classList.add('active');
    if (viewName === 'stats') renderLargeMoodChart();
    else if (viewName === 'history') renderActivityFeed();
    if (window.lucide) lucide.createIcons();
}

// =======================
// CHATBOT
// =======================
function toggleChat() {
    els.chatbotWindow?.classList.toggle('active');
    if (els.chatbotWindow?.classList.contains('active')) {
        setTimeout(() => els.chatInput?.focus(), 300);
        if (userEmail) loadChatHistory();
    }
}

async function loadChatHistory() {
    try {
        const response = await fetch(`/api/chat-history?email=${encodeURIComponent(userEmail)}`);
        const history = await response.json();
        if (els.chatArea) els.chatArea.innerHTML = '';
        if (history.length === 0) addMessage("Hello! I'm MindSpace. How are you feeling today?", false);
        else history.forEach(msg => addMessage(msg.content, msg.role === 'user'));
    } catch (err) { console.error(err); }
}

function addMessage(text, isUser = false) {
    if (!text || !els.chatArea) return;
    const msg = document.createElement('div');
    msg.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    msg.innerHTML = `<div class="message-content">${text}</div>`;
    els.chatArea.appendChild(msg);
    els.chatArea.scrollTop = els.chatArea.scrollHeight;
}

async function handleSendMessage() {
    const text = els.chatInput.value;
    if (!text.trim()) return;
    addMessage(text, true);
    els.chatInput.value = '';

    // Hide suggestions after sending
    const suggestions = document.getElementById('chatSuggestions');
    if (suggestions) suggestions.style.display = 'none';

    // Add typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot-message typing';
    typingIndicator.innerHTML = '<div class="message-content">MindSpace is typing...</div>';
    els.chatArea.appendChild(typingIndicator);
    els.chatArea.scrollTop = els.chatArea.scrollHeight;

    try {
        const res = await fetch('/api/chat', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email: userEmail, message: text }) 
        });
        const data = await res.json();
        typingIndicator.remove();
        addMessage(data.reply, false);
    } catch(err) { 
        typingIndicator.remove();
        addMessage("Connection error. I'm still here for you though.", false); 
    }
}

window.sendSuggested = (text) => {
    els.chatInput.value = text;
    handleSendMessage();
};

// =======================
// MOOD TRACKING
// =======================
const moodDiscoveryData = {
    "Great": {
        remedy: "High energy day! Channel this into a creative task or a group activity.",
        meditation: "5-Minute Gratitude: Focus on three things you're thankful for right now.",
        doctors: ["MindSpace Hub (Chennai)", "Apollo Wellness", "Dr. Shalini (GeriCare)"]
    },
    "Good": {
        remedy: "Maintain this positive momentum. Write down one thing you're proud of.",
        meditation: "Body Scan: A quick 3-minute scan to recognize where you feel joy.",
        doctors: ["Athma Care (Chennai)", "Global Hospital", "Dr. Vignesh (Psychiatrist)"]
    },
    "Neutral": {
        remedy: "A perfect time for reflection. Try a digital detox for an hour.",
        meditation: "Breath Awareness: 4 minutes of simply watching your breath flow.",
        doctors: ["Serene Life (Chennai)", "MIOT International", "Dr. Ananya (Counselor)"]
    },
    "Anxious": {
        remedy: "Use the 5-4-3-2-1 grounding technique to reconnect with the present.",
        meditation: "Box Breathing: Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s.",
        doctors: ["Fortis Health (Chennai)", "Dr. Senthil (T Nagar)", "Chennai Mind Center"]
    },
    "Stressed": {
        remedy: "Identify one task you can delegate or delay. Physical stretching helps.",
        meditation: "Progressive Relaxation: Tense and release each muscle group slowly.",
        doctors: ["Dr. Arul (Psychiatrist)", "Geri Care (Adyar)", "MindSpace Experts"]
    },
    "Sad": {
        remedy: "Be gentle with yourself. Reach out to one trusted friend or family member.",
        meditation: "Kindness Meditation: Repeat positive affirmations to yourself quietly.",
        doctors: ["Shadithya (Pallavaram)", "Dr. Preethi (Counselor)", "Apollo Shine"]
    },
    "Angry": {
        remedy: "Release the energy safelyâ€”try a quick walk or a vigorous workout.",
        meditation: "Cooling Breath: Inhale through the mouth, exhale slowly through the nose.",
        doctors: ["Mindful Living (Chennai)", "Dr. Kausalya", "Kauvery Hospital"]
    },
    "Overwhelmed": {
        remedy: "Break your day into 15-minute blocks. Focus only on the first one.",
        meditation: "Mental De-clutter: Visualize your thoughts as clouds passing by.",
        doctors: ["Peak State (Chennai)", "Dr. Rahul (Psychiatrist)", "MindSpace Hub"]
    }
};

const indianDoctors = [
    { id: 1, name: "Dr. Aditi Sharma", specialty: "Anxiety & Stress", rating: 4.9, experience: "12 yrs", img: "https://images.unsplash.com/photo-1594824813573-c45ff1451367?auto=format&fit=crop&w=300&q=80", bio: "Specialist in CBT and mindfulness-based stress reduction." },
    { id: 2, name: "Dr. Rajesh Iyer", specialty: "Depression & Mood", rating: 4.8, experience: "15 yrs", img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80", bio: "Over 15 years of experience in clinical psychiatry and mood disorders." },
    { id: 3, name: "Dr. Kavita Reddy", specialty: "OCD & Trauma", rating: 4.7, experience: "10 yrs", img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80", bio: "Expert in trauma-informed care and obsessive-compulsive disorders." },
    { id: 4, name: "Dr. Senthil Kumar", specialty: "Sleep & Wellness", rating: 4.6, experience: "8 yrs", img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80", bio: "Dedicated to holistic wellness and sleep hygiene optimization." },
    { id: 5, name: "Dr. Ananya Das", specialty: "Student Counseling", rating: 4.9, experience: "9 yrs", img: "https://images.unsplash.com/photo-1594824813573-c45ff1451367?auto=format&fit=crop&w=300&q=80", bio: "Passionate about helping students navigate academic and personal challenges." }
];

const stateInsightData = {
    "Tamil Nadu": { title: "Tamil Nadu", summary: "Strong student resilience initiatives in Chennai.", stat: "18% decrease in student stress reports.", doctor: "Dr. Senthil Kumar", resource: "GeriCare Wellness" },
    "Maharashtra": { title: "Maharashtra", summary: "Corporate wellness growth in Mumbai and Pune.", stat: "25% rise in tele-therapy adoption.", doctor: "Dr. Aditi Sharma", resource: "Mindful Mumbai" },
    "Karnataka": { title: "Karnataka", summary: "Tech-focused mental health support in Bangalore.", stat: "NIMHANS leads community outreach.", doctor: "Dr. Rajesh Iyer", resource: "Bangalore Resilience Hub" },
    "Delhi": { title: "Delhi NCR", summary: "Addressing high-paced lifestyle stress.", stat: "Highest density of psychologists.", doctor: "Dr. Kavita Reddy", resource: "Kiran Helpline" },
    "West Bengal": { title: "West Bengal", summary: "Community peer support groups in Kolkata.", stat: "High engagement in university programs.", doctor: "Dr. Ananya Das", resource: "Bengal Wellness" },
    "Gujarat": { title: "Gujarat", summary: "Expanding access in Ahmedabad and Surat.", stat: "Workplace wellness awareness up 15%.", doctor: "Dr. Rajesh Iyer", resource: "Gujarat Mental Health" },
    "Uttar Pradesh": { title: "Uttar Pradesh", summary: "Rural mental health awareness campaigns.", stat: "500+ new community health workers trained.", doctor: "Dr. Kavita Reddy", resource: "UP Swasthya Line" },
    "Rajasthan": { title: "Rajasthan", summary: "Student support initiatives in Kota.", stat: "Dedicated helplines for competitive exam stress.", doctor: "Dr. Aditi Sharma", resource: "Kota Student Care" },
    "Madhya Pradesh": { title: "Madhya Pradesh", summary: "Public-private partnerships for wellness.", stat: "Increasing outreach in Bhopal and Indore.", doctor: "Dr. Rajesh Iyer", resource: "MP Wellness Mission" },
    "Punjab": { title: "Punjab", summary: "Youth counseling against substance abuse.", stat: "20% increase in early intervention cases.", doctor: "Dr. Senthil Kumar", resource: "Navjeevan Centers" },
    "Haryana": { title: "Haryana", summary: "Addressing urban stress in Gurugram.", stat: "Corporate wellness programs at peak adoption.", doctor: "Dr. Aditi Sharma", resource: "Gurugram Mind Care" },
    "Himachal Pradesh": { title: "Himachal Pradesh", summary: "Mindfulness and nature therapy integration.", stat: "High satisfaction in mountain wellness retreats.", doctor: "Dr. Ananya Das", resource: "Himalayan Healing" },
    "Jammu and Kashmir": { title: "Jammu and Kashmir", summary: "Trauma-informed care and counseling.", stat: "Expanding tele-psychiatry in remote areas.", doctor: "Dr. Rajesh Iyer", resource: "J&K Relief Line" },
    "Ladakh": { title: "Ladakh", summary: "Community-based support for isolation stress.", stat: "Tele-consultation is the primary care mode.", doctor: "Dr. Kavita Reddy", resource: "Ladakh Care Network" },
    "Kerala": { title: "Kerala", summary: "Pioneering community-based primary care.", stat: "Highest literacy in mental health awareness.", doctor: "Dr. Senthil Kumar", resource: "Kerala Health Mission" },
    "Andhra Pradesh": { title: "Andhra Pradesh", summary: "Scaling mobile mental health units.", stat: "Significant outreach in Vizag and Vijayawada.", doctor: "Dr. Rajesh Iyer", resource: "AP Wellness Hub" },
    "Telangana": { title: "Telangana", summary: "Innovation in digital mental health.", stat: "T-Hub supports 10+ mental health startups.", doctor: "Dr. Aditi Sharma", resource: "Telangana Mind Care" },
    "Odisha": { title: "Odisha", summary: "Disaster-related trauma support programs.", stat: "Robust counseling network in coastal areas.", doctor: "Dr. Ananya Das", resource: "Odisha Resilience Path" },
    "Jharkhand": { title: "Jharkhand", summary: "Tribal community mental health outreach.", stat: "Focus on reducing stigma in rural belts.", doctor: "Dr. Kavita Reddy", resource: "Jharkhand Sahayata" },
    "Chhattisgarh": { title: "Chhattisgarh", summary: "Public health integration of wellness.", stat: "Training of frontline Asha workers in counseling.", doctor: "Dr. Senthil Kumar", resource: "CG Health Line" },
    "Bihar": { title: "Bihar", summary: "Expansion of district-level counseling.", stat: "Increasing female participation in therapy.", doctor: "Dr. Kavita Reddy", resource: "Bihar Manas Mission" },
    "Assam": { title: "Assam", summary: "Northeast regional mental health hub.", stat: "LGBIMH Tezpur leading clinical care.", doctor: "Dr. Ananya Das", resource: "Assam Care Hub" },
    "Goa": { title: "Goa", summary: "Stress management for tourism workers.", stat: "High awareness of depression and anxiety.", doctor: "Dr. Rajesh Iyer", resource: "Goa Wellness Path" },
    "Uttarakhand": { title: "Uttarakhand", summary: "Nature-based healing and meditation hubs.", stat: "Rishikesh leads in yoga-therapy research.", doctor: "Aditi Sharma", resource: "Devbhoomi Healing" },
    "Sikkim": { title: "Sikkim", summary: "Focus on academic and emotional wellbeing.", stat: "High literacy in mental health basics.", doctor: "Ananya Das", resource: "Sikkim Wellness Network" },
    "Arunachal Pradesh": { title: "Arunachal Pradesh", summary: "Community support in remote hillside towns.", stat: "Expanding mobile health initiatives.", doctor: "Rajesh Iyer", resource: "Himalayan Care" },
    "Manipur": { title: "Manipur", summary: "Trauma-informed care focus.", stat: "Community groups highly active.", doctor: "Senthil Kumar", resource: "Manipur Support Hub" },
    "Mizoram": { title: "Mizoram", summary: "Strong local church-based counseling.", stat: "Peer support is a primary resource.", doctor: "Kavita Reddy", resource: "Zoram Wellness" },
    "Nagaland": { title: "Nagaland", summary: "Youth wellness and career counseling.", stat: "Focus on reducing social isolation.", doctor: "Ananya Das", resource: "Naga Resilience" },
    "Tripura": { title: "Tripura", summary: "Expansion of psychiatric services in Agartala.", stat: "Rise in awareness seminars.", doctor: "Rajesh Iyer", resource: "Tripura MindCare" },
    "Andaman and Nicobar Islands": { title: "Andaman & Nicobar", summary: "Island-based outreach and tele-consultation.", stat: "Connectivity for care is improving.", doctor: "Senthil Kumar", resource: "Port Blair Care" },
    "Lakshadweep": { title: "Lakshadweep", summary: "Addressing isolation stress through digital tools.", stat: "Tele-health is the key mode of care.", doctor: "Rajesh Iyer", resource: "Coral Health" },
    "Puducherry": { title: "Puducherry", summary: "Integrative medicine and mental wellness.", stat: "Auroville leading in research.", doctor: "Aditi Sharma", resource: "Puducherry Relief" },
    "Chandigarh": { title: "Chandigarh", summary: "High-density resource access in the city.", stat: "Model city for geriatric care.", doctor: "Rajesh Iyer", resource: "Chandigarh Wellness" },
    "Dadra and Nagar Haveli": { title: "Dadra & Nagar Haveli", summary: "Industrial worker wellness programs.", stat: "Increasing corporate counseling.", doctor: "Kavita Reddy", resource: "Silvassa Support" },
};

function openMoodModal() {
    els.moodSelectionStep.style.display = 'block';
    els.moodResultsStep.style.display = 'none';
    els.moodModal?.classList.add('active');
}

// =======================
// INITIALIZATION
// =======================
document.addEventListener('DOMContentLoaded', () => {
    initializeSelectors();
    updateNavbar();
    if (userEmail) loadProfile();

    // Nav Listeners
    els.openLoginBtn?.addEventListener('click', () => { switchAuthTab('login'); els.authModal.classList.add('active'); });
    els.openSignupBtn?.addEventListener('click', () => { switchAuthTab('signup'); els.authModal.classList.add('active'); });
    els.navTrackMoodBtn?.addEventListener('click', () => openMoodModal());
    els.closeAuthBtn?.addEventListener('click', () => els.authModal.classList.remove('active'));
    els.modalLoginTab?.addEventListener('click', () => switchAuthTab('login'));
    els.modalSignupTab?.addEventListener('click', () => switchAuthTab('signup'));
    els.modalLoginForm?.addEventListener('submit', handleModalAuthSubmit);
    els.modalSignupForm?.addEventListener('submit', handleModalAuthSubmit);

    // Chat
    els.chatbotToggleBtn?.addEventListener('click', toggleChat);
    els.closeChatBtn?.addEventListener('click', toggleChat);
    els.navChatBtn?.addEventListener('click', (e) => { e.preventDefault(); toggleChat(); });
    els.heroChatBtn?.addEventListener('click', toggleChat);
    els.sendMessageBtn?.addEventListener('click', handleSendMessage);
    els.chatInput?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSendMessage(); });

    // Profile/Dashboard
    els.profileBtn?.addEventListener('click', e => { e.preventDefault(); if (userEmail) showDashboard(); else { switchAuthTab('login'); els.authModal.classList.add('active'); }});
    els.backToHomeBtn?.addEventListener('click', showLanding);
    document.querySelectorAll('.sidebar-link').forEach(link => link.addEventListener('click', () => {
        const view = link.dataset.view;
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        if (view === 'settings') { els.profileModal.classList.add('active'); els.profileView.style.display='none'; els.profileEditView.style.display='block'; }
        else switchDashView(view);
    }));

    // Mood
    els.openMoodModalBtn?.addEventListener('click', openMoodModal);
    els.closeMoodModalBtn?.addEventListener('click', () => els.moodModal.classList.remove('active'));
    els.backMoodBtn?.addEventListener('click', () => {
        els.moodSelectionStep.style.display = 'block';
        els.moodResultsStep.style.display = 'none';
    });
    els.finishMoodBtn?.addEventListener('click', () => els.moodModal.classList.remove('active'));
    document.querySelectorAll('.mood-btn-large').forEach(btn => btn.addEventListener('click', async () => {
        const mood = btn.dataset.mood;
        const data = moodDiscoveryData[mood];
        if (!data) return;
        
        await fetch('/api/mood', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail, mood }) });
        lastLoggedMood = mood;
        
        if (els.modalMoodTitle) els.modalMoodTitle.textContent = `Guidance for ${mood}`;
        if (els.modalResultsGrid) {
            els.modalResultsGrid.innerHTML = `
                <div class="discovery-card">
                    <div class="discovery-icon-box remedy">
                        <i data-lucide="sparkles"></i>
                    </div>
                    <div class="discovery-info">
                        <h4>Self-Care Remedy</h4>
                        <p>${data.remedy}</p>
                    </div>
                </div>
                <div class="discovery-card">
                    <div class="discovery-icon-box focus">
                        <i data-lucide="wind"></i>
                    </div>
                    <div class="discovery-info">
                        <h4>Mindful Meditation</h4>
                        <p>${data.meditation}</p>
                        <div style="margin-top: 10px;">
                            <button class="mini-btn-link" onclick="startBreathing()"><i data-lucide="play-circle" style="width: 16px; height: 16px;"></i> Start Session</button>
                        </div>
                    </div>
                </div>
                <div class="discovery-card">
                    <div class="discovery-icon-box doctor">
                        <i data-lucide="user-plus"></i>
                    </div>
                    <div class="discovery-info">
                        <h4>Nearby Professional Support</h4>
                        <ul style="list-style: none; padding: 0; margin-top: 5px;">
                            ${data.doctors.map(d => `<li style="font-size: 0.85rem; display: flex; align-items: center; gap: 8px; margin-bottom: 5px;"><i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--accent-primary);"></i> ${d}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
        els.moodSelectionStep.style.display = 'none';
        els.moodResultsStep.style.display = 'block';
    }));

    // Global Logout
    document.addEventListener('click', e => {
        if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn') || e.target.id === 'logoutBtnAlt' || e.target.closest('#logoutBtnAlt')) {
             localStorage.removeItem('userEmail');
             window.location.reload();
        }
    });

    // Theme
    els.themeToggleBtn?.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        if (els.themeIcon) els.themeIcon.setAttribute('data-lucide', isDarkMode ? 'sun' : 'moon');
        if (window.lucide) lucide.createIcons();
    });

    // Emergency
    els.emergencyBtn?.addEventListener('click', () => els.emergencyModal.classList.add('active'));
    els.closeEmergencyBtn?.addEventListener('click', () => els.emergencyModal.classList.remove('active'));

    // Profile Settings
    els.editProfileBtn?.addEventListener('click', () => {
        els.profileView.style.display = 'none';
        els.profileEditView.style.display = 'block';
    });
    els.cancelEditBtn?.addEventListener('click', () => {
        els.profileView.style.display = 'block';
        els.profileEditView.style.display = 'none';
    });
    els.backProfileBtn?.addEventListener('click', () => els.profileModal.classList.remove('active'));
    els.editProfileForm?.addEventListener('submit', handleUpdateProfile);

    // Landing Feedback Form
    const landingFeedbackForm = document.getElementById('landingFeedbackForm');
    landingFeedbackForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        showNotification("Thank you for your feedback! We'll review it shortly.", "success");
        landingFeedbackForm.reset();
    });

    // Expose helpers
    window.openMoodModal = openMoodModal;
    window.showDashboard = showDashboard;
    
    // Localization & New Features
    // Localization & New Features
    initSOS();
    initConsultationFlow();
    initIndiaMap();
});

function initSOS() {
    els.sosFloatingBtn?.addEventListener('click', () => els.emergencyModal.classList.add('active'));
}

function initConsultationFlow() {
    window.renderDoctors = (searchTerm = '') => {
        const grid = document.getElementById('doctorList');
        if (!grid) return;
        
        const term = searchTerm.toLowerCase();
        const filtered = term === '' ? indianDoctors : indianDoctors.filter(d => 
            d.specialty.toLowerCase().includes(term) || d.name.toLowerCase().includes(term) || d.bio.toLowerCase().includes(term)
        );
        
        if (filtered.length === 0) {
            grid.innerHTML = `<div style="text-align:center;width:100%;padding:2rem;color:var(--text-secondary);">No doctors found matching "${searchTerm}".</div>`;
            return;
        }

        grid.innerHTML = filtered.map(doc => `
            <div class="doctor-card" onclick="selectDoctor(${doc.id})">
                <div class="doc-img-box">
                    <img src="${doc.img}" alt="${doc.name}">
                    <div class="doc-rating"><i data-lucide="star"></i> ${doc.rating}</div>
                </div>
                <div class="doc-details">
                    <h4>${doc.name}</h4>
                    <p class="doc-spec">${doc.specialty}</p>
                    <div class="doc-meta">
                        <span><i data-lucide="briefcase"></i> ${doc.experience}</span>
                        <button class="book-mini-btn">Select Time</button>
                    </div>
                </div>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();
    };

    const docSearchInput = document.getElementById('doctorSearchInput');
    if (docSearchInput) {
        docSearchInput.addEventListener('input', (e) => {
            renderDoctors(e.target.value);
        });
    }

    els.backFromConsultBtn?.addEventListener('click', () => {
        closeModal(els.consultationFlowModal);
    });

    els.instantConsultBtn?.addEventListener('click', () => {
        els.consultationFlowModal.classList.add('active');
        renderDoctors();
    });

    els.closeConsultFlowBtn?.addEventListener('click', () => els.consultationFlowModal.classList.remove('active'));
    
    window.selectDoctor = (id) => {
        console.log("Selecting doctor:", id);
        selectedDoctor = indianDoctors.find(d => d.id === id);
        if (!selectedDoctor) return;
        
        els.step1DoctorList.style.display = 'none';
        els.step2ApptSlots.style.display = 'block';
        
        if (els.selectedDocName) els.selectedDocName.textContent = selectedDoctor.name;
        if (els.selectedDocSpecialty) els.selectedDocSpecialty.textContent = selectedDoctor.specialty;
        const mainImg = document.getElementById('step2DocImg');
        if (mainImg) mainImg.src = selectedDoctor.img;
        
        // Generate Slots
        const slots = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"];
        if (els.slotsGrid) {
            console.log("Rendering slots grid");
            els.slotsGrid.innerHTML = slots.map(s => `<button class="slot-btn" onclick="selectSlot(this)">${s}</button>`).join('');
        } else {
            console.error("slotsGrid element not found!");
        }
    };

    window.selectSlot = (btn) => {
        document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        els.confirmConsultBtn.disabled = false;
    };

    els.confirmConsultBtn?.addEventListener('click', async () => {
        if (!selectedDoctor) return;
        
        const slot = document.querySelector('.slot-btn.selected')?.textContent;
        const res = await fetch('/api/book-appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                doctorName: selectedDoctor.name,
                specialty: selectedDoctor.specialty,
                slot: slot
            })
        });

        if (res.ok) {
            showNotification(`Appointment confirmed with ${selectedDoctor.name}!`);
            els.consultationFlowModal.classList.remove('active');
            loadAppointments();
            
            // Auto-start video call for "Instant Consult" experience
            setTimeout(() => startVideoCall(selectedDoctor.name), 1000);
        }
    });

    els.backToDoctors?.addEventListener('click', () => {
        els.step1DoctorList.style.display = 'block';
        els.step2ApptSlots.style.display = 'none';
    });
}

async function startVideoCall(docName) {
    els.activeDocNameDisplay.textContent = `Consultation with ${docName}`;
    els.videoConsultationModal.style.display = 'flex';
    
    const doc = indianDoctors.find(d => d.name === docName) || indianDoctors[0];
    document.getElementById('doctorVideo').src = doc.img;

    // Camera Access via WebRTC MediaDevices
    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const userVideo = document.getElementById('userVideo');
            if (userVideo) {
                userVideo.srcObject = localStream;
                userVideo.play();
            }
        } else {
            console.warn("navigator.mediaDevices not supported in this browser context.");
            showNotification("Camera access not supported by browser context", "error");
        }
    } catch (err) {
        console.warn("Camera access denied or unavailable", err);
        showNotification("Please allow camera access to join the consultation.", "warning");
    }

    // Timer
    let seconds = 0;
    if (callInterval) clearInterval(callInterval);
    callInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        els.callTimer.textContent = `${mins}:${secs}`;
    }, 1000);
}

els.endCallBtn?.addEventListener('click', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    clearInterval(callInterval);
    els.videoConsultationModal.style.display = 'none';
    els.videoConsultationModal.classList.remove('active');
    showNotification("Consultation session ended.");
});

document.getElementById('backFromVideoBtn')?.addEventListener('click', () => {
    els.videoConsultationModal.style.display = 'none';
    els.videoConsultationModal.classList.remove('active');
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    clearInterval(callInterval);
});

function initIndiaMap() {
    if (!els.indiaMapWrapper) return;
    
    // Simplified India SVG for visualization
        const indiaSVG = `
        <svg class="india-map-svg" viewBox="0 0 612 696" xmlns="http://www.w3.org/2000/svg">
        </svg>
    `;
    
    els.indiaMapWrapper.innerHTML = indiaSVG;
    
    setTimeout(() => {
        document.querySelectorAll('.state-path').forEach(path => {
            path.addEventListener('click', () => {
                const state = path.dataset.state;
                document.querySelectorAll('.state-path').forEach(p => p.classList.remove('active'));
                path.classList.add('active');
                showStateInsights(state);
            });
        });
    }, 100);
}

function showStateInsights(stateName) {
    const data = stateInsightData[stateName] || {
        title: stateName,
        summary: "Mental health awareness is growing in this region with new community initiatives.",
        stat: "General data indicates a positive trend in help-seeking behavior.",
        doctor: "Dr. Aditi Sharma",
        resource: "Generic Health Centers"
    };

    els.mapStateInsights.innerHTML = `
        <div class="state-insight-content">
            <h3><i data-lucide="info"></i> ${data.title}</h3>
            <p>${data.summary}</p>
            <div class="insight-card">
                <h4><i data-lucide="bar-chart"></i> Key Statistic</h4>
                <p>${data.stat}</p>
            </div>
            <div class="insight-card" style="border-left: 4px solid var(--accent-primary);">
                <h4><i data-lucide="user"></i> Top Specialist Nearby</h4>
                <p>${data.doctor}</p>
            </div>
            <p style="margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-secondary);">Resource: ${data.resource}</p>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function startBreathing() {
    showNotification("Deep Breath: Inhale... Exhale. Your meditation session has started.", "success");
}

// Stubs for missing functionality to prevent errors
async function renderMoodChart() {
    if (!els.dashMoodChart) return;
    try {
        const response = await fetch(`/api/trackers?email=${encodeURIComponent(userEmail)}`);
        const data = await response.json();
        const moods = data.moods.slice(-7); // Last 7 logs
        
        const labels = moods.map(m => new Date(m.date).toLocaleDateString(undefined, { weekday: 'short' }));
        const moodValues = moods.map(m => {
            const map = { "Great": 5, "Good": 4, "Neutral": 3, "Anxious": 2, "Stressed": 2, "Sad": 1, "Angry": 1, "Overwhelmed": 1 };
            return map[m.mood] || 3;
        });

        const moodColors = moods.map(m => {
            const map = { "Great": "#2ecc71", "Good": "#4cc9f0", "Neutral": "#95a5a6", "Anxious": "#f1c40f", "Stressed": "#e67e22", "Sad": "#9b59b6", "Angry": "#e63946", "Overwhelmed": "#34495e" };
            return map[m.mood] || "#4361ee";
        });

        if (moodChartInstance) moodChartInstance.destroy();
        moodChartInstance = new Chart(els.dashMoodChart, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Mood Level',
                    data: moodValues,
                    borderColor: '#4361ee',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    pointBackgroundColor: moodColors,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const moodNames = ["", "V. Low", "Low", "Neutral", "Good", "Excellent"];
                                return `Mood: ${moodNames[context.raw] || context.raw}`;
                            }
                        }
                    }
                },
                scales: { y: { min: 1, max: 5, ticks: { stepSize: 1 } } }
            }
        });
    } catch (err) { console.error(err); }
}

async function renderLargeMoodChart() {
    if (!els.dashMoodChartLarge) return;
    try {
        const response = await fetch(`/api/trackers?email=${encodeURIComponent(userEmail)}`);
        const data = await response.json();
        const moods = data.moods.slice(-15); // Last 15 logs
        
        const labels = moods.map(m => new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const moodValues = moods.map(m => {
            const map = { "Great": 5, "Good": 4, "Neutral": 3, "Anxious": 2, "Stressed": 2, "Sad": 1, "Angry": 1, "Overwhelmed": 1 };
            return map[m.mood] || 3;
        });

        // Update top stats
        let total = data.moods.length;
        if(document.getElementById('advStatTotal')) document.getElementById('advStatTotal').textContent = total;
        
        if (total > 0 && document.getElementById('advStatAvg')) {
            let avg = (moodValues.reduce((a,b)=>a+b,0) / moodValues.length).toFixed(1);
            let avgLabel = avg >= 4.5 ? "Excellent" : avg >= 3.5 ? "Good" : avg >= 2.5 ? "Neutral" : avg >= 1.5 ? "Low" : "Very Low";
            document.getElementById('advStatAvg').textContent = `${avgLabel} (${avg})`;
            
            let moodFreqs = {};
            data.moods.forEach(m => moodFreqs[m.mood] = (moodFreqs[m.mood] || 0) + 1);
            let topMood = Object.keys(moodFreqs).reduce((a, b) => moodFreqs[a] > moodFreqs[b] ? a : b);
            document.getElementById('advStatFreq').textContent = topMood;
        }

        if (largeMoodChartInstance) largeMoodChartInstance.destroy();
        
        const ctx = els.dashMoodChartLarge.getContext('2d');
        let gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(67, 97, 238, 0.5)');
        gradient.addColorStop(1, 'rgba(67, 97, 238, 0.0)');

        largeMoodChartInstance = new Chart(els.dashMoodChartLarge, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Mood Score',
                    data: moodValues,
                    borderColor: '#4361ee',
                    borderWidth: 3,
                    tension: 0.4, // smooth curved line
                    fill: true,
                    backgroundColor: gradient,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#4361ee',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 12,
                        titleFont: { size: 14, family: 'Inter' },
                        bodyFont: { size: 13, family: 'Inter' },
                        callbacks: {
                            label: function(context) {
                                const mapRev = {1: "Low", 2: "Stressed/Anxious", 3: "Neutral", 4: "Good", 5: "Great"};
                                return ` Score: ${context.parsed.y} (${mapRev[context.parsed.y] || ''})`;
                            }
                        }
                    }
                },
                scales: { 
                    y: { 
                        min: 1, 
                        max: 5,
                        grid: { color: 'rgba(0,0,0,0.05)', borderDash: [5, 5] },
                        ticks: { stepSize: 1, color: '#64748b', font: { family: 'Inter' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { family: 'Inter' } }
                    }
                }
            }
        });
    } catch (err) { console.error(err); }
}

async function loadAppointments() {
    try {
        const res = await fetch(`/api/appointments?email=${encodeURIComponent(userEmail)}`);
        userAppointments = await res.json();
        renderActivityFeed();
    } catch (err) { console.error(err); }
}

async function loadJournals() {
    try {
        const res = await fetch(`/api/journals?email=${encodeURIComponent(userEmail)}`);
        userJournals = await res.json();
        renderActivityFeed();
    } catch (err) { console.error(err); }
}

async function loadNotes() {
    try {
        const res = await fetch(`/api/notes?email=${encodeURIComponent(userEmail)}`);
        userNotes = await res.json();
        renderActivityFeed();
    } catch (err) { console.error(err); }
}

async function loadReminders() {
    try {
        const res = await fetch(`/api/reminders?email=${encodeURIComponent(userEmail)}`);
        userReminders = await res.json();
        renderActivityFeed();
    } catch (err) { console.error(err); }
}

function renderActivityFeed() {
    const list = els.dashActivityList;
    const fullList = document.getElementById('dashHistoryFullList');
    if (!list) return;

    let allItems = [];
    userAppointments.forEach(a => allItems.push({ ...a, type: 'appointment', sortDate: new Date(a.sessionDate) }));
    userJournals.forEach(j => allItems.push({ ...j, type: 'journal', sortDate: new Date(j.date) }));
    userNotes.forEach(n => allItems.push({ ...n, type: 'note', sortDate: new Date(n.date) }));
    userReminders.forEach(r => allItems.push({ ...r, type: 'reminder', sortDate: new Date(r.createdAt) }));

    // Fetch Moods for History
    if (localStorage.getItem('userEmail')) {
        fetch(`/api/trackers?email=${encodeURIComponent(localStorage.getItem('userEmail'))}`)
            .then(res => res.json())
            .then(data => {
                data.moods.forEach(m => allItems.push({ ...m, type: 'mood', title: `Feeling ${m.mood}`, sortDate: new Date(m.date) }));
                allItems.sort((a, b) => b.sortDate - a.sortDate);
                renderFinalList(allItems);
            });
    } else {
        allItems.sort((a, b) => b.sortDate - a.sortDate);
        renderFinalList(allItems);
    }
}

function renderFinalList(allItems) {
    const list = els.dashActivityList;
    const fullList = document.getElementById('dashHistoryFullList');

    const filter = els.historyTypeFilter?.value || 'all';
    const filteredItems = filter === 'all' ? allItems : allItems.filter(i => i.type === filter);

    const generateHTML = (item, isCompact) => {
        let icon = 'calendar';
        let color = '#4361ee';
        let content = item.message || item.content || item.doctorName || item.title || "No description";
        let titlePrefix = item.type.charAt(0).toUpperCase() + item.type.slice(1);

        if (item.type === 'journal') { icon = 'book-open'; color = '#9b5de5'; }
        if (item.type === 'note') { icon = 'file-text'; color = '#2ecc71'; }
        if (item.type === 'reminder') { icon = 'bell-ring'; color = '#f39c12'; }
        if (item.type === 'mood') { icon = 'smile'; color = '#00bbf9'; content = "Logged emotional state"; }

        const displayTitle = item.title ? item.title : `${titlePrefix} Entry`;
        
        if (isCompact) {
            return `
                <div style="background: rgba(248,250,252,0.6); padding: 1rem; border-radius: 12px; margin-bottom: 0.8rem; display: flex; align-items: center; gap: 1rem; border: 1px solid #f1f5f9;">
                    <div style="background: ${color}20; color: ${color}; padding: 0.6rem; border-radius: 10px;">
                        <i data-lucide="${icon}" style="width: 18px; height: 18px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="font-size: 0.95rem; margin: 0 0 0.2rem 0; color: #1e293b;">${displayTitle}</h4>
                        <p style="font-size: 0.8rem; color: #64748b; margin: 0;">${content.substring(0, 40)}${content.length > 40 ? '...' : ''}</p>
                    </div>
                    <div style="font-size: 0.75rem; color: #94a3b8;">
                        ${item.sortDate.toLocaleString(undefined, { month: 'short', day: 'numeric'})}
                    </div>
                </div>
            `;
        }

        return `
            <div class="timeline-item">
                <div class="timeline-dot" style="color: ${color};">
                    <i data-lucide="${icon}" style="width: 18px; height: 18px;"></i>
                </div>
                <div class="timeline-content">
                    <div class="tl-left">
                        <div class="tl-title">${displayTitle}</div>
                        <div class="tl-desc">${content}</div>
                        <div class="tl-date"><i data-lucide="clock" style="width:14px; height:14px;"></i> ${item.sortDate.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    ${item.type === 'appointment' ? `<div class="tl-action"><button onclick="startVideoCall('${item.doctorName}')"><i data-lucide="video" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i> Join Call</button></div>` : ''}
                </div>
            </div>
        `;
    };

    if (list) {
        const compactItems = filteredItems.slice(0, 3);
        list.innerHTML = compactItems.length > 0 
            ? compactItems.map(i => generateHTML(i, true)).join('') 
            : '<div style="text-align:center; padding: 2rem; color: #94a3b8;">No recent activity</div>';
    }

    if (fullList) {
        fullList.innerHTML = filteredItems.length > 0 
            ? filteredItems.map(i => generateHTML(i, false)).join('') 
            : '<div style="text-align: center; padding: 4rem 2rem; color: #94a3b8;"><i data-lucide="inbox" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i><p>No activity records found matching this filter.</p></div>';
    }
    
    if (window.lucide) lucide.createIcons();
}

function bindDashButtons() {
    els.dashBreatheBtn?.addEventListener('click', () => els.breathingModal.classList.add('active'));
    els.dashJournalBtn?.addEventListener('click', () => els.journalModal.classList.add('active'));
    els.dashNoteBtn?.addEventListener('click', () => els.noteModal.classList.add('active'));
    els.dashReminderBtn?.addEventListener('click', () => els.reminderModal.classList.add('active'));
    els.historyTypeFilter?.addEventListener('change', renderActivityFeed);

    els.saveJournalBtn?.addEventListener('click', async () => {
        if(!userEmail) return showNotification("Please login first", "warning");
        const title = els.journalTitleInput.value;
        const content = els.journalContentInput.value;
        if (!content) return showNotification("Please write something", "warning");
        try {
            const res = await fetch('/api/journal', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:userEmail, title, content}) });
            if (res.ok) { showNotification("Journal saved!", "success"); loadJournals(); els.journalModal.classList.remove('active'); els.journalTitleInput.value=''; els.journalContentInput.value=''; }
        } catch(e) { showNotification("Error connecting to server", "error"); }
    });

    els.saveNoteBtn?.addEventListener('click', async () => {
        if(!userEmail) return showNotification("Please login first", "warning");
        const title = els.noteTitleInput.value;
        const content = els.noteContentInput.value;
        if (!content) return showNotification("Please write something", "warning");
        try {
            const res = await fetch('/api/notes', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:userEmail, title, content}) });
            if (res.ok) { showNotification("Note saved!", "success"); loadNotes(); els.noteModal.classList.remove('active'); els.noteTitleInput.value=''; els.noteContentInput.value=''; }
        } catch(e) { showNotification("Error connecting to server", "error"); }
    });

    els.saveReminderBtn?.addEventListener('click', async () => {
        if(!userEmail) return showNotification("Please login first", "warning");
        const message = els.reminderMessageInput.value;
        const time = els.reminderTimeInput.value;
        if (!message || !time) return showNotification("Please fill all fields", "warning");
        try {
            const res = await fetch('/api/reminders', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:userEmail, message, time}) });
            if (res.ok) { showNotification("Reminder set!", "success"); loadReminders(); els.reminderModal.classList.remove('active'); els.reminderMessageInput.value=''; els.reminderTimeInput.value=''; }
        } catch(e) { showNotification("Error connecting to server", "error"); }
    });
}

// Expose helpers
window.openMoodModal = openMoodModal;
window.showDashboard = showDashboard;
window.startBreathing = startBreathing;
