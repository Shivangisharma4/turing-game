import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['player', 'npc'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const npcInteractionSchema = new mongoose.Schema({
    npcId: {
        type: String,
        required: true
    },
    conversationHistory: [messageSchema],
    stressLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    secretsRevealed: [String],
    lastInteraction: {
        type: Date,
        default: Date.now
    }
});

const gameSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    playerName: {
        type: String,
        default: 'Detective'
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    cluesDiscovered: [String],
    npcInteractions: {
        type: Map,
        of: npcInteractionSchema,
        default: {}
    },
    gameStatus: {
        type: String,
        enum: ['active', 'won', 'lost'],
        default: 'active'
    },
    finalGuess: String,
    endedAt: Date
});

// Create indexes
gameSessionSchema.index({ sessionId: 1 });
gameSessionSchema.index({ gameStatus: 1 });

export const GameSession = mongoose.model('GameSession', gameSessionSchema);
