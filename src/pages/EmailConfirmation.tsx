import { Link } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, ArrowRight } from "lucide-react"

export default function EmailConfirmation() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
            <Card className="w-full max-w-md p-8 glass-card shadow-large text-center">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                        <Mail className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent mb-4">
                        Check Your Email
                    </h1>
                    <p className="text-muted-foreground text-lg mb-6">
                        We've sent a confirmation link to your email address. Please click the link to activate your account.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                        <p className="text-sm text-foreground/80">
                            Can't find the email? Check your spam folder or wait a few minutes.
                        </p>
                    </div>

                    <Link to="/login">
                        <Button className="w-full gradient-primary text-white mt-4">
                            Return to Login <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    )
}
