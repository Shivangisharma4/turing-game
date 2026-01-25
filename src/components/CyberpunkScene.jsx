import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Environment, Cloud } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

// Rain particles
function Rain({ count = 1000 }) {
    const mesh = useRef();

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 1] = Math.random() * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        return pos;
    }, [count]);

    useFrame(() => {
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
            {/* Main building */}
            <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, width * 0.8]} />
                <meshStandardMaterial color="#0a0a15" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Neon edge lights */}
            <mesh position={[width / 2, height / 2, 0]}>
                <boxGeometry args={[0.05, height, 0.05]} />
                <meshBasicMaterial color={color} />
            </mesh>
            <mesh position={[-width / 2, height / 2, 0]}>
                <boxGeometry args={[0.05, height, 0.05]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* Window strips */}
            {[...Array(Math.floor(height / 0.8))].map((_, i) => (
                <mesh key={i} position={[0, 0.5 + i * 0.8, width * 0.41]}>
                    <boxGeometry args={[width * 0.8, 0.1, 0.02]} />
                    <meshBasicMaterial color={color} opacity={0.5} transparent />
                </mesh>
            ))}
        </group>
    );
}

// City skyline
function CitySkyline() {
    const buildings = useMemo(() => [
        { position: [-8, 0, -15], height: 8, width: 2, color: '#00f5ff' },
        { position: [-5, 0, -12], height: 12, width: 2.5, color: '#ff00ff' },
        { position: [-2, 0, -18], height: 6, width: 1.8, color: '#b347ff' },
        { position: [1, 0, -14], height: 10, width: 2.2, color: '#00f5ff' },
        { position: [4, 0, -16], height: 14, width: 3, color: '#ff00ff' },
        { position: [7, 0, -13], height: 7, width: 2, color: '#ffaa00' },
        { position: [10, 0, -17], height: 9, width: 2.5, color: '#00f5ff' },
        { position: [-10, 0, -20], height: 5, width: 1.5, color: '#ff6ec7' },
        { position: [12, 0, -20], height: 11, width: 2, color: '#b347ff' },
    ], []);

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

    useFrame((state) => {
        mesh.current.rotation.y += 0.01;
        mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.2;
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

// Ground plane with grid
function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <planeGeometry args={[100, 100, 50, 50]} />
            <meshBasicMaterial color="#0a0a15" wireframe opacity={0.3} transparent />
        </mesh>
    );
}

// Main scene component
export default function CyberpunkScene({ children }) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas
                camera={{ position: [0, 2, 8], fov: 60 }}
                gl={{ antialias: true, alpha: true }}
            >
                {/* Atmosphere */}
                <fog attach="fog" args={['#0a0a15', 5, 30]} />
                <color attach="background" args={['#050510']} />

                {/* Lighting */}
                <ambientLight intensity={0.2} />
                <pointLight position={[0, 10, 0]} intensity={0.5} color="#ff00ff" />
                <pointLight position={[-5, 5, -10]} intensity={0.8} color="#00f5ff" />
                <pointLight position={[5, 5, -10]} intensity={0.8} color="#ff00ff" />

                {/* Environment */}
                <CitySkyline />
                <Rain count={800} />
                <Ground />

                {/* Floating elements */}
                <Hologram position={[-3, 3, -5]} />
                <Hologram position={[3, 4, -6]} />
                <Hologram position={[0, 2, -8]} />

                {/* Stars in background */}
                <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

                {/* Character placeholder */}
                {children}

                {/* Post-processing effects */}
                <EffectComposer>
                    <Bloom
                        luminanceThreshold={0.2}
                        luminanceSmoothing={0.9}
                        intensity={0.8}
                    />
                    <ChromaticAberration offset={[0.001, 0.001]} />
                </EffectComposer>
            </Canvas>
        </div>
    );
}
