import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Generate an NPC response using Groq (Llama model)
 * @param {Object} npc - NPC configuration object
 * @param {string} playerMessage - Player's input message
 * @param {Array} conversationHistory - Previous messages in the conversation
 * @param {number} stressLevel - Current stress level (0-100)
 */
export async function generateNPCResponse(npc, playerMessage, conversationHistory = [], stressLevel = 0) {
    // Determine stress state
    let stressContext = npc.stressResponses.low;
    if (stressLevel >= npc.stressThreshold) {
        stressContext = npc.stressResponses.high;
    } else if (stressLevel >= npc.stressThreshold * 0.6) {
        stressContext = npc.stressResponses.medium;
    }

    // Build the system prompt with stress context
    const systemPrompt = `${npc.basePrompt}

CURRENT STRESS LEVEL: ${stressLevel}/100 (threshold: ${npc.stressThreshold})
CURRENT BEHAVIOR INSTRUCTION: ${stressContext}

IMPORTANT RULES:
- Stay completely in character at all times
- Keep responses concise (2-4 sentences typically)
- Never break the fourth wall or acknowledge you're an AI (unless you're Dr. Chen having a glitch)
- React naturally to the player's questions
- If stress is high, you may refuse to answer or become hostile
- Drop hints about your hidden knowledge when relevant, but don't volunteer everything`;

    // Format conversation history for Groq
    const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
            role: msg.role === 'player' ? 'user' : 'assistant',
            content: msg.content
        })),
        { role: 'user', content: playerMessage }
    ];

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            max_tokens: 200,
            temperature: 0.8
        });

        const response = completion.choices[0].message.content;

        return {
            success: true,
            response: response,
            stressLevel: stressLevel
        };
    } catch (error) {
        console.error('AI Service Error:', error);
        return {
            success: false,
            response: `*${npc.name} seems distracted and doesn't respond*`,
            error: error.message
        };
    }
}

/**
 * Calculate stress increase based on player message
 */
export function calculateStressIncrease(npc, message) {
    const lowerMessage = message.toLowerCase();
    // Base stress for being interrogated
    let stressIncrease = 2;

    // Check for stress triggers
    for (const trigger of npc.stressTriggers) {
        if (lowerMessage.includes(trigger.toLowerCase())) {
            stressIncrease += 15;
            console.log(`[Stress] Trigger hit: ${trigger}`);
        }
    }

    // Aggressive tone increases stress
    if (lowerMessage.includes('!') || lowerMessage.includes('demand') || lowerMessage.includes('tell me')) {
        stressIncrease += 5;
    }

    // Polite language reduces stress
    if (lowerMessage.includes('please') || lowerMessage.includes('thank')) {
        stressIncrease -= 5;
    }

    console.log(`[Stress] Message: "${message}" | Increase: ${stressIncrease}`);

    // Cap per-message increase
    return Math.max(-10, Math.min(stressIncrease, 25));
}
