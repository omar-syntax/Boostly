import { type FC, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, Environment } from '@react-three/drei';
import { GroundLayer } from './GroundLayer';
import { TreesLayer } from './TreesLayer';

interface ForestContainerProps {
    sessions: any[];
    currentSession?: any;
    className?: string;
}

export const ForestContainer: FC<ForestContainerProps> = ({ sessions, currentSession, className = '' }) => {
    return (
        <div className={`relative w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-sky-100/50 dark:bg-slate-900/50 ${className}`}>
            <Canvas shadows>
                {/* Isometric Camera Setup */}
                {/* 
                    Adjusted for smaller 12x12 ground.
                    Zoom=25 ensures it fits well within standard containers without clipping.
                 */}
                <OrthographicCamera
                    makeDefault
                    position={[20, 20, 20]}
                    zoom={25}
                    near={-50}
                    far={200}
                    onUpdate={c => c.lookAt(0, 0, 0)}
                />

                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <Environment preset="park" blur={0.5} />

                {/* Content */}
                <Suspense fallback={null}>
                    <GroundLayer />
                    <TreesLayer history={sessions} currentSession={currentSession} />
                </Suspense>
            </Canvas>

            {/* Overlay UI */}
            {sessions.length === 0 && !currentSession?.active && (
                <div className="absolute inset-x-0 bottom-10 text-center text-muted-foreground/50 z-20 pointer-events-none select-none">
                    Plant your first tree by focusing...
                </div>
            )}
        </div>
    );
};
