import { adminTrpc } from "@/lib/adminTrpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Eye, EyeOff, Search, Calendar, Loader2, Newspaper, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TiptapEditor from "@/components/TiptapEditor";

export default function NewsManagement() {
  const utils = adminTrpc.useUtils();
  const { data: newsList, isLoading } = adminTrpc.news.list.useQuery();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  // 作成フォームの状態
  const [createTitle, setCreateTitle] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createExcerpt, setCreateExcerpt] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createThumbnailUrl, setCreateThumbnailUrl] = useState("");
  const [createIsPublished, setCreateIsPublished] = useState(false);

  // 編集フォームの状態
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("");
  const [editIsPublished, setEditIsPublished] = useState(false);

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
      // フォームリセット
      setCreateTitle("");
      setCreateSlug("");
      setCreateExcerpt("");
      setCreateContent("");
      setCreateThumbnailUrl("");
      setCreateIsPublished(false);
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createContent || createContent === "<p></p>") {
      toast.error("本文を入力してください");
      return;
    }
    createMutation.mutate({
      title: createTitle,
      slug: createSlug,
      content: createContent,
      excerpt: createExcerpt,
      thumbnailUrl: createThumbnailUrl,
      isPublished: createIsPublished,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews) return;
    if (!editContent || editContent === "<p></p>") {
      toast.error("本文を入力してください");
      return;
    }
    updateMutation.mutate({
      id: editingNews,
      title: editTitle,
      slug: editSlug,
      content: editContent,
      excerpt: editExcerpt,
      thumbnailUrl: editThumbnailUrl,
      isPublished: editIsPublished,
    });
  };

  const editingNewsData = newsList?.find((n) => n.id === editingNews);

  // 編集ダイアログを開く際に状態を初期化
  const openEditDialog = (newsId: number) => {
    const news = newsList?.find((n) => n.id === newsId);
    if (!news) return;
    setEditTitle(news.title);
    setEditSlug(news.slug);
    setEditExcerpt(news.excerpt || "");
    setEditContent(news.content);
    setEditThumbnailUrl(news.thumbnailUrl || "");
    setEditIsPublished(news.isPublished);
    setEditingNews(newsId);
  };

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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>NEWS記事を作成</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="create-title">タイトル <span className="text-destructive">*</span></Label>
                <Input
                  id="create-title"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="例: 2025年度第1回求人のお知らせ"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-slug">URL識別子（英数字・ハイフンのみ） <span className="text-destructive">*</span></Label>
                <Input
                  id="create-slug"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value)}
                  placeholder="例: 2025-recruitment-notice"
                  required
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">記事のURLに使われます。英小文字・数字・ハイフン（-）のみ使用可能です。</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-excerpt">一言説明（記事の概要）</Label>
                <Textarea
                  id="create-excerpt"
                  value={createExcerpt}
                  onChange={(e) => setCreateExcerpt(e.target.value)}
                  rows={3}
                  placeholder="一覧ページや記事先頭に表示される短い説明文です。例: 今年度の新卒採用についてお知らせします。"
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>本文 <span className="text-destructive">*</span></Label>
                <TiptapEditor
                  value={createContent}
                  onChange={setCreateContent}
                  placeholder="記事の詳細内容を入力してください。ツールバーで見出し・太字・リストなどを設定できます。"
                  minHeight="280px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-thumbnailUrl">サムネイル画像URL</Label>
                <Input
                  id="create-thumbnailUrl"
                  value={createThumbnailUrl}
                  onChange={(e) => setCreateThumbnailUrl(e.target.value)}
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="h-10"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="create-isPublished" className="font-medium">公開する</Label>
                  <p className="text-sm text-muted-foreground">作成後すぐに公開します</p>
                </div>
                <Switch
                  id="create-isPublished"
                  checked={createIsPublished}
                  onCheckedChange={setCreateIsPublished}
                />
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
                  {/* Thumbnail */}
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
                          onClick={() => news.id != null && togglePublishMutation.mutate(news.id)}
                          disabled={togglePublishMutation.isPending}
                          className="h-9 w-9"
                          title={news.isPublished ? "非公開にする" : "公開する"}
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
                          onClick={() => news.id != null && openEditDialog(news.id)}
                          className="h-9 w-9"
                          title="編集"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => news.id != null && setDeleteConfirm({ id: news.id, title: news.title })}
                          className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="削除"
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>NEWS記事を編集</DialogTitle>
          </DialogHeader>
          {editingNewsData && (
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="edit-title">タイトル <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">URL識別子（英数字・ハイフンのみ） <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-slug"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  required
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">記事のURLに使われます。英小文字・数字・ハイフン（-）のみ使用可能です。</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-excerpt">一言説明（記事の概要）</Label>
                <Textarea
                  id="edit-excerpt"
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  rows={3}
                  placeholder="一覧ページや記事先頭に表示される短い説明文です。"
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>本文 <span className="text-destructive">*</span></Label>
                <TiptapEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="記事の詳細内容を入力してください。"
                  minHeight="280px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-thumbnailUrl">サムネイル画像URL</Label>
                <Input
                  id="edit-thumbnailUrl"
                  value={editThumbnailUrl}
                  onChange={(e) => setEditThumbnailUrl(e.target.value)}
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="h-10"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="edit-isPublished" className="font-medium">公開する</Label>
                  <p className="text-sm text-muted-foreground">この記事を公開します</p>
                </div>
                <Switch
                  id="edit-isPublished"
                  checked={editIsPublished}
                  onCheckedChange={setEditIsPublished}
                />
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
              {deleteMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 削除中...</>
              ) : (
                "削除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
