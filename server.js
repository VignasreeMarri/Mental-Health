const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Set permissive CSP for development to resolve inline style/script blocks
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';");
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Simple file-based DB helpers
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const TRACKERS_FILE = path.join(__dirname, 'data', 'trackers.json');
const APPOINTMENTS_FILE = path.join(__dirname, 'data', 'appointments.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');
const JOURNALS_FILE = path.join(__dirname, 'data', 'journals.json');
const NOTES_FILE = path.join(__dirname, 'data', 'notes.json');
const REMINDERS_FILE = path.join(__dirname, 'data', 'reminders.json');

const readDB = (file) => {
    try {
        if (!fs.existsSync(file)) {
            if (file === USERS_FILE || file === APPOINTMENTS_FILE || file === MESSAGES_FILE || file === JOURNALS_FILE || file === NOTES_FILE || file === REMINDERS_FILE) {
                fs.writeFileSync(file, '[]');
            }
            if (file === TRACKERS_FILE) {
                fs.writeFileSync(file, JSON.stringify({ moods: [], selfHelp: [], feedback: [] }));
            }
        }
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
        console.error("Error reading DB:", err);
        if (file === USERS_FILE || file === APPOINTMENTS_FILE) return [];
        return { moods: [], selfHelp: [], feedback: [] };
    }
};

const writeDB = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// ==========================
// Authentication Endpoints
// ==========================
app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });

    const users = readDB(USERS_FILE);
    if (users.find(u => u.email === email)) return res.status(400).json({ error: "Email already registered" });

    const newUser = { id: Date.now(), name, email, password, joinedAt: new Date().toISOString() };
    users.push(newUser);
    writeDB(USERS_FILE, users);
    res.json({ message: "Signup successful", user: { name, email } });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = readDB(USERS_FILE);
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        res.json({ message: "Login successful", user: { name: user.name, email: user.email } });
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

app.get('/api/user-profile', (req, res) => {
    const email = req.query.email;
    const users = readDB(USERS_FILE);
    const user = users.find(u => u.email === email);
    
    if (user) {
        const trackers = readDB(TRACKERS_FILE);
        // Calculate statistics
        const stats = {
            moodsCount: trackers.moods.filter(m => m.email === email).length,
            tasksCount: trackers.selfHelp.filter(s => s.email === email).length,
            feedbackCount: trackers.feedback.filter(f => f.email === email).length
        };

        res.json({ 
            name: user.name, 
            email: user.email, 
            joinedAt: user.joinedAt || "Legacy Member",
            stats 
        });
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

app.post('/api/update-profile', (req, res) => {
    const { oldEmail, newEmail, name } = req.body;
    console.log(`[API/UPDATE] Updating ${oldEmail} -> ${newEmail} (Name: ${name})`);
    
    let users = readDB(USERS_FILE);
    const userIndex = users.findIndex(u => u.email === oldEmail);

    if (userIndex !== -1) {
        // 1. Check if new email is already taken by ANOTHER user
        if (oldEmail !== newEmail) {
            const emailExists = users.some(u => u.email === newEmail);
            if (emailExists) {
                console.error(`[API/UPDATE] Email already taken: ${newEmail}`);
                return res.status(400).json({ error: "Email is already registered to another account." });
            }
        }

        // 2. Update User Record
        users[userIndex].name = name;
        users[userIndex].email = newEmail;
        writeDB(USERS_FILE, users);

        // 3. Migrate Tracker Data if Email Changed
        if (oldEmail !== newEmail) {
            let trackers = readDB(TRACKERS_FILE);
            trackers.moods = trackers.moods.map(m => m.email === oldEmail ? { ...m, email: newEmail } : m);
            trackers.selfHelp = trackers.selfHelp.map(s => s.email === oldEmail ? { ...s, email: newEmail } : s);
            trackers.feedback = trackers.feedback.map(f => f.email === oldEmail ? { ...f, email: newEmail } : f);
            writeDB(TRACKERS_FILE, trackers);
            console.log(`[API/UPDATE] Data migration successful for ${newEmail}`);
        }

        res.json({ message: "Profile updated successfully", name, email: newEmail });
    } else {
        console.error(`[API/UPDATE] User not found: ${oldEmail}`);
        res.status(404).json({ error: "User not found" });
    }
});

// ==========================
// Tracker Endpoints (Mood, Self-Help, Feedback)
// ==========================
app.post('/api/mood', (req, res) => {
    const { email, mood } = req.body;
    const trackers = readDB(TRACKERS_FILE);
    trackers.moods.push({ email, mood, date: new Date().toISOString() });
    writeDB(TRACKERS_FILE, trackers);
    res.json({ message: "Mood saved" });
});

app.post('/api/self-help', (req, res) => {
    const { email, task } = req.body;
    const trackers = readDB(TRACKERS_FILE);
    trackers.selfHelp.push({ email, task, completedAt: new Date().toISOString() });
    writeDB(TRACKERS_FILE, trackers);
    res.json({ message: "Self-help task logged" });
});

app.post('/api/feedback', (req, res) => {
    const { email, rating, comment } = req.body;
    const trackers = readDB(TRACKERS_FILE);
    trackers.feedback.push({ email, rating, comment, date: new Date().toISOString() });
    writeDB(TRACKERS_FILE, trackers);
    res.json({ message: "Feedback received" });
});

app.get('/api/trackers', (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email is required" });
    
    const trackers = readDB(TRACKERS_FILE);
    const userTrackers = {
        moods: trackers.moods.filter(m => m.email === email),
        selfHelp: trackers.selfHelp.filter(s => s.email === email),
        feedback: trackers.feedback.filter(f => f.email === email)
    };
    res.json(userTrackers);
});

app.post('/api/book-appointment', (req, res) => {
    const { email, doctorName, specialty, slot, sessionDate } = req.body;
    if (!email || !doctorName || !slot) return res.status(400).json({ error: "Missing booking info" });

    const appointments = readDB(APPOINTMENTS_FILE);
    const newAppt = {
        id: Date.now(),
        email,
        doctorName,
        specialty,
        slot,
        sessionDate: sessionDate || new Date().toISOString(),
        status: "Completed" // For simulation, we assume joining it completes it
    };
    appointments.push(newAppt);
    writeDB(APPOINTMENTS_FILE, appointments);
    res.json({ message: "Appointment booked and session logged", appointment: newAppt });
});

app.get('/api/appointments', (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const appointments = readDB(APPOINTMENTS_FILE);
    const userAppts = appointments.filter(a => a.email === email);
    res.json(userAppts);
});

// ==========================
// Wellness Journal Endpoints
// ==========================
app.post('/api/journal', (req, res) => {
    const { email, title, content } = req.body;
    if (!email || !content) return res.status(400).json({ error: "Missing journal info" });

    const journals = readDB(JOURNALS_FILE);
    const newEntry = {
        id: Date.now(),
        email,
        title: title || `Journal Entry - ${new Date().toLocaleDateString()}`,
        content,
        date: new Date().toISOString()
    };
    journals.push(newEntry);
    writeDB(JOURNALS_FILE, journals);
    res.json({ message: "Journal entry saved", entry: newEntry });
});

app.get('/api/journals', (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const journals = readDB(JOURNALS_FILE);
    const userJournals = journals.filter(j => j.email === email);
    res.json(userJournals);
});

// ==========================
// AI Chat Endpoint
// ==========================
const botResponses = [
    "I'm here for you. Could you tell me a little more about how you're feeling?",
    "That sounds challenging. Remember it's completely okay to feel this way.",
    "Taking deep breaths can sometimes help. Would you like to try a quick breathing exercise together?",
    "You are not alone in this. I'm listening.",
    "It's great that you are reaching out. Remember to be kind to yourself today."
];

app.post('/api/chat', (req, res) => {
    const { email, message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required." });

    // Simulate AI processing delay
    setTimeout(() => {
        const reply = botResponses[Math.floor(Math.random() * botResponses.length)];
        
        // Save to chat history if email exists
        if (email) {
            const history = readDB(MESSAGES_FILE);
            history.push({ email, role: 'user', content: message, timestamp: new Date().toISOString() });
            history.push({ email, role: 'bot', content: reply, timestamp: new Date().toISOString() });
            writeDB(MESSAGES_FILE, history);
        }
        
        res.json({ reply });
    }, 1500);
});

app.get('/api/chat-history', (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const history = readDB(MESSAGES_FILE);
    const userHistory = history.filter(h => h.email === email);
    res.json(userHistory);
});

// ==========================
// Notes Endpoints
// ==========================
app.get('/api/notes', (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const notes = readDB(NOTES_FILE);
    const userNotes = notes.filter(n => n.email === email);
    res.json(userNotes);
});

app.post('/api/notes', (req, res) => {
    const { email, title, content } = req.body;
    if (!email || !content) return res.status(400).json({ error: "Missing note info" });

    const notes = readDB(NOTES_FILE);
    const newNote = {
        id: Date.now(),
        email,
        title: title || `Note - ${new Date().toLocaleDateString()}`,
        content,
        date: new Date().toISOString()
    };
    notes.push(newNote);
    writeDB(NOTES_FILE, notes);
    res.json({ message: "Note saved", note: newNote });
});

app.delete('/api/notes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let notes = readDB(NOTES_FILE);
    notes = notes.filter(n => n.id !== id);
    writeDB(NOTES_FILE, notes);
    res.json({ message: "Note deleted" });
});

// ==========================
// Reminders Endpoints
// ==========================
app.get('/api/reminders', (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const reminders = readDB(REMINDERS_FILE);
    const userReminders = reminders.filter(r => r.email === email);
    res.json(userReminders);
});

app.post('/api/reminders', (req, res) => {
    const { email, message, time } = req.body;
    if (!email || !message || !time) return res.status(400).json({ error: "Missing reminder info" });

    const reminders = readDB(REMINDERS_FILE);
    const newReminder = {
        id: Date.now(),
        email,
        message,
        time, // Expected to be an ISO string or a date string
        status: "Pending",
        createdAt: new Date().toISOString()
    };
    reminders.push(newReminder);
    writeDB(REMINDERS_FILE, reminders);
    res.json({ message: "Reminder set", reminder: newReminder });
});

app.delete('/api/reminders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let reminders = readDB(REMINDERS_FILE);
    reminders = reminders.filter(r => r.id !== id);
    writeDB(REMINDERS_FILE, reminders);
    res.json({ message: "Reminder deleted" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`MindSpace Backend running at http://localhost:${PORT}`);
});
