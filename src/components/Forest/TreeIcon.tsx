import { TreeDeciduous, TreePine, Sprout, Leaf } from "lucide-react"

interface TreeIconProps {
    type: string
    stage?: "seed" | "sapling" | "growing" | "grown"
    className?: string
}

export function TreeIcon({ type, stage = "grown", className = "" }: TreeIconProps) {
    // Logic for growing animation/stages could go here
    // For now, mapping types to icons

    if (stage === "seed" || stage === "sapling") {
        return <Sprout className={`text-success ${className}`} />
    }

    switch (type) {
        case 'sapling':
            return <Leaf className={`text-success ${className}`} />
        case 'tree':
            return <TreeDeciduous className={`text-success ${className}`} />
        case 'large_tree':
            return <TreePine className={`text-emerald-700 ${className}`} />
        default:
            return <TreeDeciduous className={`text-success ${className}`} />
    }
}
