const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:3001';

// Global state
let ROOM_ID = null;
let hostSocket = null;
let player1Socket = null;
let player2Socket = null;

// Startår
const START_YEAR = 2000;

// Korrekte årstal der skal tilføjes (10 runder)
// Disse årstal er valgt så begge spillere kan gætte korrekt
const correctYears = [1995, 2005, 1990, 2010, 1985, 2015, 1980, 2020, 1975, 2025];
let correctYearIndex = 0;
let currentRound = 0;
const MAX_ROUNDS = 10;

// Vært logik
function createHost() {
  hostSocket = io(SOCKET_URL);
  
  let receivedGuesses = new Set();
  let answerSubmitted = false;
  
  hostSocket.on('connect', () => {
    console.log('✓ Vært forbundet');
    hostSocket.emit('host:create-game');
  });
  
  hostSocket.on('host:game-created', (data) => {
    ROOM_ID = data.roomId;
    console.log(`✓ Rum oprettet: ${ROOM_ID}`);
    
    // Tilføj spillere
    setTimeout(() => {
      createPlayers();
    }, 500);
  });
  
  hostSocket.on('game:started', (data) => {
    currentRound = data.round;
    console.log(`\n🎮 Spil startet - Startår: ${data.startYear}, Runde: ${data.round}`);
  });
  
  hostSocket.on('host:guess-received', (data) => {
    console.log(`  📝 Gæt fra ${data.playerName}: ${data.year}`);
    receivedGuesses.add(data.playerId);
    
    // Når vi har 2 gæt, indsend korrekt svar
    if (receivedGuesses.size >= 2 && !answerSubmitted && correctYearIndex < correctYears.length) {
      answerSubmitted = true;
      const correctYear = correctYears[correctYearIndex];
      
      setTimeout(() => {
        console.log(`  ✅ Indsender korrekt svar: ${correctYear} (Runde ${currentRound + 1}/${MAX_ROUNDS})`);
        hostSocket.emit('host:submit-answer', { roomId: ROOM_ID, correctYear: correctYear });
        correctYearIndex++;
      }, 1000);
    }
  });
  
  hostSocket.on('game:round-results', (data) => {
    console.log(`\n📊 Runde ${currentRound} resultater:`);
    console.log(`   Korrekt år: ${data.correctYear}`);
    console.log(`   Antal kort på tidslinjen: ${data.timeline.length}`);
    console.log(`   Aktive spillere: ${data.active.length} (${data.active.join(', ')})`);
    console.log(`   Eliminerede: ${data.eliminated.length > 0 ? data.eliminated.join(', ') : 'Ingen'}`);
    console.log(`   Tidslinje: [${data.timeline.sort((a, b) => a - b).join(', ')}]`);
    
    answerSubmitted = false;
    receivedGuesses.clear();
    
    // Tjek om spillet er færdigt eller om vi har nået 10 runder
    if (data.gameEnded) {
      console.log(`\n⚠️  Spil afsluttet tidligt!`);
      console.log(`   Runde: ${currentRound}`);
      console.log(`   Aktive spillere: ${data.active.length}`);
      console.log(`   Eliminerede: ${data.eliminated.length > 0 ? data.eliminated.join(', ') : 'Ingen'}`);
      console.log(`   Finale tidslinje: [${data.timeline.sort((a, b) => a - b).join(', ')}]`);
      cleanup();
      process.exit(1);
    } else if (currentRound >= MAX_ROUNDS) {
      console.log(`\n🎉 Spil gennemført! Begge spillere klarede sig igennem ${MAX_ROUNDS} runder!`);
      console.log(`   Finale runde: ${currentRound}`);
      console.log(`   Aktive spillere: ${data.active.length}`);
      console.log(`   Finale antal kort på tidslinjen: ${data.timeline.length}`);
      console.log(`   Finale tidslinje: [${data.timeline.sort((a, b) => a - b).join(', ')}]`);
      cleanup();
      process.exit(0);
    } else {
      setTimeout(() => {
        console.log(`\n➡️  Starter næste runde...`);
        hostSocket.emit('host:next-round', { roomId: ROOM_ID });
      }, 2000);
    }
  });
  
  return hostSocket;
}

// Funktion til at beregne korrekt gæt baseret på tidslinje og korrekt år
function calculateCorrectGuess(timeline, correctYear, startYear) {
  // Første runde: gæt skal være på samme side af startåret som korrekt år
  if (timeline.length === 1) {
    // Hvis korrekt år er før startår, gæt et år før startår
    // Hvis korrekt år er efter startår, gæt et år efter startår
    // Vi gætter det korrekte år direkte, hvilket er korrekt hvis det er på samme side
    return correctYear;
  }
  
  // Efterfølgende runder: gæt skal være i samme "slot" som korrekt år
  const sorted = [...timeline].sort((a, b) => a - b);
  
  if (correctYear < sorted[0]) {
    // Korrekt år er før tidslinjen - gæt et år før (samme slot)
    return correctYear;
  } else if (correctYear > sorted[sorted.length - 1]) {
    // Korrekt år er efter tidslinjen - gæt et år efter (samme slot)
    return correctYear;
  } else {
    // Korrekt år er mellem to år i tidslinjen - gæt et år i samme interval
    for (let i = 0; i < sorted.length - 1; i++) {
      if (correctYear > sorted[i] && correctYear < sorted[i + 1]) {
        return correctYear; // Gæt det korrekte år, som er i samme interval
      }
    }
    // Hvis korrekt år matcher et eksisterende år, gæt samme år
    return correctYear;
  }
}

function createPlayers() {
  console.log(`\n👥 Tilføjer spillere...`);
  
  // Funktion til at få næste gæt for en spiller
  function getNextGuess(timeline, correctYear, startYear) {
    // Begge spillere gætter korrekt baseret på tidslinjen
    return calculateCorrectGuess(timeline, correctYear, startYear);
  }
  
  // Spiller 1
  player1Socket = io(SOCKET_URL);
  player1Socket.on('connect', () => {
    console.log(`✓ Spiller 1 forbundet`);
    const tryJoin = () => {
      if (ROOM_ID) {
        player1Socket.emit('player:join', { roomId: ROOM_ID, playerName: 'Spiller 1' });
      } else {
        setTimeout(tryJoin, 200);
      }
    };
    tryJoin();
  });
  
  player1Socket.on('player:joined', () => {
    console.log(`✓ Spiller 1 har joinet spillet`);
  });
  
  player1Socket.on('game:started', (data) => {
    if (correctYearIndex < correctYears.length) {
      const correctYear = correctYears[correctYearIndex];
      const guess = getNextGuess([data.startYear], correctYear, data.startYear);
      setTimeout(() => {
        player1Socket.emit('player:submit-guess', { roomId: ROOM_ID, year: guess });
        console.log(`  📝 Spiller 1 gætter: ${guess} (korrekt år: ${correctYear})`);
      }, 300);
    }
  });
  
  player1Socket.on('game:next-round', (data) => {
    currentRound = data.round;
    if (correctYearIndex < correctYears.length) {
      const correctYear = correctYears[correctYearIndex];
      const guess = getNextGuess(data.timeline, correctYear, START_YEAR);
      setTimeout(() => {
        player1Socket.emit('player:submit-guess', { roomId: ROOM_ID, year: guess });
        console.log(`  📝 Spiller 1 gætter: ${guess} (korrekt år: ${correctYear})`);
      }, 300);
    }
  });
  
  // Spiller 2
  player2Socket = io(SOCKET_URL);
  player2Socket.on('connect', () => {
    console.log(`✓ Spiller 2 forbundet`);
    const tryJoin = () => {
      if (ROOM_ID) {
        player2Socket.emit('player:join', { roomId: ROOM_ID, playerName: 'Spiller 2' });
      } else {
        setTimeout(tryJoin, 200);
      }
    };
    tryJoin();
  });
  
  player2Socket.on('player:joined', () => {
    console.log(`✓ Spiller 2 har joinet spillet`);
  });
  
  player2Socket.on('game:started', (data) => {
    if (correctYearIndex < correctYears.length) {
      const correctYear = correctYears[correctYearIndex];
      const guess = getNextGuess([data.startYear], correctYear, data.startYear);
      setTimeout(() => {
        player2Socket.emit('player:submit-guess', { roomId: ROOM_ID, year: guess });
        console.log(`  📝 Spiller 2 gætter: ${guess} (korrekt år: ${correctYear})`);
      }, 400);
    }
  });
  
  player2Socket.on('game:next-round', (data) => {
    currentRound = data.round;
    if (correctYearIndex < correctYears.length) {
      const correctYear = correctYears[correctYearIndex];
      const guess = getNextGuess(data.timeline, correctYear, START_YEAR);
      setTimeout(() => {
        player2Socket.emit('player:submit-guess', { roomId: ROOM_ID, year: guess });
        console.log(`  📝 Spiller 2 gætter: ${guess} (korrekt år: ${correctYear})`);
      }, 400);
    }
  });
  
  // Start spil efter spillere er klar
  setTimeout(() => {
    console.log(`\n🚀 Starter spil med startår ${START_YEAR}...`);
    hostSocket.emit('host:start-game', { roomId: ROOM_ID, startYear: START_YEAR });
  }, 2000);
}

function cleanup() {
  if (hostSocket) hostSocket.disconnect();
  if (player1Socket) player1Socket.disconnect();
  if (player2Socket) player2Socket.disconnect();
}

// Start simulation
console.log('🎯 Starter spil simulation med 2 spillere der skal klare sig igennem 10 runder...\n');
createHost();


