import { adminTrpc } from "@/lib/adminTrpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Eye, EyeOff, Search, Calendar, Loader2, Newspaper, Filter, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** slug入力欄のリアルタイム重複チェックコンポーネント */
function SlugInput({
  id,
  name,
  defaultValue,
  excludeId,
  checkEndpoint,
  onChange,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  excludeId?: number;
  checkEndpoint: "news" | "jobs";
  onChange?: (value: string) => void;
}) {
  const [slug, setSlug] = useState(defaultValue ?? "");
  const [debouncedSlug, setDebouncedSlug] = useState(defaultValue ?? "");

  // 500ms デバウンス
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSlug(slug);
    }, 500);
    return () => clearTimeout(timer);
  }, [slug]);

  const isValidFormat = /^[a-z0-9-]+$/.test(debouncedSlug) && debouncedSlug.length > 0;

  const checkQuery =
    checkEndpoint === "news"
      ? adminTrpc.news.checkSlug.useQuery(
          { slug: debouncedSlug, excludeId },
          { enabled: isValidFormat, retry: false }
        )
      : adminTrpc.jobs.checkSlug.useQuery(
          { slug: debouncedSlug, excludeId },
          { enabled: isValidFormat, retry: false }
        );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(val);
    onChange?.(val);
  };

  const showStatus = debouncedSlug.length > 0;
  const isChecking = checkQuery.isFetching;
  const isAvailable = checkQuery.data?.available;
  const isDuplicate = checkQuery.data?.reason === "duplicate";
  const isInvalidFormat = debouncedSlug.length > 0 && !isValidFormat;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          id={id}
          name={name}
          value={slug}
          onChange={handleChange}
          placeholder="例: 2025-recruitment-notice"
          required
          className={cn(
            "h-10 pr-10",
            showStatus && isDuplicate && "border-destructive focus-visible:ring-destructive/50",
            showStatus && isAvailable && "border-emerald-500 focus-visible:ring-emerald-500/50"
          )}
        />
        {showStatus && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isInvalidFormat ? (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            ) : isDuplicate ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : isAvailable ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : null}
          </div>
        )}
      </div>
      {showStatus && (
        <p
          className={cn(
            "text-xs",
            isInvalidFormat
              ? "text-amber-600"
              : isDuplicate
              ? "text-destructive"
              : isAvailable
              ? "text-emerald-600"
              : "text-muted-foreground"
          )}
        >
          {isChecking
            ? "確認中..."
            : isInvalidFormat
            ? "英小文字・数字・ハイフン（-）のみ使用できます"
            : isDuplicate
            ? "このURL識別子はすでに使用されています。別の値を入力してください。"
            : isAvailable
            ? "このURL識別子は使用できます"
            : "記事のURLに使われます。英小文字・数字・ハイフン（-）のみ使用可能です。"}
        </p>
      )}
      {!showStatus && (
        <p className="text-xs text-muted-foreground">
          記事のURLに使われます。英小文字・数字・ハイフン（-）のみ使用可能です。
        </p>
      )}
    </div>
  );
}

export default function NewsManagement() {
  const utils = adminTrpc.useUtils();
  const { data: newsList, isLoading } = adminTrpc.news.list.useQuery();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const filteredNews = useMemo(() => {
    if (!newsList) return [];
    return newsList.filter((news) => {
      const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        news.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "published" && news.isPublished) ||
        (statusFilter === "draft" && !news.isPublished);
      return matchesSearch && matchesStatus;
    });
  }, [newsList, searchQuery, statusFilter]);

  const createMutation = adminTrpc.news.create.useMutation({
    onSuccess: () => {
      toast.success("NEWS記事を作成しました");
      utils.news.list.invalidate();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "作成に失敗しました");
    },
  });

  const updateMutation = adminTrpc.news.update.useMutation({
    onSuccess: () => {
      toast.success("NEWS記事を更新しました");
      utils.news.list.invalidate();
      setEditingNews(null);
    },
    onError: (error) => {
      toast.error(error.message || "更新に失敗しました");
    },
  });

  const deleteMutation = adminTrpc.news.delete.useMutation({
    onSuccess: () => {
      toast.success("NEWS記事を削除しました");
      utils.news.list.invalidate();
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast.error(error.message || "削除に失敗しました");
    },
  });

  const togglePublishMutation = adminTrpc.news.togglePublish.useMutation({
    onSuccess: (data) => {
      toast.success(data.isPublished ? "公開しました" : "非公開にしました");
      utils.news.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "公開状態の変更に失敗しました");
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      content: formData.get("content") as string,
      excerpt: formData.get("excerpt") as string,
      thumbnailUrl: formData.get("thumbnailUrl") as string,
      isPublished: formData.get("isPublished") === "on",
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingNews) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingNews,
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      content: formData.get("content") as string,
      excerpt: formData.get("excerpt") as string,
      thumbnailUrl: formData.get("thumbnailUrl") as string,
      isPublished: formData.get("isPublished") === "on",
    });
  };

  const editingNewsData = newsList?.find((n) => n.id === editingNews);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NEWS記事管理</h1>
          <p className="text-muted-foreground mt-1">
            NEWS記事の作成・編集・削除ができます
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>NEWS記事を作成</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="create-title">タイトル <span className="text-destructive">*</span></Label>
                <Input id="create-title" name="title" placeholder="例: 2025年度第1回求人のお知らせ" required className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-slug">URL識別子（英数字・ハイフンのみ） <span className="text-destructive">*</span></Label>
                <SlugInput
                  id="create-slug"
                  name="slug"
                  checkEndpoint="news"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-excerpt">一言説明（記事の概要）</Label>
                <Textarea id="create-excerpt" name="excerpt" rows={3} placeholder="一覧ページや記事先頭に表示される短い説明文です。例: 今年度の新卒採用についてお知らせします。" className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-content">本文 <span className="text-destructive">*</span></Label>
                <Textarea id="create-content" name="content" rows={10} placeholder="記事の詳細内容を入力してください。Markdown形式に対応しています。" required className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-thumbnailUrl">サムネイル画像URL</Label>
                <Input id="create-thumbnailUrl" name="thumbnailUrl" type="url" placeholder="https://example.com/image.jpg" className="h-10" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="create-isPublished" className="font-medium">公開する</Label>
                  <p className="text-sm text-muted-foreground">作成後すぐに公開します</p>
                </div>
                <Switch id="create-isPublished" name="isPublished" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90">
                  {createMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 作成中...</>
                  ) : (
                    "作成"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="タイトルまたはURL識別子で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-full sm:w-40 h-10">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="published">公開中</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="grid gap-4">
          {filteredNews.map((news) => (
            <Card key={news.id} className="group hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Thumbnail placeholder */}
                  <div className="hidden sm:flex w-20 h-20 rounded-lg bg-muted items-center justify-center shrink-0">
                    {news.thumbnailUrl ? (
                      <img src={news.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Newspaper className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg truncate">{news.title}</h3>
                          <Badge 
                            variant={news.isPublished ? "default" : "secondary"}
                            className={cn(
                              news.isPublished 
                                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" 
                                : ""
                            )}
                          >
                            {news.isPublished ? "公開" : "下書き"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{news.slug}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(news.createdAt).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                        {news.excerpt && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{news.excerpt}</p>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => togglePublishMutation.mutate(news.id)}
                          disabled={togglePublishMutation.isPending}
                          className="h-9 w-9"
                        >
                          {news.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingNews(news.id)}
                          className="h-9 w-9"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteConfirm({ id: news.id, title: news.title })}
                          className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold text-lg mb-1">NEWS記事がありません</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "検索条件に一致する記事がありません" 
                : "新規作成ボタンから最初の記事を作成してください"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                最初の記事を作成
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingNews} onOpenChange={() => setEditingNews(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>NEWS記事を編集</DialogTitle>
          </DialogHeader>
          {editingNewsData && (
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="edit-title">タイトル <span className="text-destructive">*</span></Label>
                <Input id="edit-title" name="title" defaultValue={editingNewsData.title} required className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">URL識別子（英数字・ハイフンのみ） <span className="text-destructive">*</span></Label>
                <SlugInput
                  id="edit-slug"
                  name="slug"
                  defaultValue={editingNewsData.slug}
                  excludeId={editingNewsData.id}
                  checkEndpoint="news"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-excerpt">一言説明（記事の概要）</Label>
                <Textarea id="edit-excerpt" name="excerpt" rows={3} defaultValue={editingNewsData.excerpt || ""} placeholder="一覧ページや記事先頭に表示される短い説明文です。" className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">本文 <span className="text-destructive">*</span></Label>
                <Textarea id="edit-content" name="content" rows={10} defaultValue={editingNewsData.content} required className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-thumbnailUrl">サムネイル画像URL</Label>
                <Input id="edit-thumbnailUrl" name="thumbnailUrl" type="url" defaultValue={editingNewsData.thumbnailUrl || ""} placeholder="https://example.com/image.jpg" className="h-10" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="edit-isPublished" className="font-medium">公開する</Label>
                  <p className="text-sm text-muted-foreground">この記事を公開します</p>
                </div>
                <Switch id="edit-isPublished" name="isPublished" defaultChecked={editingNewsData.isPublished} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingNews(null)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="bg-primary hover:bg-primary/90">
                  {updateMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 更新中...</>
                  ) : (
                    "更新"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteConfirm?.title}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
