import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, OrbitControls, Environment, PresentationControls } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import {
  MagnifyingGlass,
  Target,
  Skull,
  Trophy,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Warning
} from '@phosphor-icons/react';
import { api } from './services/api';
import CharacterAvatar from './components/CharacterAvatar';
import DialogueOverlay, { CharacterSelectPanel } from './components/DialogueOverlay';
import './index.css';
import * as THREE from 'three';

// Rain particles
function Rain({ count = 800 }) {
  const mesh = useRef();

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = Math.random() * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }

  useFrame(() => {
    if (!mesh.current) return;
    const posArray = mesh.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] -= 0.15;
      if (posArray[i * 3 + 1] < -2) {
        posArray[i * 3 + 1] = 20;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#00f5ff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Neon building
function NeonBuilding({ position, height, width, color }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, width * 0.8]} />
        <meshStandardMaterial color="#0a0a15" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]}>
        <boxGeometry args={[0.05, height, 0.05]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]}>
        <boxGeometry args={[0.05, height, 0.05]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// City skyline
function CitySkyline() {
  const buildings = [
    { position: [-8, 0, -15], height: 8, width: 2, color: '#00f5ff' },
    { position: [-5, 0, -12], height: 12, width: 2.5, color: '#ff00ff' },
    { position: [-2, 0, -18], height: 6, width: 1.8, color: '#b347ff' },
    { position: [1, 0, -14], height: 10, width: 2.2, color: '#00f5ff' },
    { position: [4, 0, -16], height: 14, width: 3, color: '#ff00ff' },
    { position: [7, 0, -13], height: 7, width: 2, color: '#ffaa00' },
    { position: [10, 0, -17], height: 9, width: 2.5, color: '#00f5ff' },
  ];

  return (
    <group>
      {buildings.map((b, i) => (
        <NeonBuilding key={i} {...b} />
      ))}
    </group>
  );
}

// Floating hologram
function Hologram({ position }) {
  const mesh = useRef();

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh} position={position}>
        <octahedronGeometry args={[0.3]} />
        <meshBasicMaterial color="#00f5ff" wireframe opacity={0.8} transparent />
      </mesh>
    </Float>
  );
}

// Ground with grid
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[100, 100, 50, 50]} />
      <meshBasicMaterial color="#0a0a15" wireframe opacity={0.3} transparent />
    </mesh>
  );
}

// 3D Scene
function Scene3D({ npcs, selectedNPC, isSpeaking, onSelectNPC }) {
  const CHARACTER_POSITIONS = {
    librarian: [-4, 0, 0],
    security: [-2, 0, 0],
    scientist: [0, 0, 0],
    mayor: [2, 0, 0],
    janitor: [4, 0, 0]
  };

  return (
    <>
      <fog attach="fog" args={['#0a0a15', 5, 30]} />
      <color attach="background" args={['#050510']} />

      <ambientLight intensity={0.2} />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#ff00ff" />
      <pointLight position={[-5, 5, -10]} intensity={0.8} color="#00f5ff" />
      <pointLight position={[5, 5, -10]} intensity={0.8} color="#ff00ff" />

      <CitySkyline />
      <Rain count={600} />
      <Ground />

      <Hologram position={[-3, 3, -5]} />
      <Hologram position={[3, 4, -6]} />

      <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

      {/* Characters */}
      {selectedNPC ? (
        <CharacterAvatar
          characterId={selectedNPC.id}
          position={[0, 0.5, 2]}
          isSpeaking={isSpeaking}
          isSelected={true}
        />
      ) : (
        npcs.map(npc => (
          <CharacterAvatar
            key={npc.id}
            characterId={npc.id}
            position={CHARACTER_POSITIONS[npc.id] || [0, 0, 0]}
            isSpeaking={false}
            isSelected={false}
            onClick={() => onSelectNPC(npc)}
          />
        ))
      )}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.6} />
        <ChromaticAberration offset={[0.0005, 0.0005]} />
      </EffectComposer>
    </>
  );
}

// How to Play Modal
function HowToPlayModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <h2 className="modal-title">
          <MagnifyingGlass size={24} weight="fill" style={{ marginRight: '10px' }} />
          Mission Briefing
        </h2>

        <div className="how-to-play-content" style={{ textAlign: 'left', margin: '20px 0', lineHeight: '1.6', color: '#8899ac' }}>
          <p style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#00f5ff' }}>OBJECTIVE:</strong><br />
            Identify the rogue AI hiding among 5 human suspects. The AI has perfectly copied a human identity, but it has flaws.
          </p>

          <p style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#ff00ff' }}>MECHANICS:</strong><br />
            • <strong>Interrogate:</strong> Chat with suspects to find inconsistencies in their stories.<br />
            • <strong>Stress Levels:</strong> Pressuring suspects raises their stress. The AI becomes "glitchy" and defensive at high stress.<br />
            • <strong>Hidden Clues:</strong> Each character has secrets. Use the right keywords to unlock them.
          </p>

          <p>
            <strong style={{ color: '#ffaa00' }}>WINNING:</strong><br />
            Once you are confident, click the <strong>Target Icon</strong> to make an accusation. Be careful—you only get one shot!
          </p>
        </div>

        <button className="modal-button confirm" onClick={onClose}>
          Understood
        </button>
      </div>
    </div>
  );
}

// Welcome Screen
function WelcomeScreen({ onStart }) {
  const [name, setName] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="welcome-screen">
      <h1 className="welcome-title">The Turing Mystery</h1>
      <p className="welcome-text">
        Something is wrong in Digital City. One of its citizens is not who they claim to be.
        An advanced AI has gone rogue, perfectly mimicking a human identity.
        Your mission: interrogate the suspects and uncover the imposter.
      </p>

      <div className="welcome-actions">
        <input
          type="text"
          className="welcome-input"
          placeholder="Enter your codename..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onStart(name || 'Detective')}
        />

        <button className="start-button" onClick={() => onStart(name || 'Detective')}>
          <MagnifyingGlass size={20} weight="bold" />
          Begin Investigation
        </button>

        <button
          className="secondary-button"
          onClick={() => setShowGuide(true)}
        >
          How to Play
        </button>
      </div>

      {showGuide && <HowToPlayModal onClose={() => setShowGuide(false)} />}

      <div className="welcome-footer">
        <p>&copy; {new Date().getFullYear()} All rights reserved</p>
        <p>
          Made with ❤️ by <a href="https://x.com/shivangitwt" target="_blank" rel="noopener noreferrer" className="creator-link">Shivangi</a>
        </p>
      </div>
    </div>
  );
}

// Accusation Modal
function AccusationModal({ npcs, onConfirm, onCancel, isLoading }) {
  const [selectedNPC, setSelectedNPC] = useState(null);

  return (
    <div className="modal-overlay" onClick={!isLoading ? onCancel : undefined}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">
          <Target size={24} weight="fill" style={{ marginRight: '10px' }} />
          Make Your Accusation
        </h2>
        <p className="modal-text">
          Who do you believe is the malfunctioning AI?
        </p>

        <div className="npc-grid" style={{ marginBottom: '20px' }}>
          {npcs.map(npc => (
            <div
              key={npc.id}
              className={`npc-card ${selectedNPC === npc.id ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
              onClick={() => !isLoading && setSelectedNPC(npc.id)}
              style={{ opacity: isLoading ? 0.7 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}
            >
              <div className="npc-portrait">{npc.portrait}</div>
              <div className="npc-name">{npc.name}</div>
            </div>
          ))}
        </div>

        <div className="modal-buttons">
          <button
            className="modal-button cancel"
            onClick={onCancel}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} weight="bold" />
            Back to Suspects
          </button>
          <button
            className="modal-button confirm"
            onClick={() => selectedNPC && onConfirm(selectedNPC)}
            disabled={!selectedNPC || isLoading}
            style={{
              opacity: (!selectedNPC || isLoading) ? 0.5 : 1,
              cursor: (!selectedNPC || isLoading) ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <>
                <span className="loading-dots">Processing</span>
              </>
            ) : (
              <>
                <Skull size={16} weight="fill" />
                Confirm
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Game Over Screen
function GameOverScreen({ result, onRestart }) {
  return (
    <div className="game-over">
      <h1 className={`game-over-title ${result.correct ? 'won' : 'lost'}`}>
        {result.correct ? (
          <><Trophy size={48} weight="fill" /> Case Solved</>
        ) : (
          <><XCircle size={48} weight="fill" /> Case Closed</>
        )}
      </h1>
      <p className="game-over-message">{result.message}</p>

      {result.revelation && (
        <div className="revelation">
          <strong>// THE TRUTH:</strong><br /><br />
          {result.revelation}
        </div>
      )}

      <button className="start-button" onClick={onRestart} style={{ marginTop: '30px' }}>
        <ArrowRight size={20} weight="bold" />
        New Investigation
      </button>
    </div>
  );
}

// Main App
function App() {
  const [gameState, setGameState] = useState('welcome');
  const [sessionId, setSessionId] = useState(null);
  const [npcs, setNPCs] = useState([]);
  const [selectedNPC, setSelectedNPC] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [npcStress, setNpcStress] = useState({});
  const [showAccusation, setShowAccusation] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  const startGame = async (playerName) => {
    setShowAccusation(false); // Reset accusation state
    try {
      const result = await api.startGame(playerName);
      if (result.success) {
        setSessionId(result.sessionId);
        setNPCs(result.npcs);
        setGameState('playing');
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      alert(`Connection Error: ${error.message}. Please refresh and try again. If this persists, the server might be restarting.`);
    }
  };

  const selectNPC = async (npc) => {
    setSelectedNPC(npc);
    const history = await api.getHistory(sessionId, npc.id);
    if (history.success) {
      setMessages(history.history.map(msg => ({
        role: msg.role === 'player' ? 'player' : 'npc',
        content: msg.content,
        speaker: npc.name
      })));
      setNpcStress(prev => ({ ...prev, [npc.id]: history.stressLevel }));
    }
  };

  const sendMessage = async (message) => {
    if (!message.trim() || !selectedNPC || isLoading) return;

    setMessages(prev => [...prev, { role: 'player', content: message }]);
    setIsLoading(true);

    try {
      const result = await api.chat(sessionId, selectedNPC.id, message);
      if (result.success) {
        setMessages(prev => [...prev, {
          role: 'npc',
          content: result.response,
          speaker: selectedNPC.name
        }]);
        setNpcStress(prev => ({ ...prev, [selectedNPC.id]: result.stressLevel }));
      }
    } catch (error) {
      console.error('Chat error:', error);
    }

    setIsLoading(false);
  };

  const makeAccusation = async (npcId) => {
    // Don't close the modal yet! Show loading state instead.
    setIsLoading(true);
    try {
      console.log('Making accusation against:', npcId);
      const result = await api.makeGuess(sessionId, npcId);
      console.log('Accusation result:', result);

      if (result && result.success) {
        setGameResult(result);
        setGameState('gameOver');
        // No need to setShowAccusation(false) because the entire view changes to GameOverScreen
      } else {
        console.error('Accusation failed:', result);
        alert('Failed to process accusation. Please try again.');
        setShowAccusation(false); // Only close on error/failure if we want to reset
      }
    } catch (error) {
      console.error('Error making accusation:', error);
      alert('An error occurred. Please check console.');
      setShowAccusation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const restartGame = () => {
    setGameState('welcome');
    setSessionId(null);
    setNPCs([]);
    setSelectedNPC(null);
    setMessages([]);
    setNpcStress({});
    setGameResult(null);
    setShowAccusation(false);
  };

  // Welcome
  if (gameState === 'welcome') {
    return (
      <div className="app-container">
        <WelcomeScreen onStart={startGame} />
      </div>
    );
  }

  // Game Over
  if (gameState === 'gameOver') {
    return (
      <div className="app-container">
        <GameOverScreen result={gameResult} onRestart={restartGame} />
      </div>
    );
  }

  // Main Game with 3D
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 2, 8], fov: 60 }}
        style={{ position: 'fixed', top: 0, left: 0 }}
      >
        <Suspense fallback={null}>
          <Scene3D
            npcs={npcs}
            selectedNPC={selectedNPC}
            isSpeaking={isLoading}
            onSelectNPC={selectNPC}
          />
        </Suspense>
      </Canvas>

      {/* Title overlay */}
      <div style={{
        position: 'fixed',
        top: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 50,
        pointerEvents: 'none'
      }}>
        <h1 style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '1.8rem',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '8px',
          textTransform: 'uppercase',
          textShadow: '0 0 30px rgba(0, 245, 255, 0.6)',
          mixBlendMode: 'overlay'
        }}>
          The Turing Mystery
        </h1>
      </div>

      {/* Character select or dialogue */}
      {selectedNPC ? (
        <DialogueOverlay
          npc={selectedNPC}
          messages={messages}
          onSendMessage={sendMessage}
          onBack={() => setSelectedNPC(null)}
          isLoading={isLoading}
          stressLevel={npcStress[selectedNPC.id] || 0}
        />
      ) : (
        <CharacterSelectPanel
          npcs={npcs}
          onSelect={selectNPC}
          onAccuse={() => setShowAccusation(true)}
        />
      )}

      {showAccusation && (
        <AccusationModal
          npcs={npcs}
          onConfirm={makeAccusation}
          onCancel={() => setShowAccusation(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default App;
