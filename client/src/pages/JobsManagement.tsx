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
    createMutation.mutate({
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      requirements: formData.get("requirements") as string,
      location: formData.get("location") as string,
      employmentType: createEmploymentType as any,
      salaryRange: formData.get("salaryRange") as string,
      isPublished: formData.get("isPublished") === "on",
      closingDate: closingDateStr ? new Date(closingDateStr) : undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingJob) return;
    const formData = new FormData(e.currentTarget);
    const closingDateStr = formData.get("closingDate") as string;
    updateMutation.mutate({
      id: editingJob,
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      requirements: formData.get("requirements") as string,
      location: formData.get("location") as string,
      employmentType: editEmploymentType as any,
      salaryRange: formData.get("salaryRange") as string,
      isPublished: formData.get("isPublished") === "on",
      closingDate: closingDateStr ? new Date(closingDateStr) : undefined,
    });
  };

  const editingJobData = jobsList?.find((j) => j.id === editingJob);

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
              <DialogDescription>新しい求人情報を作成します</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-title">タイトル</Label>
                  <Input id="create-title" name="title" required className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-slug">スラッグ</Label>
                  <Input id="create-slug" name="slug" required className="h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description">説明</Label>
                <Textarea id="create-description" name="description" rows={8} required className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-requirements">応募要件</Label>
                <Textarea id="create-requirements" name="requirements" rows={5} className="resize-none" />
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
                placeholder="タイトル、スラッグ、勤務地で検索..."
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
                          onClick={() => togglePublishMutation.mutate(job.id)}
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
                            setEditingJob(job.id);
                            setEditEmploymentType(job.employmentType);
                          }}
                          className="h-9 w-9"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteConfirm({ id: job.id, title: job.title })}
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
            <DialogDescription>求人情報の内容を編集します</DialogDescription>
          </DialogHeader>
          {editingJobData && (
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">タイトル</Label>
                  <Input id="edit-title" name="title" defaultValue={editingJobData.title} required className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">スラッグ</Label>
                  <Input id="edit-slug" name="slug" defaultValue={editingJobData.slug} required className="h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">説明</Label>
                <Textarea id="edit-description" name="description" rows={8} defaultValue={editingJobData.description} required className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-requirements">応募要件</Label>
                <Textarea id="edit-requirements" name="requirements" rows={5} defaultValue={editingJobData.requirements || ""} className="resize-none" />
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
                <Switch id="edit-isPublished" name="isPublished" defaultChecked={editingJobData.isPublished} />
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
