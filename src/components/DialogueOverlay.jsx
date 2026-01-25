import { useState, useEffect, useRef } from 'react';
import { PaperPlaneTilt, Warning, Target, ArrowLeft } from '@phosphor-icons/react';
import './DialogueOverlay.css';

// Typewriter effect hook
function useTypewriter(text, speed = 30) {
    const [displayText, setDisplayText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        setDisplayText('');
        setIsComplete(false);

        if (!text) return;

        let index = 0;
        const timer = setInterval(() => {
            if (index < text.length) {
                setDisplayText(text.slice(0, index + 1));
                index++;
            } else {
                setIsComplete(true);
                clearInterval(timer);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    return { displayText, isComplete };
}

// Message display with typewriter
function DialogueMessage({ message, isLatest }) {
    const { displayText, isComplete } = useTypewriter(
        isLatest ? message.content : null,
        5
    );

    const content = isLatest ? displayText : message.content;
    const showCursor = isLatest && !isComplete;

    return (
        <div className={`dialogue-message ${message.role}`}>
            {message.role === 'npc' && (
                <span className="message-speaker">{message.speaker || 'NPC'}:</span>
            )}
            {message.role === 'player' && (
                <span className="message-speaker">You:</span>
            )}
            <span className="message-content">
                {content}
                {showCursor && <span className="typing-cursor">▌</span>}
            </span>
        </div>
    );
}

// Main dialogue overlay component
export default function DialogueOverlay({
    npc,
    messages,
    onSendMessage,
    onBack,
    isLoading,
    stressLevel = 0
}) {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    const getStressColor = () => {
        if (stressLevel >= 70) return '#ff3366';
        if (stressLevel >= 40) return '#ffaa00';
        return '#00ff88';
    };

    return (
        <div className="dialogue-overlay">
            {/* Header */}
            <div className="dialogue-header">
                <button className="back-button" onClick={onBack}>
                    <ArrowLeft size={20} weight="bold" />
                </button>

                <div className="npc-info">
                    <div className="npc-avatar">{npc.portrait}</div>
                    <div className="npc-details">
                        <span className="npc-name">{npc.name}</span>
                        <span className="npc-role">{npc.role}</span>
                    </div>
                </div>

                <div className="stress-display">
                    <Warning size={16} weight="fill" style={{ color: getStressColor() }} />
                    <div className="stress-bar-container">
                        <div
                            className="stress-bar-fill"
                            style={{
                                width: `${stressLevel}%`,
                                backgroundColor: getStressColor()
                            }}
                        />
                    </div>
                    <span className="stress-value">{stressLevel}%</span>
                </div>
            </div>

            {/* Messages */}
            <div className="dialogue-messages">
                {messages.map((msg, i) => (
                    <DialogueMessage
                        key={i}
                        message={msg}
                        isLatest={i === messages.length - 1 && msg.role === 'npc'}
                    />
                ))}

                {isLoading && (
                    <div className="dialogue-message npc loading">
                        <span className="loading-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="dialogue-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="dialogue-input"
                    placeholder="Ask your question..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="send-btn"
                    disabled={isLoading || !inputValue.trim()}
                >
                    <PaperPlaneTilt size={20} weight="fill" />
                </button>
            </form>
        </div>
    );
}

// Character selection panel
export function CharacterSelectPanel({ npcs, onSelect, onAccuse }) {
    return (
        <div className="character-select-panel">
            <h2 className="select-title">Select a Suspect</h2>
            <p className="select-subtitle">Click on a character to begin interrogation</p>

            <div className="character-list">
                {npcs.map(npc => (
                    <button
                        key={npc.id}
                        className="character-btn"
                        onClick={() => onSelect(npc)}
                    >
                        <span className="char-portrait">{npc.portrait}</span>
                        <span className="char-name">{npc.name}</span>
                        <span className="char-role">{npc.role}</span>
                    </button>
                ))}
            </div>

            <button className="accuse-btn" onClick={onAccuse}>
                <Target size={20} weight="fill" />
                Make Accusation
            </button>
        </div>
    );
}
