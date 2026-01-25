import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';

// Character color schemes
const CHARACTER_STYLES = {
    librarian: {
        primary: '#00f5ff',
        secondary: '#0088aa',
        emissive: '#00f5ff',
        shape: 'scholarly'
    },
    security: {
        primary: '#ff3366',
        secondary: '#aa2244',
        emissive: '#ff3366',
        shape: 'angular'
    },
    scientist: {
        primary: '#ff00ff',
        secondary: '#aa00aa',
        emissive: '#ff00ff',
        shape: 'glitchy'
    },
    mayor: {
        primary: '#ffaa00',
        secondary: '#aa7700',
        emissive: '#ffaa00',
        shape: 'formal'
    },
    janitor: {
        primary: '#00ff88',
        secondary: '#00aa55',
        emissive: '#00ff88',
        shape: 'compact'
    }
};

// Glitch effect for Dr. Chen
// Glitch effect for Dr. Chen
function GlitchEffect({ children, intensity = 0.02 }) {
    const mesh = useRef();

    useFrame((state) => {
        if (mesh.current && Math.random() > 0.95) {
            mesh.current.position.x = (Math.random() - 0.5) * intensity;
            mesh.current.position.y = (Math.random() - 0.5) * intensity;
            setTimeout(() => {
                if (mesh.current) {
                    mesh.current.position.x = 0;
                    mesh.current.position.y = 0;
                }
            }, 50);
        }
    });

    return <group ref={mesh}>{children}</group>;
}

// Floating particles around character
function CharacterParticles({ color, count = 20, radius = 0.8 }) {
    const points = useRef();

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            pos[i * 3] = Math.cos(angle) * radius * (0.8 + Math.random() * 0.4);
            pos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
            pos[i * 3 + 2] = Math.sin(angle) * radius * (0.8 + Math.random() * 0.4);
        }
        return pos;
    }, [count, radius]);

    useFrame((state) => {
        points.current.rotation.y += 0.005;
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.05} color={color} transparent opacity={0.8} />
        </points>
    );
}

// Base humanoid avatar
function HumanoidAvatar({ style, isSpeaking }) {
    const group = useRef();
    const headRef = useRef();

    useFrame((state) => {
        // Idle breathing animation
        if (group.current) {
            group.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
        // Head slight movement when speaking
        if (headRef.current && isSpeaking) {
            headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 5) * 0.1;
        }
    });

    const material = useMemo(() => (
        <meshStandardMaterial
            color={style.primary}
            emissive={style.emissive}
            emissiveIntensity={isSpeaking ? 0.5 : 0.2}
            metalness={0.8}
            roughness={0.2}
        />
    ), [style, isSpeaking]);

    return (
        <group ref={group}>
            {/* Body */}
            <mesh position={[0, -0.3, 0]}>
                <cylinderGeometry args={[0.25, 0.35, 0.8, 6]} />
                {material}
            </mesh>

            {/* Neck */}
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.1, 0.15, 0.2, 6]} />
                {material}
            </mesh>

            {/* Head */}
            <mesh ref={headRef} position={[0, 0.55, 0]}>
                <octahedronGeometry args={[0.3]} />
                {material}
            </mesh>

            {/* Eyes */}
            <mesh position={[-0.1, 0.55, 0.22]}>
                <sphereGeometry args={[0.05]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.1, 0.55, 0.22]}>
                <sphereGeometry args={[0.05]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Shoulders */}
            <mesh position={[-0.4, 0, 0]}>
                <sphereGeometry args={[0.12]} />
                {material}
            </mesh>
            <mesh position={[0.4, 0, 0]}>
                <sphereGeometry args={[0.12]} />
                {material}
            </mesh>
        </group>
    );
}

// Main character avatar component
export default function CharacterAvatar({
    characterId,
    position = [0, 0, 0],
    isSpeaking = false,
    isSelected = false,
    onClick
}) {
    const style = CHARACTER_STYLES[characterId] || CHARACTER_STYLES.librarian;
    const isGlitchy = characterId === 'scientist';

    return (
        <Float
            speed={2}
            rotationIntensity={0.2}
            floatIntensity={0.3}
        >
            <group position={position} onClick={onClick} style={{ cursor: 'pointer' }}>
                {/* Selection ring */}
                {isSelected && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
                        <ringGeometry args={[0.5, 0.6, 32]} />
                        <meshBasicMaterial color={style.primary} transparent opacity={0.8} />
                    </mesh>
                )}

                {/* Character particles */}
                <CharacterParticles color={style.primary} />

                {/* Glitch wrapper for Dr. Chen */}
                {isGlitchy ? (
                    <GlitchEffect intensity={isSpeaking ? 0.1 : 0.02}>
                        <HumanoidAvatar style={style} isSpeaking={isSpeaking} />
                    </GlitchEffect>
                ) : (
                    <HumanoidAvatar style={style} isSpeaking={isSpeaking} />
                )}

                {/* Speaking indicator */}
                {isSpeaking && (
                    <mesh position={[0, 1.2, 0]}>
                        <sphereGeometry args={[0.08]} />
                        <meshBasicMaterial color={style.emissive} />
                    </mesh>
                )}
            </group>
        </Float>
    );
}

// Character selection gallery
export function CharacterGallery({ characters, selectedId, onSelect }) {
    const spacing = 2;
    const startX = -((characters.length - 1) * spacing) / 2;

    return (
        <group position={[0, 0, 0]}>
            {characters.map((char, index) => (
                <CharacterAvatar
                    key={char.id}
                    characterId={char.id}
                    position={[startX + index * spacing, 0, 0]}
                    isSelected={selectedId === char.id}
                    onClick={() => onSelect(char)}
                />
            ))}
        </group>
    );
}
