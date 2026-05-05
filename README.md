# MindSpace - Mental Health App

MindSpace is a comprehensive digital ecosystem designed to empower students and professionals with the tools they need for mental resilience. The platform provides a safe, anonymous space offering everything from mood tracking to AI-driven empathetic conversation and wellness journaling.

## Features

- **MindSpace AI Chatbot**: An always-available AI companion tailored for compassionate support and real-time conversation.
- **Mood Analytics**: A daily emotional tracker that gives personalized insights based on your mood patterns.
- **Psychiatric Consultation Booking**: Direct access to an interface for booking and joining video consultations with mental wellness professionals.
- **Wellness Journal**: A completely private space to log your daily thoughts and articulate feelings.
- **Guided Breathing Exercises**: Interactive tools designed to help reduce stress and ground you in moments of anxiety.
- **Quick Notes & Reminders**: Easily set mental health reminders and store fast daily notes directly in your wellness dashboard.
- **Interactive India Map**: Explore regional statistics around mental health needs and available care resources across the country.
- **Soundscape Widget**: Built-in relaxing atmospheric sounds (e.g., rain, forest, ocean) for focus and calmness.
- **Profile Management**: Maintain an activity history and overview of all your interactions including sessions logged and tasks completed.

## Tech Stack

This project is built using vanilla web technologies on the frontend for maximum speed and simplicity, integrated with a lightweight Node.js backend.

### Frontend
- **HTML5 & Vanilla CSS**: Dynamic, mobile-responsive layout featuring modern glassmorphism UI/UX details and dark/light toggles.
- **Vanilla JavaScript**: Complete frontend interactivity and UI state management without heavy frameworks.
- **Chart.js**: Utilized for providing rich visual trajectory charts and analytic feedback.
- **Lucide Icons**: Clean and modern iconography.

### Backend
- **Node.js with Express**: Fast and scalable web server.
- **File-based JSON Storage**: Utilizes local `.json` files inside the `/data` folder to ensure an easily portable mock architecture (Users, Appointments, Messages, Journals, Trackers, etc.).
- **CORS Setup**: Securely configured for handling browser API requests.

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone or download the repository to your local machine.
2. Navigate to the project directory:
   ```bash
   cd "Mental health"
   ```
3. Install the required Node.js dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the Express backend server by running:
```bash
node server.js
```

Once the server indicates it is running, open your web browser and go to:
`http://localhost:3000`

## Structure

- `/public`: Contains all static frontend assets (`index.html`, CSS, Vanilla JS handlers).
- `/data`: JSON-based directory representing the database for users and application data points.
- `server.js`: The Express entry point and main backend API handling logic.

## Security and Privacy
MindSpace implements an educational prototype of a safe application. The file-based JSON DB architecture is isolated locally to ensure your test-driven sensitive inputs do not leave your development machine.
