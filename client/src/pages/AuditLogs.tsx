import { adminTrpc } from "@/lib/adminTrpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Search, Filter, FileText, Loader2, Clock, User, Newspaper, Briefcase, LogIn, LogOut, Plus, Pencil, Trash2, Eye, EyeOff, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const actionConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  login: { label: "ログイン", icon: LogIn, color: "text-blue-600", bgColor: "bg-blue-500/10" },
  logout: { label: "ログアウト", icon: LogOut, color: "text-gray-600", bgColor: "bg-gray-500/10" },
  create_news: { label: "NEWS記事を作成", icon: Plus, color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  update_news: { label: "NEWS記事を更新", icon: Pencil, color: "text-amber-600", bgColor: "bg-amber-500/10" },
  delete_news: { label: "NEWS記事を削除", icon: Trash2, color: "text-red-600", bgColor: "bg-red-500/10" },
  publish_news: { label: "NEWS記事を公開", icon: Eye, color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  unpublish_news: { label: "NEWS記事を非公開", icon: EyeOff, color: "text-gray-600", bgColor: "bg-gray-500/10" },
  create_job: { label: "求人情報を作成", icon: Plus, color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  update_job: { label: "求人情報を更新", icon: Pencil, color: "text-amber-600", bgColor: "bg-amber-500/10" },
  delete_job: { label: "求人情報を削除", icon: Trash2, color: "text-red-600", bgColor: "bg-red-500/10" },
  publish_job: { label: "求人情報を公開", icon: Eye, color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  unpublish_job: { label: "求人情報を非公開", icon: EyeOff, color: "text-gray-600", bgColor: "bg-gray-500/10" },
};

const actionCategories = [
  { value: "all", label: "すべての操作" },
  { value: "news", label: "NEWS記事" },
  { value: "job", label: "求人情報" },
  { value: "auth", label: "認証" },
];

export default function AuditLogs() {
  const { data: auditLogs, isLoading } = adminTrpc.audit.list.useQuery({ limit: 200 });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    return auditLogs.filter((log) => {
      const matchesSearch = 
        log.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (categoryFilter === "news") {
        matchesCategory = log.action.includes("news");
      } else if (categoryFilter === "job") {
        matchesCategory = log.action.includes("job");
      } else if (categoryFilter === "auth") {
        matchesCategory = log.action === "login" || log.action === "logout";
      }
      
      return matchesSearch && matchesCategory;
    });
  }, [auditLogs, searchQuery, categoryFilter]);

  const getActionInfo = (action: string) => {
    return actionConfig[action] || { 
      label: action, 
      icon: FileText, 
      color: "text-muted-foreground", 
      bgColor: "bg-muted" 
    };
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const logDate = new Date(date);
    const diffMs = now.getTime() - logDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return logDate.toLocaleString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">監査ログ</h1>
        <p className="text-muted-foreground mt-1">
          管理者による操作履歴を確認できます
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="メールアドレス、操作で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{auditLogs?.length || 0}</p>
              <p className="text-sm text-muted-foreground">総操作数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Newspaper className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {auditLogs?.filter((l) => l.action.includes("news")).length || 0}
              </p>
              <p className="text-sm text-muted-foreground">NEWS関連</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {auditLogs?.filter((l) => l.action.includes("job")).length || 0}
              </p>
              <p className="text-sm text-muted-foreground">求人関連</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredLogs.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredLogs.map((log, index) => {
                const actionInfo = getActionInfo(log.action);
                const ActionIcon = actionInfo.icon;
                
                return (
                  <div 
                    key={log.id} 
                    className={cn(
                      "p-4 hover:bg-muted/30 transition-colors",
                      index === 0 && "rounded-t-lg",
                      index === filteredLogs.length - 1 && "rounded-b-lg"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        actionInfo.bgColor
                      )}>
                        <ActionIcon className={cn("h-4 w-4", actionInfo.color)} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{actionInfo.label}</span>
                              <Badge variant="outline" className="text-xs font-normal font-mono">
                                {log.action}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.adminEmail}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(log.createdAt)}
                              </span>
                              {log.ipAddress && (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {log.ipAddress}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Target info */}
                          {(log.resourceType || log.resourceId) && (
                            <div className="text-right shrink-0">
                              <Badge variant="secondary" className="text-xs">
                                {log.resourceType === "news" && <Newspaper className="h-3 w-3 mr-1" />}
                                {log.resourceType === "job" && <Briefcase className="h-3 w-3 mr-1" />}
                                {log.resourceType} #{log.resourceId}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold text-lg mb-1">監査ログがありません</h3>
            <p className="text-muted-foreground">
              {searchQuery || categoryFilter !== "all" 
                ? "検索条件に一致するログがありません" 
                : "操作履歴はまだ記録されていません"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
