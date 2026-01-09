import { type FC, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Group } from 'three';

interface TreeProps {
    type: string;
    stage?: "seed" | "sapling" | "growing" | "grown";
    x: number;
    z: number;
    scale: number;
    progress?: number;
}

export const Tree: FC<TreeProps> = ({
    type,
    stage = "grown",
    x,
    z,
    scale,
    progress = 1
}) => {
    const groupRef = useRef<Group>(null);

    // Determine visual variant based on input type or random "hash" from coordinates to keep it stable but varied
    // The reference has: Pink Trees (Sakura), Round Green (Oak/Apple), Pines, Bushes.

    // Deterministic variant based on X/Z position
    const variant = useMemo(() => {
        const hash = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453);
        const rand = hash - Math.floor(hash);

        // Map specific logic types if they exist, otherwise randomize
        if (type === 'large_tree') return rand > 0.5 ? 'sakura' : 'pine';
        if (type === 'sapling') return 'shrub';

        // standard 'tree' mix
        if (rand > 0.7) return 'sakura';
        if (rand > 0.4) return 'pine';
        return 'oak';
    }, [type, x, z]);

    // Growth animation
    const growthFactor = stage === 'growing' ? progress : 1;
    const currentScale = Math.max(0.1, scale * growthFactor);

    useFrame((state) => {
        if (groupRef.current && stage === 'growing') {
            const time = state.clock.getElapsedTime();
            groupRef.current.rotation.y = Math.sin(time * 3) * 0.05;
            groupRef.current.scale.setScalar(currentScale + Math.sin(time * 10) * 0.02); // Pulse
        }
    });

    const renderFoliage = () => {
        switch (variant) {
            case 'sakura':
                return (
                    <group position={[0, 1.5, 0]}>
                        {/* Main foliage */}
                        <mesh castShadow receiveShadow position={[0, 0, 0]}>
                            <dodecahedronGeometry args={[0.9, 0]} />
                            <meshStandardMaterial color="#ffb7c5" roughness={0.8} />
                        </mesh>
                        {/* Details/Flowers (small particles) */}
                        <mesh position={[0.4, 0.4, 0.4]}>
                            <dodecahedronGeometry args={[0.3, 0]} />
                            <meshStandardMaterial color="#ffc0cb" />
                        </mesh>
                        <mesh position={[-0.3, 0.2, -0.4]}>
                            <dodecahedronGeometry args={[0.25, 0]} />
                            <meshStandardMaterial color="#ffffff" />
                        </mesh>
                    </group>
                );
            case 'pine':
                return (
                    <group position={[0, 1.5, 0]}>
                        <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
                            <coneGeometry args={[0.8, 1.5, 8]} />
                            <meshStandardMaterial color="#2d5a27" roughness={0.9} />
                        </mesh>
                        <mesh castShadow receiveShadow position={[0, -0.2, 0]}>
                            <coneGeometry args={[1, 1.5, 8]} />
                            <meshStandardMaterial color="#1e4d2b" roughness={0.9} />
                        </mesh>
                    </group>
                );
            case 'shrub':
                return (
                    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                        <dodecahedronGeometry args={[0.4, 1]} />
                        <meshStandardMaterial color="#7cb342" roughness={1} />
                    </mesh>
                );
            case 'oak':
            default:
                return (
                    <group position={[0, 1.6, 0]}>
                        <mesh castShadow receiveShadow>
                            <dodecahedronGeometry args={[0.9, 0]} />
                            <meshStandardMaterial color="#66bb6a" roughness={0.8} />
                        </mesh>
                        {/* Fruit? (Yellow/Red dots like image) */}
                        <mesh position={[0.5, 0.1, 0.2]}>
                            <sphereGeometry args={[0.15, 8, 8]} />
                            <meshStandardMaterial color="#ffd54f" />
                        </mesh>
                        <mesh position={[-0.3, 0.4, 0.4]}>
                            <sphereGeometry args={[0.12, 8, 8]} />
                            <meshStandardMaterial color="#ffd54f" />
                        </mesh>
                    </group>
                );
        }
    };

    const trunkColor = "#795548"; // Standard brown

    return (
        <group ref={groupRef} position={[x, 0, z]} scale={[currentScale, currentScale, currentScale]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <circleGeometry args={[0.6, 16]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.15} />
            </mesh>

            {/* Trunk - only for non-shrubs */}
            {variant !== 'shrub' && (
                <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.12, 0.18, 1.2, 6]} />
                    <meshStandardMaterial color={trunkColor} />
                </mesh>
            )}

            {renderFoliage()}
        </group>
    );
};
