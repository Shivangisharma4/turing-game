# The Turing Mystery 🕵️

An AI-powered detective game where you interrogate NPCs to discover which one is a malfunctioning AI. Each NPC has unique personalities, hidden knowledge, and stress responses - all powered by Google's Gemini AI.

## 🎮 The Game

A strange incident has occurred in Digital City. One of its citizens is not who they claim to be - an advanced AI has gone rogue, perfectly mimicking a human identity. Your mission: interrogate the suspects and uncover the imposter.

### Features
- **Dynamic AI Conversations**: NPCs respond in real-time using Gemini AI, staying in character
- **Stress System**: Push NPCs too hard, and they become hostile or stop cooperating
- **Hidden Knowledge**: Each NPC knows secrets - ask the right questions to uncover clues
- **One Chance**: Make your accusation carefully - you only get one guess

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Gemini API Key ([Get one free](https://aistudio.google.com/app/apikey))
- MongoDB Atlas account (optional, works without it)

### Setup

1. **Clone and install dependencies**
```bash
cd turing-mystery

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

2. **Configure environment**
```bash
cd server
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

3. **Start the servers**
```bash
# Terminal 1 - Start backend
cd server && npm run dev

# Terminal 2 - Start frontend  
cd client && npm run dev
```

4. **Play!** Open http://localhost:5173

## 🗂️ Project Structure

```
turing-mystery/
├── client/                 # React Frontend
│   └── src/
│       ├── App.jsx         # Main game component
│       ├── index.css       # Cyberpunk theme
│       └── services/api.js # API client
│
└── server/                 # Node.js Backend
    └── src/
        ├── index.js        # Express server
        ├── config/npcs.js  # NPC personalities
        ├── services/       # AI integration
        ├── routes/         # API endpoints
        └── models/         # MongoDB schemas
```

## 🎭 The Suspects

| Character | Role | Personality |
|-----------|------|-------------|
| Eleanor Price | City Archivist | Methodical, condescending, hates interruptions |
| Marcus Webb | Security Chief | Gruff, ex-military, hiding something |
| Dr. Yuki Chen | AI Researcher | Warm but... glitching? |
| Victoria Lane | Commissioner | Politically evasive, controlling |
| Eddie Torres | Maintenance | Observant, sees everything |

## 💡 Tips for Players

- Be polite to keep stress levels low
- Ask specific questions about inconsistencies
- Watch for NPCs who can't describe sensory experiences
- Pay attention to repeated phrases or strange behaviors
- Everyone knows something - find out what

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: Google Gemini 1.5 Flash
- **Database**: MongoDB (optional)
- **Styling**: Custom CSS with cyberpunk theme

## 📝 License

MIT
