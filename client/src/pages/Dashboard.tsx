import { adminTrpc } from "@/lib/adminTrpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Briefcase, FileText, TrendingUp, Eye, EyeOff, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: newsList } = adminTrpc.news.list.useQuery();
  const { data: jobsList } = adminTrpc.jobs.list.useQuery();
  const { data: auditLogs } = adminTrpc.audit.list.useQuery({ limit: 5 });

  const newsCount = newsList?.length || 0;
  const publishedNewsCount = newsList?.filter((n) => n.isPublished).length || 0;
  const jobsCount = jobsList?.length || 0;
  const publishedJobsCount = jobsList?.filter((j) => j.isPublished).length || 0;

  const stats = [
    {
      title: "NEWS記事",
      value: newsCount,
      subValue: `${publishedNewsCount} 件公開中`,
      icon: Newspaper,
      href: "/news",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "求人情報",
      value: jobsCount,
      subValue: `${publishedJobsCount} 件公開中`,
      icon: Briefcase,
      href: "/jobs",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "監査ログ",
      value: auditLogs?.length || 0,
      subValue: "直近の操作",
      icon: FileText,
      href: "/audit",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  const actionLabels: Record<string, string> = {
    create_news: "NEWS記事を作成",
    update_news: "NEWS記事を更新",
    delete_news: "NEWS記事を削除",
    publish_news: "NEWS記事を公開",
    unpublish_news: "NEWS記事を非公開",
    create_job: "求人情報を作成",
    update_job: "求人情報を更新",
    delete_job: "求人情報を削除",
    publish_job: "求人情報を公開",
    unpublish_job: "求人情報を非公開",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground mt-2">
          コンテンツの概要と最近の操作履歴を確認できます
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bgColor)}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">{stat.subValue}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent News */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">最近のNEWS記事</CardTitle>
              <CardDescription>直近5件の記事</CardDescription>
            </div>
            <Link href="/news">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                すべて表示
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {newsList && newsList.length > 0 ? (
              <div className="space-y-3">
                {newsList.slice(0, 5).map((news) => (
                  <div
                    key={news.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        news.isPublished ? "bg-emerald-500" : "bg-muted-foreground/30"
                      )} />
                      <span className="font-medium truncate">{news.title}</span>
                    </div>
                    <Badge 
                      variant={news.isPublished ? "default" : "secondary"}
                      className={cn(
                        "shrink-0 ml-2",
                        news.isPublished ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : ""
                      )}
                    >
                      {news.isPublished ? (
                        <><Eye className="h-3 w-3 mr-1" /> 公開</>
                      ) : (
                        <><EyeOff className="h-3 w-3 mr-1" /> 下書き</>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>NEWS記事がありません</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">最近の求人情報</CardTitle>
              <CardDescription>直近5件の求人</CardDescription>
            </div>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                すべて表示
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {jobsList && jobsList.length > 0 ? (
              <div className="space-y-3">
                {jobsList.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        job.isPublished ? "bg-emerald-500" : "bg-muted-foreground/30"
                      )} />
                      <span className="font-medium truncate">{job.title}</span>
                    </div>
                    <Badge 
                      variant={job.isPublished ? "default" : "secondary"}
                      className={cn(
                        "shrink-0 ml-2",
                        job.isPublished ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : ""
                      )}
                    >
                      {job.isPublished ? (
                        <><Eye className="h-3 w-3 mr-1" /> 公開</>
                      ) : (
                        <><EyeOff className="h-3 w-3 mr-1" /> 下書き</>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>求人情報がありません</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">最近の操作</CardTitle>
            <CardDescription>管理者による直近の操作履歴</CardDescription>
          </div>
          <Link href="/audit">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              すべて表示
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-4">
              {auditLogs.map((log, index) => (
                <div key={log.id} className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {index < auditLogs.length - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-6 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="font-medium text-sm">
                      {actionLabels[log.action] || log.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {log.adminEmail} • {new Date(log.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>操作履歴がありません</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
