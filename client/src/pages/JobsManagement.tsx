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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Eye, EyeOff, Search, MapPin, Briefcase, Loader2, Filter, Calendar, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import TiptapEditor from "@/components/TiptapEditor";

const employmentTypeLabels: Record<string, string> = {
  full_time: "正社員",
  part_time: "パート・アルバイト",
  contract: "契約社員",
  internship: "インターンシップ",
};

const employmentTypeColors: Record<string, string> = {
  full_time: "bg-blue-500/10 text-blue-600",
  part_time: "bg-purple-500/10 text-purple-600",
  contract: "bg-orange-500/10 text-orange-600",
  internship: "bg-teal-500/10 text-teal-600",
};

export default function JobsManagement() {
  const utils = adminTrpc.useUtils();
  const { data: jobsList, isLoading } = adminTrpc.jobs.list.useQuery();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [createEmploymentType, setCreateEmploymentType] = useState<string>("full_time");
  const [editEmploymentType, setEditEmploymentType] = useState<string>("full_time");

  // 作成フォームの本文状態
  const [createDescription, setCreateDescription] = useState("");
  const [createRequirements, setCreateRequirements] = useState("");
  const [createIsPublished, setCreateIsPublished] = useState(false);

  // 編集フォームの本文状態
  const [editDescription, setEditDescription] = useState("");
  const [editRequirements, setEditRequirements] = useState("");
  const [editIsPublished, setEditIsPublished] = useState(false);

  const filteredJobs = useMemo(() => {
    if (!jobsList) return [];
    return jobsList.filter((job) => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "published" && job.isPublished) ||
        (statusFilter === "draft" && !job.isPublished);
      return matchesSearch && matchesStatus;
    });
  }, [jobsList, searchQuery, statusFilter]);

  const createMutation = adminTrpc.jobs.create.useMutation({
    onSuccess: () => {
      toast.success("求人情報を作成しました");
      utils.jobs.list.invalidate();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "作成に失敗しました");
    },
  });

  const updateMutation = adminTrpc.jobs.update.useMutation({
    onSuccess: () => {
      toast.success("求人情報を更新しました");
      utils.jobs.list.invalidate();
      setEditingJob(null);
    },
    onError: (error) => {
      toast.error(error.message || "更新に失敗しました");
    },
  });

  const deleteMutation = adminTrpc.jobs.delete.useMutation({
    onSuccess: () => {
      toast.success("求人情報を削除しました");
      utils.jobs.list.invalidate();
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast.error(error.message || "削除に失敗しました");
    },
  });

  const togglePublishMutation = adminTrpc.jobs.togglePublish.useMutation({
    onSuccess: (data) => {
      toast.success(data.isPublished ? "公開しました" : "非公開にしました");
      utils.jobs.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "公開状態の変更に失敗しました");
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const closingDateStr = formData.get("closingDate") as string;
    if (!createDescription || createDescription === "<p></p>") {
      toast.error("仕事内容・求人説明を入力してください");
      return;
    }
    createMutation.mutate({
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: createDescription,
      requirements: createRequirements,
      location: formData.get("location") as string,
      employmentType: createEmploymentType as any,
      salaryRange: formData.get("salaryRange") as string,
      isPublished: createIsPublished,
      closingDate: closingDateStr ? new Date(closingDateStr) : undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingJob) return;
    const formData = new FormData(e.currentTarget);
    const closingDateStr = formData.get("closingDate") as string;
    if (!editDescription || editDescription === "<p></p>") {
      toast.error("仕事内容・求人説明を入力してください");
      return;
    }
    updateMutation.mutate({
      id: editingJob,
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: editDescription,
      requirements: editRequirements,
      location: formData.get("location") as string,
      employmentType: editEmploymentType as any,
      salaryRange: formData.get("salaryRange") as string,
      isPublished: editIsPublished,
      closingDate: closingDateStr ? new Date(closingDateStr) : undefined,
    });
  };

  const editingJobData = jobsList?.find((j) => j.id === editingJob);

  const openEditJobDialog = (jobId: number) => {
    const job = jobsList?.find((j) => j.id === jobId);
    if (!job) return;
    setEditDescription(job.description);
    setEditRequirements(job.requirements || "");
    setEditIsPublished(job.isPublished);
    setEditEmploymentType(job.employmentType || "full_time");
    setEditingJob(jobId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">求人情報管理</h1>
          <p className="text-muted-foreground mt-1">
            求人情報の作成・編集・削除ができます
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
              <DialogTitle>求人情報を作成</DialogTitle>

            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="create-title">求人タイトル <span className="text-destructive">*</span></Label>
                <Input id="create-title" name="title" placeholder="例: エンジニア（バックエンド）を募集しています" required className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-slug">URL識別子（英数字・ハイフンのみ） <span className="text-destructive">*</span></Label>
                <Input id="create-slug" name="slug" placeholder="例: backend-engineer-2025" required className="h-10" />
                <p className="text-xs text-muted-foreground">求人ページのURLに使われます。英小文字・数字・ハイフン（-）のみ使用可能です。</p>
              </div>
              <div className="space-y-2">
                <Label>仕事内容・求人説明 <span className="text-destructive">*</span></Label>
                <TiptapEditor
                  value={createDescription}
                  onChange={setCreateDescription}
                  placeholder="仕事の内容や現場の雰囲気、待遇などを詳しく記載してください。ツールバーで見出し・太字・リストなどを設定できます。"
                  minHeight="240px"
                />
              </div>
              <div className="space-y-2">
                <Label>応募要件・必須スキル</Label>
                <TiptapEditor
                  value={createRequirements}
                  onChange={setCreateRequirements}
                  placeholder="必須スキルや経験年数、歓迎するスキルなどを記載してください。"
                  minHeight="160px"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-location">勤務地</Label>
                  <Input id="create-location" name="location" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-employmentType">雇用形態</Label>
                  <Select value={createEmploymentType} onValueChange={setCreateEmploymentType}>
                    <SelectTrigger id="create-employmentType" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">正社員</SelectItem>
                      <SelectItem value="part_time">パート・アルバイト</SelectItem>
                      <SelectItem value="contract">契約社員</SelectItem>
                      <SelectItem value="internship">インターンシップ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-salaryRange">給与</Label>
                  <Input id="create-salaryRange" name="salaryRange" placeholder="例: 年収400万円〜600万円" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-closingDate">応募締切日</Label>
                  <Input id="create-closingDate" name="closingDate" type="date" className="h-10" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="create-isPublished" className="font-medium">公開する</Label>
                  <p className="text-sm text-muted-foreground">作成後すぐに公開します</p>
                </div>
                <Switch id="create-isPublished" checked={createIsPublished} onCheckedChange={setCreateIsPublished} />
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
                placeholder="タイトル、URL識別子、勤務地で検索..."
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
      ) : filteredJobs.length > 0 ? (
        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="group hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="hidden sm:flex w-14 h-14 rounded-xl bg-muted items-center justify-center shrink-0">
                    <Briefcase className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg truncate">{job.title}</h3>
                          <Badge 
                            variant={job.isPublished ? "default" : "secondary"}
                            className={cn(
                              job.isPublished 
                                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" 
                                : ""
                            )}
                          >
                            {job.isPublished ? "公開" : "下書き"}
                          </Badge>
                          <Badge variant="outline" className={employmentTypeColors[job.employmentType]}>
                            {employmentTypeLabels[job.employmentType]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{job.slug}</span>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                          )}
                          {job.salaryRange && (
                            <span className="flex items-center gap-1">
                              <Banknote className="h-3 w-3" />
                              {job.salaryRange}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(job.createdAt).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => job.id != null && togglePublishMutation.mutate(job.id)}
                          disabled={togglePublishMutation.isPending}
                          className="h-9 w-9"
                        >
                          {job.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (job.id != null) openEditJobDialog(job.id);
                          }}
                          className="h-9 w-9"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => job.id != null && setDeleteConfirm({ id: job.id, title: job.title })}
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
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold text-lg mb-1">求人情報がありません</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "検索条件に一致する求人がありません" 
                : "新規作成ボタンから最初の求人を作成してください"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                最初の求人を作成
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>求人情報を編集</DialogTitle>

          </DialogHeader>
          {editingJobData && (
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="edit-title">求人タイトル <span className="text-destructive">*</span></Label>
                <Input id="edit-title" name="title" defaultValue={editingJobData.title} required className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">URL識別子（英数字・ハイフンのみ） <span className="text-destructive">*</span></Label>
                <Input id="edit-slug" name="slug" defaultValue={editingJobData.slug} required className="h-10" />
                <p className="text-xs text-muted-foreground">求人ページのURLに使われます。英小文字・数字・ハイフン（-）のみ使用可能です。</p>
              </div>
              <div className="space-y-2">
                <Label>仕事内容・求人説明 <span className="text-destructive">*</span></Label>
                <TiptapEditor
                  value={editDescription}
                  onChange={setEditDescription}
                  placeholder="仕事の内容や現場の雰囲気、待遇などを詳しく記載してください。"
                  minHeight="240px"
                />
              </div>
              <div className="space-y-2">
                <Label>応募要件・必須スキル</Label>
                <TiptapEditor
                  value={editRequirements}
                  onChange={setEditRequirements}
                  placeholder="必須スキルや経験年数、歓迎するスキルなどを記載してください。"
                  minHeight="160px"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-location">勤務地</Label>
                  <Input id="edit-location" name="location" defaultValue={editingJobData.location || ""} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-employmentType">雇用形態</Label>
                  <Select value={editEmploymentType} onValueChange={setEditEmploymentType}>
                    <SelectTrigger id="edit-employmentType" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">正社員</SelectItem>
                      <SelectItem value="part_time">パート・アルバイト</SelectItem>
                      <SelectItem value="contract">契約社員</SelectItem>
                      <SelectItem value="internship">インターンシップ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-salaryRange">給与</Label>
                  <Input id="edit-salaryRange" name="salaryRange" defaultValue={editingJobData.salaryRange || ""} placeholder="例: 年収400万円〜600万円" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-closingDate">応募締切日</Label>
                  <Input
                    id="edit-closingDate"
                    name="closingDate"
                    type="date"
                    defaultValue={editingJobData.closingDate ? new Date(editingJobData.closingDate).toISOString().split("T")[0] : ""}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="edit-isPublished" className="font-medium">公開する</Label>
                  <p className="text-sm text-muted-foreground">この求人を公開します</p>
                </div>
                <Switch id="edit-isPublished" checked={editIsPublished} onCheckedChange={setEditIsPublished} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingJob(null)}>
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
            <AlertDialogTitle>求人を削除しますか？</AlertDialogTitle>
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
