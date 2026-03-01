import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, GripVertical } from "lucide-react";

// よく使うプリセットカラー
const PRESET_COLORS = [
  "#6B7280", // グレー（デフォルト）
  "#EF4444", // 赤
  "#F97316", // オレンジ
  "#EAB308", // 黄
  "#22C55E", // 緑
  "#14B8A6", // ティール
  "#3B82F6", // 青
  "#8B5CF6", // 紫
  "#EC4899", // ピンク
  "#1F3864", // ネイビー
];

type Category = {
  id: number;
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
};

/** カラーピッカーコンポーネント */
function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="space-y-2">
      {/* プリセットカラー */}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
              value === c ? "border-foreground scale-110 shadow-md" : "border-transparent"
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
            title={c}
          />
        ))}
      </div>
      {/* カスタムカラー入力 */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded cursor-pointer border border-input p-0.5 bg-transparent"
        />
        <Input
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          placeholder="#6B7280"
          className="w-32 font-mono text-sm"
          maxLength={7}
        />
        {/* プレビュー */}
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#6B7280" }}
        >
          プレビュー
        </span>
      </div>
    </div>
  );
}

export default function CategoryManagement() {
  const utils = trpc.useUtils();
  const { data: categories = [], isLoading } = trpc.category.list.useQuery();

  // 新規作成モーダル
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newColor, setNewColor] = useState("#6B7280");
  const [newSortOrder, setNewSortOrder] = useState(0);

  // 編集モーダル
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editColor, setEditColor] = useState("#6B7280");
  const [editSortOrder, setEditSortOrder] = useState(0);

  // 削除確認モーダル
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const createMutation = trpc.category.create.useMutation({
    onSuccess: () => {
      toast.success("カテゴリを作成しました");
      utils.category.list.invalidate();
      setCreateOpen(false);
      setNewName("");
      setNewSlug("");
      setNewColor("#6B7280");
      setNewSortOrder(0);
    },
    onError: (e) => toast.error(`作成失敗: ${e.message}`),
  });

  const updateMutation = trpc.category.update.useMutation({
    onSuccess: () => {
      toast.success("カテゴリを更新しました");
      utils.category.list.invalidate();
      setEditOpen(false);
      setEditTarget(null);
    },
    onError: (e) => toast.error(`更新失敗: ${e.message}`),
  });

  const deleteMutation = trpc.category.delete.useMutation({
    onSuccess: () => {
      toast.success("カテゴリを削除しました");
      utils.category.list.invalidate();
      setDeleteOpen(false);
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(`削除失敗: ${e.message}`),
  });

  // 名前からスラッグを自動生成
  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const handleOpenEdit = (cat: Category) => {
    setEditTarget(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditColor(cat.color ?? "#6B7280");
    setEditSortOrder(cat.sortOrder);
    setEditOpen(true);
  };

  const handleCreate = () => {
    if (!newName.trim()) return toast.error("カテゴリ名を入力してください");
    if (!newSlug.trim()) return toast.error("スラッグを入力してください");
    if (!/^#[0-9A-Fa-f]{6}$/.test(newColor)) return toast.error("有効なカラーコードを入力してください");
    createMutation.mutate({ name: newName.trim(), slug: newSlug.trim(), color: newColor, sortOrder: newSortOrder });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    if (!editName.trim()) return toast.error("カテゴリ名を入力してください");
    if (!editSlug.trim()) return toast.error("スラッグを入力してください");
    if (!/^#[0-9A-Fa-f]{6}$/.test(editColor)) return toast.error("有効なカラーコードを入力してください");
    updateMutation.mutate({ id: editTarget.id, name: editName.trim(), slug: editSlug.trim(), color: editColor, sortOrder: editSortOrder });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">カテゴリ管理</h1>
          <p className="text-sm text-muted-foreground mt-1">NEWSカテゴリの追加・編集・削除ができます</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新規カテゴリ
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-16 text-center">カラー</TableHead>
                <TableHead>カテゴリ名</TableHead>
                <TableHead>スラッグ</TableHead>
                <TableHead className="w-24 text-center">表示順</TableHead>
                <TableHead className="w-28 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    カテゴリがありません
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className="inline-block w-6 h-6 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: (cat as any).color ?? "#6B7280" }}
                        title={(cat as any).color ?? "#6B7280"}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: (cat as any).color ?? "#6B7280" }}
                      >
                        {cat.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cat.slug}</code>
                    </TableCell>
                    <TableCell className="text-center">{cat.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(cat as Category)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setDeleteTarget(cat as Category); setDeleteOpen(true); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 新規作成モーダル */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規カテゴリ作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>カテゴリ名 <span className="text-destructive">*</span></Label>
              <Input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug || newSlug === autoSlug(newName)) {
                    setNewSlug(autoSlug(e.target.value));
                  }
                }}
                placeholder="例: プレスリリース"
              />
            </div>
            <div className="space-y-1.5">
              <Label>スラッグ <span className="text-destructive">*</span></Label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="例: press-release"
              />
              <p className="text-xs text-muted-foreground">英小文字・数字・ハイフンのみ使用できます</p>
            </div>
            <div className="space-y-1.5">
              <Label>カラー</Label>
              <ColorPicker value={newColor} onChange={setNewColor} />
            </div>
            <div className="space-y-1.5">
              <Label>表示順</Label>
              <Input
                type="number"
                value={newSortOrder}
                onChange={(e) => setNewSortOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>キャンセル</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集モーダル */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カテゴリ編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>カテゴリ名 <span className="text-destructive">*</span></Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="例: プレスリリース"
              />
            </div>
            <div className="space-y-1.5">
              <Label>スラッグ <span className="text-destructive">*</span></Label>
              <Input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="例: press-release"
              />
              <p className="text-xs text-muted-foreground">英小文字・数字・ハイフンのみ使用できます</p>
            </div>
            <div className="space-y-1.5">
              <Label>カラー</Label>
              <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
            <div className="space-y-1.5">
              <Label>表示順</Label>
              <Input
                type="number"
                value={editSortOrder}
                onChange={(e) => setEditSortOrder(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>キャンセル</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認モーダル */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カテゴリを削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            「<strong>{deleteTarget?.name}</strong>」を削除します。この操作は取り消せません。
            <br />
            ※このカテゴリが設定されている記事のカテゴリは変更されません。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>キャンセル</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
