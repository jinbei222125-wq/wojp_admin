import { useState } from "react";
import { useLocation } from "wouter";
import { adminTrpc } from "@/lib/adminTrpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Shield } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = adminTrpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("ログインしました");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "ログインに失敗しました");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-black/50" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-sidebar-foreground">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">W</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">W.O.JP</span>
            </div>
            <p className="text-sidebar-foreground/60 text-sm">Management System</p>
          </div>
          
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold leading-tight mb-4">
                コンテンツ管理を
                <br />
                <span className="text-primary">シンプルに。</span>
              </h1>
              <p className="text-sidebar-foreground/70 text-lg leading-relaxed max-w-md">
                NEWS記事と求人情報を一元管理。
                直感的なインターフェースで、効率的なコンテンツ運用を実現します。
              </p>
            </div>
            
            <div className="flex gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">セキュア</p>
                  <p className="text-xs text-sidebar-foreground/60">安全な認証</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">監査ログ</p>
                  <p className="text-xs text-sidebar-foreground/60">操作履歴を記録</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-sidebar-foreground/40 text-sm">
            © 2024 W.O.JP. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">W</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">W.O.JP</span>
          </div>
          
          <Card className="border-0 shadow-xl bg-card">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight">
                管理画面にログイン
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                メールアドレスとパスワードを入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    メールアドレス
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="pl-10 h-11 bg-background border-input focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    パスワード
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pl-10 h-11 bg-background border-input focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ログイン中...
                    </>
                  ) : (
                    "ログイン"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            ログインに問題がある場合は管理者にお問い合わせください
          </p>
        </div>
      </div>
    </div>
  );
}
