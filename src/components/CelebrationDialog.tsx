import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Sparkles, 
  Star, 
  Crown,
  Zap,
  Target,
  Heart,
  Gift
} from "lucide-react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  color: string
  points: number
  rarity: "Common" | "Rare" | "Epic" | "Legendary"
}

const achievements: Achievement[] = [
  {
    id: "1",
    title: "Project Pioneer",
    description: "Created your first long-term project",
    icon: Target,
    color: "text-primary",
    points: 100,
    rarity: "Common"
  },
  {
    id: "2", 
    title: "Milestone Master",
    description: "Reached 80% progress on a project",
    icon: Crown,
    color: "text-warning",
    points: 250,
    rarity: "Rare"
  },
  {
    id: "3",
    title: "Consistency King",
    description: "Worked on projects for 30 consecutive days",
    icon: Zap,
    color: "text-success",
    points: 500,
    rarity: "Epic"
  }
]

const rewards = [
  "Exclusive Project Templates",
  "Priority Support Access",
  "Custom Badge Collection",
  "Advanced Analytics Dashboard",
  "VIP Community Access"
]

interface CelebrationDialogProps {
  children: React.ReactNode
}

export function CelebrationDialog({ children }: CelebrationDialogProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleCelebrate = () => {
    setIsAnimating(true)
    setShowConfetti(true)
    
    // Reset animation after 3 seconds
    setTimeout(() => {
      setIsAnimating(false)
      setShowConfetti(false)
    }, 3000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Trophy className="h-8 w-8 text-warning animate-pulse" />
            🎉 Celebration Central
            <Sparkles className="h-6 w-6 text-motivation" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Celebration Banner */}
          <Card className={`p-8 gradient-motivation text-white text-center relative overflow-hidden ${
            isAnimating ? "animate-pulse" : ""
          }`}>
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="animate-bounce text-4xl absolute top-4 left-8">🎉</div>
                <div className="animate-bounce text-4xl absolute top-8 right-12 animation-delay-200">🎊</div>
                <div className="animate-bounce text-4xl absolute bottom-8 left-16 animation-delay-400">✨</div>
                <div className="animate-bounce text-4xl absolute bottom-4 right-8 animation-delay-600">🎈</div>
              </div>
            )}
            
            <div className="relative z-10">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold mb-2">Amazing Progress!</h2>
              <p className="text-white/90 text-lg mb-6">
                You've made incredible strides on your long-term projects. 
                Your dedication and consistency are truly paying off!
              </p>
              
              <Button 
                variant="glass" 
                size="lg" 
                onClick={handleCelebrate}
                className="animate-bounce"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Celebrate! 🎉
              </Button>
            </div>
          </Card>

          {/* Recent Achievements */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-warning" />
              Recent Achievements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {achievements.map((achievement) => {
                const IconComponent = achievement.icon
                return (
                  <Card key={achievement.id} className="p-4 border-2 border-success/50 bg-success/5">
                    <div className="text-center space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                        <IconComponent className={`h-6 w-6 ${achievement.color}`} />
                      </div>
                      
                      <div>
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {achievement.rarity}
                        </Badge>
                        <Badge className="bg-success text-white">
                          +{achievement.points} pts
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Milestone Progress */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Project Milestones Reached
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="font-medium">Personal Fitness Journey</span>
                  <Badge className="gradient-primary text-white">65% Complete</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                  <span className="font-medium">Launch Side Business</span>
                  <Badge className="gradient-primary text-white">80% Complete</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                  <span className="font-medium">Mindfulness Practice</span>
                  <Badge className="gradient-primary text-white">55% Complete</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">2,890</div>
                  <p className="text-muted-foreground">Total Points from Projects</p>
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <Heart className="h-4 w-4 text-motivation" />
                    <span>You're inspiring others!</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Unlocked Rewards */}
          <Card className="p-6 gradient-success text-white">
            <div className="flex items-center gap-4 mb-4">
              <Gift className="h-8 w-8" />
              <div>
                <h3 className="text-xl font-bold">Rewards Unlocked!</h3>
                <p className="text-white/90">Your progress has unlocked these amazing benefits</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rewards.map((reward, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">{reward}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Call to Action */}
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Keep the Momentum Going! 🚀</h3>
            <p className="text-muted-foreground">
              You're on fire! Share your progress with the community or continue working on your projects.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline">
                Share Progress
              </Button>
              <Button className="gradient-primary">
                Continue Working
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}