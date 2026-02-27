import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  id?: string;
}

export function ImageUpload({ value, onChange, label = "サムネイル画像", id = "image-upload" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `アップロードに失敗しました (${res.status})`);
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "アップロードに失敗しました");
    } finally {
      setIsUploading(false);
      // ファイル入力をリセット（同じファイルを再選択できるように）
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      {/* プレビュー */}
      {value && (
        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted border">
          <img
            src={value}
            alt="サムネイルプレビュー"
            className="w-full h-full object-cover"
            onError={() => setError("画像を読み込めませんでした。URLを確認してください。")}
          />
          <button
            type="button"
            onClick={() => { onChange(""); setError(null); }}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
            title="画像を削除"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* URL入力 + アップロードボタン */}
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => { onChange(e.target.value); setError(null); }}
          type="url"
          placeholder="https://example.com/image.jpg"
          className="h-10 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 px-3 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="ファイルをアップロード"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="ml-1 text-xs">{isUploading ? "アップロード中..." : "ファイル選択"}</span>
        </Button>
      </div>

      {/* 空の場合のプレースホルダー */}
      {!value && (
        <div className="flex items-center justify-center w-full h-24 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30">
          <div className="text-center">
            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground mt-1">URLを入力するか、ファイルを選択してください</p>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* 非表示のファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
