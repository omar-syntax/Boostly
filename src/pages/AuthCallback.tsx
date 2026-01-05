import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function AuthCallback() {
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const navigate = useNavigate();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const { error } = await supabase.auth.getSession();

                if (error) {
                    setError(error.message);
                    setStatus("error");
                    return;
                }

                setStatus("success");
                // Redirect after a short delay to show success message
                setTimeout(() => {
                    navigate("/");
                }, 2000);
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred during verification.");
                setStatus("error");
            }
        };

        handleAuthCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
            <Card className="w-full max-w-md p-8 glass-card shadow-large text-center">
                {status === "loading" && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-12 w-12 text-primary animate-spin mb-6" />
                        <h1 className="text-2xl font-bold mb-2 text-foreground">Verifying your email</h1>
                        <p className="text-muted-foreground">Please wait while we confirm your account...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-6" />
                        <h1 className="text-2xl font-bold mb-2 text-foreground">Email Verified!</h1>
                        <p className="text-muted-foreground">Your account has been successfully confirmed. Redirecting you to the dashboard...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center">
                        <XCircle className="h-12 w-12 text-destructive mb-6" />
                        <h1 className="text-2xl font-bold mb-2 text-foreground">Verification Failed</h1>
                        <p className="text-destructive mb-6 font-medium">{error}</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="text-primary hover:underline font-medium"
                        >
                            Back to login
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
}
