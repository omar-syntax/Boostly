import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, 
  Medal, 
  Star, 
  Target, 
  Timer, 
  CheckSquare,
  Zap,
  Crown,
  Award,
  Flame
} from "lucide-react"

interface BadgeItem {
  id: string
  name: string
  description: string
  icon: any
  color: string
  earned: boolean
  progress?: number
  requirement: string
  rarity: "Common" | "Rare" | "Epic" | "Legendary"
}

const badges: BadgeItem[] = [
  {
    id: "1",
    name: "First Steps",
    description: "Complete your first task",
    icon: CheckSquare,
    color: "text-success",
    earned: true,
    requirement: "Complete 1 task",
    rarity: "Common"
  },
  {
    id: "2", 
    name: "Task Master",
    description: "Complete 50 tasks",
    icon: Target,
    color: "text-primary",
    earned: true,
    requirement: "Complete 50 tasks", 
    rarity: "Rare"
  },
  {
    id: "3",
    name: "Focus Champion",
    description: "Complete 25 focus sessions",
    icon: Timer,
    color: "text-warning",
    earned: true,
    requirement: "Complete 25 focus sessions",
    rarity: "Epic"
  },
  {
    id: "4",
    name: "Streak Master", 
    description: "Maintain a 7-day streak",
    icon: Flame,
    color: "text-motivation",
    earned: true,
    requirement: "7-day streak",
    rarity: "Rare"
  },
  {
    id: "5",
    name: "Point Collector",
    description: "Earn 1000 points",
    icon: Star,
    color: "text-warning",
    earned: true,
    requirement: "Earn 1000 points",
    rarity: "Common"
  },
  {
    id: "6",
    name: "Productivity King",
    description: "Complete 100 tasks",
    icon: Crown,
    color: "text-primary",
    earned: false,
    progress: 58,
    requirement: "Complete 100 tasks",
    rarity: "Legendary"
  },
  {
    id: "7",
    name: "Marathon Runner",
    description: "Complete 50 focus sessions",
    icon: Trophy,
    color: "text-success",
    earned: false,
    progress: 25,
    requirement: "Complete 50 focus sessions",
    rarity: "Epic"
  },
  {
    id: "8",
    name: "Perfectionist",
    description: "Complete all daily habits for 30 days",
    icon: Award,
    color: "text-secondary",
    earned: false,
    progress: 7,
    requirement: "30 perfect days",
    rarity: "Legendary"
  }
]

const rarityColors = {
  Common: "bg-muted text-muted-foreground",
  Rare: "bg-primary/10 text-primary",
  Epic: "bg-warning/10 text-warning", 
  Legendary: "bg-motivation/10 text-motivation"
}

interface BadgeDialogProps {
  children: React.ReactNode
}

export function BadgeDialog({ children }: BadgeDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState("All")
  
  const categories = ["All", "Earned", "In Progress"]
  const filteredBadges = badges.filter(badge => {
    if (selectedCategory === "Earned") return badge.earned
    if (selectedCategory === "In Progress") return !badge.earned
    return true
  })

  const earnedCount = badges.filter(b => b.earned).length
  const totalCount = badges.length

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-warning" />
            Badge Collection
            <Badge variant="outline">{earnedCount}/{totalCount}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card className="p-4 gradient-hero text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">Collection Progress</h3>
                <div className="text-2xl font-bold">{Math.round((earnedCount/totalCount) * 100)}%</div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">Badges Earned</div>
                <div className="text-xl font-bold">{earnedCount}/{totalCount}</div>
              </div>
            </div>
            <Progress value={(earnedCount/totalCount) * 100} className="mt-3 bg-white/20" />
          </Card>

          {/* Category Filter */}
          <div className="flex gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBadges.map(badge => {
              const IconComponent = badge.icon
              return (
                <Card 
                  key={badge.id} 
                  className={`p-4 transition-smooth hover:shadow-medium ${
                    badge.earned ? "border-success/50" : "border-muted opacity-75"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${
                      badge.earned ? "bg-success/10" : "bg-muted"
                    }`}>
                      <IconComponent className={`h-6 w-6 ${
                        badge.earned ? badge.color : "text-muted-foreground"
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-semibold ${
                          badge.earned ? "" : "text-muted-foreground"
                        }`}>
                          {badge.name}
                        </h4>
                        <Badge className={rarityColors[badge.rarity]}>
                          {badge.rarity}
                        </Badge>
                      </div>
                      
                      <p className={`text-sm mb-3 ${
                        badge.earned ? "text-muted-foreground" : "text-muted-foreground/75"
                      }`}>
                        {badge.description}
                      </p>
                      
                      <div className="text-xs text-muted-foreground mb-2">
                        {badge.requirement}
                      </div>

                      {!badge.earned && badge.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{badge.progress}%</span>
                          </div>
                          <Progress value={badge.progress} className="h-1" />
                        </div>
                      )}

                      {badge.earned && (
                        <Badge variant="outline" className="text-xs">
                          <Medal className="h-3 w-3 mr-1" />
                          Earned
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}