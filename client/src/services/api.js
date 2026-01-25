const API_BASE = 'http://localhost:3001/api';

export const api = {
  // Start a new game
  startGame: async (playerName = 'Detective') => {
    const response = await fetch(`${API_BASE}/game/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName })
    });
    return response.json();
  },

  // Get game state
  getGameState: async (sessionId) => {
    const response = await fetch(`${API_BASE}/game/${sessionId}`);
    return response.json();
  },

  // Get all NPCs
  getNPCs: async () => {
    const response = await fetch(`${API_BASE}/npc`);
    return response.json();
  },

  // Chat with an NPC
  chat: async (sessionId, npcId, message) => {
    const response = await fetch(`${API_BASE}/npc/${npcId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message })
    });
    return response.json();
  },

  // Get conversation history with NPC
  getHistory: async (sessionId, npcId) => {
    const response = await fetch(`${API_BASE}/npc/${npcId}/history?sessionId=${sessionId}`);
    return response.json();
  },

  // Make final guess
  makeGuess: async (sessionId, npcId) => {
    const response = await fetch(`${API_BASE}/game/${sessionId}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ npcId })
    });
    return response.json();
  },

  // Get clues
  getClues: async (sessionId) => {
    const response = await fetch(`${API_BASE}/game/${sessionId}/clues`);
    return response.json();
  }
};
