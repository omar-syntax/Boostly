import { type FC } from 'react';
import * as THREE from 'three';

export const GroundLayer: FC = () => {
    const createGridTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#8bc34a';
            ctx.fillRect(0, 0, 512, 512);

            ctx.fillStyle = '#7cb342';
            const size = 128;
            for (let y = 0; y < 512; y += size) {
                for (let x = 0; x < 512; x += size) {
                    if ((x / size + y / size) % 2 === 0) {
                        ctx.fillRect(x, y, size, size);
                    }
                }
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        return tex;
    };

    const gridTexture = createGridTexture();

    // Adjusted dimensions to fit better (12x12 instead of 20x20)
    const width = 12;
    const depth = 12;
    const height = 2; // Proportionate soil thickness

    return (
        <group>
            {/* Grass Top */}
            <mesh position={[0, 0, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial map={gridTexture} roughness={1} />
            </mesh>

            {/* Soil Side Block */}
            <mesh position={[0, -height / 2 - 0.01, 0]} receiveShadow>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color="#5d4037" roughness={1} />
            </mesh>
        </group>
    );
};
