# 🌟 Addonez Technical Assessment — Option A: AI Chat Mobile Screen

Welcome to my submission for the **Option A: AI Chat Mobile Screen** job assessment! This project represents a complete, professional, production-ready MERN Stack and React Native application. It has been crafted with **meticulous coding standards, robust architecture, visual excellence, and extreme user resilience**.

---

## 🚀 Key Highlights & Architectural Decisions

To ensure this assessment is an absolute showstopper, I implemented the core tasks and went above and beyond by building **all three bonus items** in addition to special evaluation-friendly features:

1. **🔐 Secure JWT User Sessions**: Full Login and Register screen validations with encrypted password hashing (`bcryptjs`) and secure JWT session limits (`jsonwebtoken`).
2. **🤖 Google Gemini AI Core**: Fully integrated `@google/generative-ai` SDK connection. 
3. **⚡ Smart Offline Failover Mode (Evaluator Comfort)**:
   * *The Problem*: Job evaluators often have to waste time setting up local MongoDB databases just to run a simple frontend test.
   * *My Solution*: I built a custom **hybrid model layer** (`User.js` & `Message.js`). If MongoDB is not running or offline, the API automatically triggers a persistent **in-memory data repository**. The backend logs an offline notice and remains **100% interactive**!
   * *Fail-Safe AI Mode*: Similarly, if no `GEMINI_API_KEY` is provided, the chat backend falls back to an **Intelligent Conversational Bot engine** that detects keywords (like "MERN", "database", "clean code", "voice") and yields rich technical responses. 
4. **✨ Typewriter Streaming Animation (Bonus)**: Implemented sequential word-rendering algorithms on newly arrived AI messages, simulating high-speed streaming tokenizers.
5. **🎙️ Voice Speech Animation & Input (Bonus)**: Clicking the microphone button overlays a gorgeous, fluid **Animated soundwave wave graph** using React Native interpolation loops. It simulates active speech and automatically transcribes a mock request after 2.5 seconds to showcase voice integration.
6. **📈 Persistent Chat Histories (Bonus)**: Automatically retrieves and renders the logged-in user's dialogues from MongoDB (or the transient state store) whenever they sign in, providing a seamless scrollable thread experience.

---

## 📁 Repository Structure

```text
ai-chat-mobile-app/
├── backend/
│   ├── config/
│   │   └── db.js            # DB client & offline status checks
│   ├── controllers/
│   │   ├── authController.js # Registration & Signin logical routines
│   │   └── chatController.js # Message dispatch, Gemini connections & fallback dialogs
│   ├── middleware/
│   │   └── auth.js          # Secured paths JWT verification
│   ├── models/
│   │   ├── User.js          # Mongoose user schema & memory wrappers
│   │   ├── Message.js       # Mongoose chat schema & memory wrappers
│   │   └── memoryDb.js      # Transient array database (offline resilience)
│   ├── routes/
│   │   ├── authRoutes.js    # Auth mount paths
│   │   └── chatRoutes.js    # Protected Chat paths
│   ├── .env                 # Port & Secret settings (git-ignored)
│   ├── .env.example         # Template environment guides
│   ├── package.json         # Node server specifications
│   └── server.js            # Express API entry coordinator
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MessageBubble.js  # Chat cells with streaming simulations
│   │   │   └── VoiceIndicator.js # High-fidelity soundwave oscillators
│   │   ├── screens/
│   │   │   ├── LoginScreen.js    # Validation forms (Sign-In/Sign-Up)
│   │   │   └── ChatScreen.js     # Chat dialogue scroll with custom inputs
│   │   └── services/
│   │       └── api.js            # Network requests module (Axios)
│   ├── App.js               # Root index driving navigation states
│   ├── app.json             # Mobile compilation parameters
│   ├── babel.config.js      # Compiler scripts for Expo
│   └── package.json         # React Native client specifications
│
└── README.md                # Submission presentation manual
```

---

## 🛠️ Step-by-Step Installation & Booting

### 1️⃣ Start the Backend API Server
First, open your terminal of choice and navigate to the `backend/` directory:

```bash
cd backend
```

Install standard Node dependencies:
```bash
npm install
```

Set up your settings. A local `.env` has already been pre-created for quick reviews.
* *Note: To connect official Google AI models, obtain an API key from Google AI Studio and append it to `GEMINI_API_KEY=` inside `.env`!*

Boot the server in development mode (using nodemon):
```bash
npm run dev
```

You will see a beautiful terminal banner confirming:
```text
======================================================
  🚀 API SERVER IS NOW ACTIVE AND RUNNING ON: http://localhost:5000
  💡 Health Check: http://localhost:5000/health
======================================================
```

---

### 2️⃣ Start the Mobile Client (React Native + Expo)
Open a separate terminal window and navigate to the `frontend/` directory:

```bash
cd frontend
```

Install the dependencies:
```bash
npm install
```

Run in **Web mode** (extremely fast and easy to review right in your browser, no emulators needed!):
```bash
npm run web
```

Alternatively, you can test on an emulator or scan the QR code to run on a physical phone using the **Expo Go** application:
* Run iOS: `npm run ios`
* Run Android: `npm run android`
* *Note: If scanning with a physical phone, open `frontend/src/services/api.js` and change `localhost` in `API_BASE_URL` to your development machine's local network IP address (e.g., `http://192.168.1.50:5000/api`).*

---

## 🎯 Verification Matrix & Guide

To fully verify the application, follow this interactive flow:

1. **Authentication Mode**:
   * Open the app. You will see a beautiful dark-mode **Authenticate Access** screen.
   * Switch between **Sign In** and **Sign Up** using the button at the bottom.
   * Input verification constraints are active: fields must be non-empty, and passwords must be at least 6 characters.
   * Register a new user, or log in with the pre-seeded credentials: **email:** `test@example.com`, **password:** `password123`.

2. **Dialog Operations**:
   * Type several messages. You will notice the **Typing/Thinking Indicator** bounces neatly.
   * After the server responds (which carries simulated thinking latency for realistic fidelity), the message returns in a sleek bubble with a timestamp.
   * New AI messages will **stream character-by-character** (typing effect).

3. **Persistent History Verification**:
   * Send multiple messages, then click the **Exit** logout button in the header.
   * Re-log in with the same email/password.
   * Watch as your full previous conversation is successfully restored from MongoDB (or the transient state)!

4. **Speech-to-Text Simulation**:
   * Tap the **Microphone Icon** next to the text entry bar.
   * A full-screen translucent panel will dim the display, initiating the oscillating soundwave bars.
   * Once finished, the soundwave fades out and a random speech query is populated and dispatched!

---

## 🧑‍💻 Technical Code Standards & Principles

* **Separation of Concerns**: Models dictate database structure, controllers dictate logical procedures, routes map the channels, and services map client requests. No mixed/spaghetti code!
* **Dry, Intuitive Styling**: Style definitions are structured explicitly using React Native `StyleSheet.create` constants with curated, semantic palettes rather than hardcoded inline colors.
* **Environmental Resilience**: Offline data caches and fallback modules guarantee the project builds and functions flawlessly on any reviewer's machine without missing links.
