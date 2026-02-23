import { useState } from "react";
import { adminTrpc } from "@/lib/adminTrpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Lock, User, ShieldCheck } from "lucide-react";

export default function Settings() {
  const { admin } = useAdminAuth();

  // メールアドレス変更フォーム
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");

  // パスワード変更フォーム
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateEmailMutation = adminTrpc.auth.updateEmail.useMutation({
    onSuccess: () => {
      toast.success("メールアドレスを変更しました。次回ログインから新しいメールアドレスが有効になります。");
      setNewEmail("");
      setEmailCurrentPassword("");
    },
    onError: (error) => {
      toast.error(error.message || "メールアドレスの変更に失敗しました");
    },
  });

  const updatePasswordMutation = adminTrpc.auth.updatePassword.useMutation({
    onSuccess: () => {
      toast.success("パスワードを変更しました");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(error.message || "パスワードの変更に失敗しました");
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !emailCurrentPassword) {
      toast.error("すべての項目を入力してください");
      return;
    }
    updateEmailMutation.mutate({
      newEmail,
      currentPassword: emailCurrentPassword,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("すべての項目を入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("新しいパスワードが一致しません");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("新しいパスワードは8文字以上で入力してください");
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">アカウント設定</h1>
        <p className="text-muted-foreground mt-1">
          メールアドレスとパスワードを変更できます
        </p>
      </div>

      {/* 現在のアカウント情報 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">現在のアカウント情報</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">名前</p>
              <p className="font-medium mt-0.5">{admin?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">メールアドレス</p>
              <p className="font-medium mt-0.5">{admin?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ロール</p>
              <p className="font-medium mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  {admin?.role === "super_admin" ? "スーパー管理者" : "管理者"}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* メールアドレス変更 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">メールアドレスの変更</CardTitle>
              <CardDescription className="mt-0.5">
                変更には現在のパスワードの確認が必要です
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">新しいメールアドレス</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="new@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-current-password">現在のパスワード</Label>
              <Input
                id="email-current-password"
                type="password"
                placeholder="現在のパスワードを入力"
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              disabled={updateEmailMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateEmailMutation.isPending ? "変更中..." : "メールアドレスを変更"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* パスワード変更 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">パスワードの変更</CardTitle>
              <CardDescription className="mt-0.5">
                新しいパスワードは8文字以上で設定してください
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">現在のパスワード</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="現在のパスワードを入力"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="new-password">新しいパスワード</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="8文字以上で入力"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">新しいパスワード（確認）</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="もう一度入力"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">パスワードが一致しません</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={updatePasswordMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updatePasswordMutation.isPending ? "変更中..." : "パスワードを変更"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
