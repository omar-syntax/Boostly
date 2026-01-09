import { type FC, useMemo } from 'react';
import { Tree } from './Tree';
import { generateTreeCoordinates } from '@/utils/forest-utils';

interface FocusSession {
    id: string;
    tree_type: string;
    duration: number;
    completed_at: string;
}

interface TreesLayerProps {
    history: FocusSession[];
    currentSession?: {
        active: boolean;
        type: string;
        progress: number;
    };
}

// Convert 0-100% 2D coords to 3D world coords
// Map size is now 12x12
// Range should be slightly smaller than 12 (e.g., 10) to avoid edge overhangs
const mapToWorld = (percent: number, range: number = 10) => {
    return ((percent / 100) * range) - (range / 2);
};

export const TreesLayer: FC<TreesLayerProps> = ({ history, currentSession }) => {

    const trees = useMemo(() => {
        return history.map((session, index) => {
            const coords = generateTreeCoordinates(index);
            return {
                id: session.id,
                x: mapToWorld(coords.x),
                z: mapToWorld(coords.y),
                scale: coords.scale,
                type: session.tree_type || 'tree',
                stage: 'grown' as const
            };
        });
    }, [history]);

    const nextIndex = history.length;
    const growingCoords = useMemo(() => {
        const c = generateTreeCoordinates(nextIndex);
        return {
            x: mapToWorld(c.x),
            z: mapToWorld(c.y),
            scale: c.scale
        };
    }, [nextIndex]);

    return (
        <group>
            {trees.map(tree => (
                <Tree
                    key={tree.id}
                    {...tree}
                />
            ))}

            {currentSession?.active && (
                <Tree
                    type="tree"
                    stage="growing"
                    x={growingCoords.x}
                    z={growingCoords.z}
                    scale={growingCoords.scale}
                    progress={currentSession.progress}
                />
            )}
        </group>
    );
};
