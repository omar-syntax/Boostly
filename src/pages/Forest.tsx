import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/UserContext"
import { supabase } from "@/lib/supabase"
import { TreeIcon } from "@/components/Forest/TreeIcon"
import {
    Trees,
    Timer,
    Calendar,
    Wind
} from "lucide-react"

interface FocusSession {
    id: string
    duration: number
    completed_at: string
    tree_type: string
    points_earned: number
}

export default function Forest() {
    const { user } = useUser()
    const [sessions, setSessions] = useState<FocusSession[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchSessions() {
            if (!user) return

            const { data, error } = await supabase
                .from('focus_sessions')
                .select('*')
                .eq('user_id', user.id)
                .eq('completed', true)
                .order('completed_at', { ascending: false })

            if (error) {
                console.error('Error fetching forest:', error)
            } else {
                setSessions(data || [])
            }
            setLoading(false)
        }

        fetchSessions()
    }, [user])

    const totalTrees = sessions.length
    const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0)
    const totalHours = Math.floor(totalMinutes / 60)

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading your forest...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Your Forest</h1>
                    <p className="text-muted-foreground">Every focus session plants a tree in your garden.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 glass-card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-success/10">
                            <Trees className="h-6 w-6 text-success" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{totalTrees}</div>
                            <div className="text-sm text-muted-foreground">Trees Planted</div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 glass-card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                            <Timer className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{totalHours}h {totalMinutes % 60}m</div>
                            <div className="text-sm text-muted-foreground">Total Focus Time</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Forest Grid */}
            <Card className="p-8 min-h-[400px] relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-green-50/50 dark:from-slate-900/50 dark:to-emerald-900/20">

                {sessions.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                        <Wind className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-semibold text-muted-foreground">Your forest is empty</h3>
                        <p className="text-muted-foreground mb-6">Complete a focus session to plant your first tree!</p>
                        <Button asChild className="gradient-primary">
                            <a href="/focus">Start Focusing</a>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 md:gap-8">
                        {sessions.map((session) => (
                            <div key={session.id} className="group relative flex flex-col items-center">
                                <div className="relative transition-transform duration-300 transform group-hover:-translate-y-2">
                                    <TreeIcon
                                        type={session.tree_type || 'tree'}
                                        className={`w-12 h-12 md:w-16 md:h-16 drop-shadow-md`}
                                    />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 absolute -bottom-8 bg-popover/90 backdrop-blur text-popover-foreground text-xs p-2 rounded shadow-lg transition-opacity z-10 whitespace-nowrap">
                                    <p className="font-semibold">{session.duration} min</p>
                                    <p className="text-[10px] opacity-75">{new Date(session.completed_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}
