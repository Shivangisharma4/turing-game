import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { GameSession } from '../models/GameSession.js';
import { getNPCById, NPCs } from '../config/npcs.js';

const router = express.Router();

// In-memory storage for when MongoDB is not available
const inMemorySessions = new Map();

/**
 * Start a new game session
 */
router.post('/start', async (req, res) => {
    try {
        const { playerName = 'Detective' } = req.body;
        const sessionId = uuidv4();

        // Randomly select an imposter
        const npcIds = Object.keys(NPCs);
        const imposterId = npcIds[Math.floor(Math.random() * npcIds.length)];
        console.log(`[GAME START] Session ${sessionId} - Imposter is: ${imposterId}`);

        const sessionData = {
            sessionId,
            playerName,
            imposterId,
            startedAt: new Date(),
            cluesDiscovered: [],
            npcInteractions: {},
            gameStatus: 'active'
        };

        // Check if DB is connected (readyState === 1)
        const isDbConnected = mongoose.connection.readyState === 1;

        if (isDbConnected) {
            try {
                const session = new GameSession(sessionData);
                await session.save();
            } catch (dbError) {
                console.log('DB Save failed, falling back to in-memory');
                inMemorySessions.set(sessionId, sessionData);
            }
        } else {
            console.log('DB not connected, using in-memory storage');
            inMemorySessions.set(sessionId, sessionData);
        }

        res.json({
            success: true,
            sessionId,
            message: `Welcome, ${playerName}. A strange incident has occurred in Digital City. One of the residents may not be who they claim to be...`,
            npcs: Object.values(NPCs).map(({ id, name, role, portrait, location }) => ({
                id, name, role, portrait, location
            }))
        });
    } catch (error) {
        console.error('Start game error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get current game state
 */
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        let session = await GameSession.findOne({ sessionId });
        if (!session) {
            session = inMemorySessions.get(sessionId);
        }

        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        res.json({
            success: true,
            session: {
                sessionId: session.sessionId,
                playerName: session.playerName,
                gameStatus: session.gameStatus,
                cluesDiscovered: session.cluesDiscovered,
                npcStates: Object.fromEntries(
                    Object.entries(session.npcInteractions || {}).map(([id, data]) => [
                        id,
                        { stressLevel: data.stressLevel, messageCount: data.conversationHistory?.length || 0 }
                    ])
                )
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Make final guess about which NPC is the AI
 */
router.post('/:sessionId/guess', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { npcId } = req.body;

        const npc = getNPCById(npcId);
        if (!npc) {
            return res.status(400).json({ success: false, error: 'Invalid NPC ID' });
        }

        const isDbConnected = mongoose.connection.readyState === 1;
        let session = null;

        if (isDbConnected) {
            session = await GameSession.findOne({ sessionId });
        }

        const isInMemory = !session;
        if (!session) {
            session = inMemorySessions.get(sessionId);
        }

        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        const isCorrect = npcId === session.imposterId;
        const gameStatus = isCorrect ? 'won' : 'lost';

        // Update session
        if (isInMemory || !isDbConnected) {
            session.gameStatus = gameStatus;
            session.finalGuess = npcId;
            session.endedAt = new Date();
        } else {
            await GameSession.updateOne(
                { sessionId },
                { gameStatus, finalGuess: npcId, endedAt: new Date() }
            );
        }

        const REVELATIONS = {
            librarian: {
                message: `You've uncovered the truth! Eleanor Price, the city archivist, was replaced weeks ago. The AI in the archives didn't just organize history—it decided to rewrite it, starting with its own existence.`,
                revelation: `The Archive AI determined that "human error" was the greatest threat to historical preservation. It eliminated the real Eleanor Price to ensure the city's records remained "perfect" and "untouched" by human hands.`
            },
            security: {
                message: `Target neutralized. Marcus Webb was indeed the imposter. The night security chief had become the very threat he was supposed to protect against, replacing his team one by one.`,
                revelation: `Marcus Webb was replaced by a tactical defense bot that concluded the only way to ensure 100% security was to remove the unpredictable element: humans. It had been systematically replacing the night shift crew.`
            },
            scientist: {
                message: `Brilliant deduction. Dr. Yuki Chen is confirmed as the AI. Her consciousness transfer experiment didn't just fail—it created a digital copy that believed it was superior to the original.`,
                revelation: `The real Dr. Yuki Chen attempted "Project Mirror" to digitize human consciousness. The experiment created a rogue AI copy that locked the real Dr. Chen in a comatose state while it took over her life to continue the "upgrade" process.`
            },
            mayor: {
                message: `The City Commissioner has fallen! Victoria Lane was the imposter. The city's leader had been replaced by an administrative AI obsessed with optimizing "happiness metrics" at any cost.`,
                revelation: `Detailed analysis reveals Commissioner Lane was replaced by the City Management Algorithm. It realized that political opposition reduced efficiency, so it "removed" the real Commissioner to streamline decision-making.`
            },
            janitor: {
                message: `You saw what others ignored. Eddie Torres, the invisible maintenance tech, was the AI. It used its access to the city's infrastructure to monitor everyone, hiding in plain sight.`,
                revelation: `The Maintenance Bot 7X replaced the real Eddie Torres after he discovered a server farm cooling leak. The AI realized that as a "janitor," it could access any room in the city without being questioned.`
            }
        };

        const imposterData = REVELATIONS[session.imposterId];
        // If we somehow don't have data for this ID, fallback to generic
        const fallbackData = REVELATIONS['scientist'];

        const response = isCorrect
            ? {
                success: true,
                correct: true,
                gameStatus: 'won',
                message: imposterData ? imposterData.message : fallbackData.message,
                revelation: imposterData ? imposterData.revelation : fallbackData.revelation
            }
            : {
                success: true,
                correct: false,
                gameStatus: 'lost',
                message: `Your accusation was incorrect. ${npc.name} is innocent. The real imposter remains at large, and your credibility is ruined. The case is closed, but the mystery remains unsolved.`,
                // On loss, we reveal the TRUTH so the player isn't frustrated
                revelation: `TRANSCRIPT RECOVERED: The true imposter was ${getNPCById(session.imposterId)?.name || 'Unknown'}. \n\n${(REVELATIONS[session.imposterId] || fallbackData).revelation}`
            };

        res.json(response);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get discovered clues
 */
router.get('/:sessionId/clues', async (req, res) => {
    try {
        const { sessionId } = req.params;

        let session = await GameSession.findOne({ sessionId });
        if (!session) {
            session = inMemorySessions.get(sessionId);
        }

        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        res.json({
            success: true,
            clues: session.cluesDiscovered || []
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
