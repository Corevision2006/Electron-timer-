# 🔴 Discipline Enforcer

Webcam-based study discipline system with real-time behavior monitoring, Firebase backend, and Electron shell.

---

## Stack

- **React + Tailwind** — UI
- **Electron** — Desktop shell, intercepts close/minimize
- **MediaPipe Holistic** — Webcam pose/hand tracking
- **Firebase Auth** — Email/password login
- **Firestore** — Sessions, violations, user data

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo-url>
cd discipline-enforcer
npm install
```

### 2. Firebase setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** (start in production mode)
5. Go to Project Settings → Your Apps → Add Web App → copy config

### 3. Environment variables

```bash
cp .env.example .env
# Fill in your Firebase credentials in .env
```

### 4. Deploy Firestore rules + indexes

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
npm run firebase:deploy-rules
firebase deploy --only firestore:indexes
```

### 5. Run in development

```bash
# React only (browser)
npm start

# React + Electron (desktop app)
npm run dev
```

### 6. Build for production

```bash
npm run build
npx electron-builder   # requires electron-builder in devDependencies
```

---

## Firestore Schema

```
users/{uid}
  email:       string
  createdAt:   timestamp
  streak:      number
  totalScore:  number

sessions/{sessionId}
  userId:          string    ← indexed
  startTime:       timestamp
  endTime:         timestamp | null
  status:          ACTIVE | COMPLETED | BROKEN
  totalViolations: number

violations/{violationId}
  userId:    string
  sessionId: string          ← indexed
  type:      APP_EXIT | PHONE_USAGE | DISTRACTION | ABSENT | TAB_SWITCH | CAMERA_BLOCKED
  timestamp: timestamp
```

---

## Violation Types & Penalties

| Type             | Trigger                          | Score Penalty |
|------------------|----------------------------------|---------------|
| `PHONE_USAGE`    | Hand near face (instant)         | −25           |
| `APP_EXIT`       | App closed during session        | −30           |
| `TAB_SWITCH`     | Window loses focus / minimized   | −20           |
| `ABSENT`         | No pose detected > 10s           | −15           |
| `DISTRACTION`    | Gaze off-screen > 10s            | −10           |
| `CAMERA_BLOCKED` | Camera permission denied/blocked | −5            |

Score starts at 100 per session. Min: 0.

---

## Project Structure

```
discipline-enforcer/
├── electron/
│   ├── main.js          ← Electron main process, intercepts close
│   └── preload.js       ← Secure IPC bridge
├── public/
│   └── index.html
├── src/
│   ├── firebase/
│   │   └── config.js    ← Firebase init
│   ├── auth/
│   │   ├── AuthProvider.jsx
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── session/
│   │   ├── SessionManager.js  ← Firestore writes
│   │   └── RulesEngine.js     ← Behavior state machine
│   ├── monitoring/
│   │   └── CameraMonitor.js   ← MediaPipe
│   ├── hooks/
│   │   └── useSession.js      ← Wires everything together
│   ├── dashboard/
│   │   └── Dashboard.jsx      ← Main UI
│   ├── components/
│   │   ├── ViolationAlert.jsx
│   │   ├── SessionTimer.jsx
│   │   ├── StatsCard.jsx
│   │   └── SessionHistory.jsx
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── firestore.rules      ← Security rules (deploy these!)
├── firestore.indexes.json
├── firebase.json
├── .firebaserc          ← Update with your project ID
├── .env.example         ← Copy to .env, fill credentials
├── tailwind.config.js
└── package.json
```

---

## Important Notes

- **Camera permission** must be granted when Electron asks
- **Security rules** must be deployed before the app works in production — violations and sessions will fail silently without them
- The system is **self-enforced** — it logs violations but cannot physically stop you. Respect what you build.

---

## Reality Check

Firebase logs the violation. But you hold the power to ignore logs.
The only person who can make this system real is you.

Build it. Use it. Don't cheat yourself.
