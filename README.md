# Hutster - Live Quiz App

En live quiz-app inspireret af Kahoot, hvor flere spillere kan deltage samtidigt fra deres mobiltelefoner.

## Features

- 🎮 Opret og host quiz-sessioner
- 📱 Mobil-venlig design
- ⚡ Real-time opdateringer med WebSocket
- 🏆 Live leaderboard
- 🎯 Multiple-choice spørgsmål
- 📊 Øjeblikkelig feedback

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Real-time**: Socket.io
- **Styling**: CSS (Mobile-first)

## Installation

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

## Kør appen

```bash
# Start både server og client i development mode
npm run dev
```

- Server: http://localhost:3000
- Client: http://localhost:5173

## Sådan bruger du appen

### Som Host:
1. Gå til host-siden
2. Opret en quiz med spørgsmål
3. Start spillet - du får en PIN-kode
4. Del PIN-koden med spillerne
5. Styrer spillet fra host-interfacet

### Som Spiller:
1. Åbn appen på din mobil
2. Indtast PIN-koden
3. Indtast dit navn
4. Besvar spørgsmålene når de vises
5. Se din placering på leaderboardet

## Struktur

```
/
├── server/           # Backend Express + Socket.io server
│   ├── index.js      # Server entry point
│   └── gameManager.js # Quiz game logic
├── client/           # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   └── package.json
└── package.json      # Root package.json
```
