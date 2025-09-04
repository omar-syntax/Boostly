import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Gift, 
  Crown, 
  Star, 
  Trophy,
  Gem,
  Sparkles,
  ShoppingBag,
  Zap,
  Heart,
  Coffee,
  BookOpen,
  Headphones,
  Gamepad2,
  Timer
} from "lucide-react"

interface Reward {
  id: string
  name: string
  description: string
  cost: number
  icon: any
  color: string
  category: "premium" | "digital" | "physical" | "experience"
  available: boolean
  claimed?: boolean
  rarity?: "Common" | "Rare" | "Epic" | "Legendary"
}

const rewards: Reward[] = [
  {
    id: "1",
    name: "Premium Theme Pack",
    description: "Unlock exclusive dark & light themes for your dashboard",
    cost: 500,
    icon: Sparkles,
    color: "text-primary",
    category: "premium",
    available: true,
    rarity: "Common"
  },
  {
    id: "2",
    name: "Focus Sounds Collection", 
    description: "High-quality ambient sounds for better concentration",
    cost: 750,
    icon: Headphones,
    color: "text-warning",
    category: "digital",
    available: true,
    rarity: "Rare"
  },
  {
    id: "3",
    name: "Productivity Masterclass",
    description: "Exclusive video course on advanced productivity techniques",
    cost: 1000,
    icon: BookOpen,
    color: "text-success",
    category: "digital",
    available: true,
    claimed: true,
    rarity: "Epic"
  },
  {
    id: "4", 
    name: "Golden Crown Badge",
    description: "Show off your achievements with this exclusive badge",
    cost: 1500,
    icon: Crown,
    color: "text-warning",
    category: "premium",
    available: true,
    rarity: "Legendary"
  },
  {
    id: "5",
    name: "Coffee Shop Voucher",
    description: "$25 voucher for your favorite coffee shop",
    cost: 2000,
    icon: Coffee,
    color: "text-amber-600",
    category: "physical",
    available: false,
    rarity: "Epic"
  },
  {
    id: "6",
    name: "Gaming Session Reward",
    description: "2 hours of guilt-free gaming time reward",
    cost: 300,
    icon: Gamepad2,
    color: "text-purple-500",
    category: "experience",
    available: true,
    rarity: "Common"
  },
  {
    id: "7",
    name: "1-on-1 Coaching Call",
    description: "Personal productivity coaching session with an expert",
    cost: 5000,
    icon: Timer,
    color: "text-motivation",
    category: "experience",
    available: false,
    rarity: "Legendary"
  }
]

const achievements = [
  { name: "Point Collector", progress: 100, total: 1000 },
  { name: "Streak Master", progress: 85, total: 100 },
  { name: "Task Crusher", progress: 67, total: 100 },
  { name: "Focus Champion", progress: 45, total: 100 }
]

const categoryIcons = {
  premium: Crown,
  digital: BookOpen,
  physical: Gift,
  experience: Heart
}

const rarityColors = {
  Common: "bg-muted text-muted-foreground",
  Rare: "bg-primary/10 text-primary",
  Epic: "bg-warning/10 text-warning",
  Legendary: "bg-motivation/10 text-motivation"
}

interface RewardsDialogProps {
  children: React.ReactNode
}

export function RewardsDialog({ children }: RewardsDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [userPoints] = useState(1240) // Current user points from context
  
  const filteredRewards = rewards.filter(reward => 
    selectedCategory === "all" || reward.category === selectedCategory
  )

  const claimedRewards = rewards.filter(r => r.claimed).length
  const availableRewards = rewards.filter(r => r.available && !r.claimed).length

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-warning" />
            Rewards Center
            <Badge variant="outline" className="gradient-primary text-white">
              <Star className="h-3 w-3 mr-1" />
              {userPoints} Points
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rewards">Available Rewards</TabsTrigger>
            <TabsTrigger value="progress">Progress Rewards</TabsTrigger>
            <TabsTrigger value="claimed">Claimed Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-6">
            {/* Points Overview */}
            <Card className="p-6 gradient-hero text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Your Points Balance</h3>
                  <p className="text-white/90">Earn points by completing tasks, habits, and focus sessions</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">{userPoints}</div>
                  <div className="text-sm opacity-90">Available Points</div>
                </div>
              </div>
            </Card>

            {/* Category Filters */}
            <div className="flex gap-2 flex-wrap">
              {["all", "premium", "digital", "physical", "experience"].map(category => {
                const IconComponent = category === "all" ? Star : categoryIcons[category as keyof typeof categoryIcons]
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="flex items-center gap-2"
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                )
              })}
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRewards.map(reward => {
                const IconComponent = reward.icon
                const canAfford = userPoints >= reward.cost
                const isAvailable = reward.available && !reward.claimed

                return (
                  <Card 
                    key={reward.id} 
                    className={`p-4 transition-smooth hover:shadow-medium ${
                      !isAvailable ? "opacity-60" : ""
                    } ${canAfford && isAvailable ? "border-success/50" : ""}`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-full ${
                          isAvailable ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <IconComponent className={`h-6 w-6 ${
                            isAvailable ? reward.color : "text-muted-foreground"
                          }`} />
                        </div>
                        {reward.rarity && (
                          <Badge className={rarityColors[reward.rarity]}>
                            {reward.rarity}
                          </Badge>
                        )}
                      </div>
                      
                      <div>
                        <h4 className={`font-semibold mb-2 ${
                          !isAvailable ? "text-muted-foreground" : ""
                        }`}>
                          {reward.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {reward.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-warning" />
                          <span className="font-bold">{reward.cost}</span>
                        </div>
                        
                        <Button
                          size="sm"
                          disabled={!canAfford || !isAvailable}
                          className={canAfford && isAvailable ? "gradient-primary" : ""}
                        >
                          {reward.claimed ? "Claimed" : 
                           !reward.available ? "Locked" :
                           !canAfford ? "Need More Points" : "Claim"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Achievement Progress</h3>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{achievement.name}</span>
                      <span>{achievement.progress}%</span>
                    </div>
                    <Progress value={achievement.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      Reward: +{250 + index * 100} points when completed
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="claimed" className="space-y-6">
            <div className="text-center py-8">
              <Gift className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Claimed Rewards</h3>
              <p className="text-muted-foreground mb-4">
                {claimedRewards > 0 
                  ? `You've claimed ${claimedRewards} reward${claimedRewards > 1 ? 's' : ''}!`
                  : "Start earning points to claim your first reward!"
                }
              </p>
              
              {claimedRewards > 0 && (
                <div className="mt-6">
                  {rewards.filter(r => r.claimed).map(reward => {
                    const IconComponent = reward.icon
                    return (
                      <Card key={reward.id} className="p-4 border-success/50 bg-success/5">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-success/10">
                            <IconComponent className={`h-5 w-5 ${reward.color}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <h4 className="font-semibold">{reward.name}</h4>
                            <p className="text-sm text-muted-foreground">{reward.description}</p>
                          </div>
                          <Badge className="bg-success text-white">Claimed</Badge>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}