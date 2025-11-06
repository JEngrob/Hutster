# Hitster Online

Et online multiplayer musik-gætte-spil, hvor én vært styrer spillet fra en fællesskærm, mens andre spillere deltager via deres mobiltelefoner.

## Funktioner

- 🎮 Vært opretter spil og får en spil-kode
- 📱 Spillere joiner med kode og navn
- 🎵 Værten spiller sange offline og indtaster korrekt årstal
- ⏱️ Spillere gætter udgivelsesår
- 📊 Tidslinje vokser dynamisk med hver korrekt sang
- 🏆 Sidst tilbageværende spiller vinder
- 🔒 Omfattende sikkerhedsforanstaltninger
- 🛡️ Rate limiting og DoS beskyttelse
- ✨ Valg mellem at bevare eller fjerne spillere ved reset
- 📈 Vis gæt med korrekt/forkert markering efter svar

## Teknologi

- **Frontend**: Next.js 14 med TypeScript og Tailwind CSS
- **Backend**: Node.js Express server med Socket.io
- **Real-time**: Socket.io for live kommunikation mellem vært og spillere

## Sikkerhed

Applikationen inkluderer omfattende sikkerhedsforanstaltninger:

- ✅ **Input validering**: Alle inputs valideres og sanitizes
- ✅ **XSS beskyttelse**: Player names sanitizes for at forhindre XSS angreb
- ✅ **Rate limiting**: 100 requests per minut per socket
- ✅ **DoS beskyttelse**: 
  - Max 50 spillere per rum
  - Max 5 rum per socket
- ✅ **CORS**: Restriktiv CORS konfiguration
- ✅ **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- ✅ **Error handling**: Omfattende error handling på både server og client
- ✅ **Input sanitization**: Room IDs og player names valideres strengt

## Installation

1. Installer dependencies:
```bash
npm install
```

2. Opret `.env.local` fil:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_URL=http://localhost:3000
PORT=3001
```

3. Start serveren (i en terminal):
```bash
npm run server
```

4. Start Next.js appen (i en anden terminal):
```bash
npm run dev
```

5. Åbn browseren på `http://localhost:3000`

## Brug

1. **Vært**: Gå til `/host/create` for at oprette et nyt spil
2. **Spillere**: Gå til `/player` og indtast spil-koden og dit navn
3. **Spil**: Værten starter spillet med et startårstal, spiller sange offline, og indtaster korrekte årstal efter hver runde

## Projektstruktur

```
/
├── server/           # Socket.io backend server
├── app/              # Next.js app router pages
├── components/       # React komponenter
├── hooks/            # Custom React hooks
└── package.json
```

## Udvikling

- `npm run dev` - Start Next.js development server
- `npm run server` - Start Socket.io server
- `npm run build` - Build til production
- `npm run start` - Start production server

