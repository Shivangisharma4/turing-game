import express from 'express';
import { getNPCById, getNPCList, AI_IMPOSTER_PROMPT } from '../config/npcs.js';
import { generateNPCResponse, calculateStressIncrease } from '../services/aiService.js';
import { GameSession } from '../models/GameSession.js';

const router = express.Router();

// In-memory storage fallback
const inMemorySessions = new Map();

/**
 * Get list of all NPCs
 */
router.get('/', (req, res) => {
    res.json({
        success: true,
        npcs: getNPCList()
    });
});

/**
 * Get NPC details
 */
router.get('/:npcId', (req, res) => {
    const npc = getNPCById(req.params.npcId);
    if (!npc) {
        return res.status(404).json({ success: false, error: 'NPC not found' });
    }

    // Return public info only (no hidden knowledge or prompts)
    res.json({
        success: true,
        npc: {
            id: npc.id,
            name: npc.name,
            role: npc.role,
            portrait: npc.portrait,
            location: npc.location
        }
    });
});

/**
 * Chat with an NPC
 */
router.post('/:npcId/chat', async (req, res) => {
    try {
        const { npcId } = req.params;
        const { sessionId, message } = req.body;

        if (!message || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Missing sessionId or message'
            });
        }

        const npc = getNPCById(npcId);
        if (!npc) {
            return res.status(404).json({ success: false, error: 'NPC not found' });
        }

        // Get or create session data
        let session = await GameSession.findOne({ sessionId }).catch(() => null);
        let isInMemory = false;

        if (!session) {
            session = inMemorySessions.get(sessionId);
            isInMemory = true;

            if (!session) {
                // Create a temporary session
                session = {
                    sessionId,
                    npcInteractions: {},
                    cluesDiscovered: []
                };
                inMemorySessions.set(sessionId, session);
            }
        }

        // Get or initialize NPC interaction data
        let npcData;
        if (isInMemory) {
            npcData = session.npcInteractions[npcId] || {
                npcId,
                conversationHistory: [],
                stressLevel: 0,
                secretsRevealed: []
            };
        } else {
            npcData = session.npcInteractions?.get(npcId) || {
                npcId,
                conversationHistory: [],
                stressLevel: 0,
                secretsRevealed: []
            };
        }

        // Calculate stress increase
        const stressIncrease = calculateStressIncrease(npc, message);
        const newStressLevel = Math.max(0, Math.min(100, npcData.stressLevel + stressIncrease));

        // Check if this NPC is the imposter
        const isImposter = session.imposterId === npcId;

        // Prepare NPC object (clone to avoid modifying global)
        const npcConfig = { ...npc };
        if (isImposter) {
            npcConfig.basePrompt += AI_IMPOSTER_PROMPT;
            // Imposters have slightly lower stress threshold
            npcConfig.stressThreshold = Math.max(30, npc.stressThreshold - 20);
        }

        // Generate AI response
        const aiResult = await generateNPCResponse(
            npcConfig,
            message,
            npcData.conversationHistory,
            newStressLevel
        );

        // Update conversation history
        const updatedHistory = [
            ...npcData.conversationHistory,
            { role: 'player', content: message, timestamp: new Date() },
            { role: 'npc', content: aiResult.response, timestamp: new Date() }
        ];

        // Update NPC data
        npcData.conversationHistory = updatedHistory;
        npcData.stressLevel = newStressLevel;
        npcData.lastInteraction = new Date();

        // Save to storage
        if (isInMemory) {
            session.npcInteractions[npcId] = npcData;
        } else {
            session.npcInteractions.set(npcId, npcData);
            await session.save();
        }

        // Determine stress state for UI
        let stressState = 'calm';
        if (newStressLevel >= npc.stressThreshold) {
            stressState = 'hostile';
        } else if (newStressLevel >= npc.stressThreshold * 0.6) {
            stressState = 'agitated';
        }

        res.json({
            success: true,
            response: aiResult.response,
            npcName: npc.name,
            stressLevel: newStressLevel,
            stressState,
            stressChange: stressIncrease > 0 ? `+${stressIncrease}` : stressIncrease.toString(),
            messageCount: updatedHistory.length / 2
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate response',
            details: error.message
        });
    }
});

/**
 * Get conversation history with an NPC
 */
router.get('/:npcId/history', async (req, res) => {
    try {
        const { npcId } = req.params;
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'Missing sessionId' });
        }

        let session = await GameSession.findOne({ sessionId }).catch(() => null);
        if (!session) {
            session = inMemorySessions.get(sessionId);
        }

        if (!session) {
            return res.json({ success: true, history: [], stressLevel: 0 });
        }

        const npcData = session.npcInteractions?.[npcId] ||
            session.npcInteractions?.get?.(npcId) ||
            { conversationHistory: [], stressLevel: 0 };

        res.json({
            success: true,
            history: npcData.conversationHistory || [],
            stressLevel: npcData.stressLevel || 0
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
