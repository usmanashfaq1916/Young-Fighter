"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type FileUploadRef = {
  reset: () => void;
};

export const FileUpload = forwardRef<
  FileUploadRef,
  {
    value: string | null;
    onChange: (dataUrl: string | null, file?: File) => void;
    accept?: string;
    maxSizeMb?: number;
    label?: string;
    round?: boolean;
  }
>(function FileUpload(
  {
    value,
    onChange,
    accept = "image/jpeg,image/png,image/webp",
    maxSizeMb = 5,
    label,
    round = false,
  },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    if (inputRef.current) inputRef.current.value = "";
  };
  useImperativeHandle(ref, () => ({ reset }));

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;

    const allowed = accept.split(",");
    if (!allowed.includes(file.type)) {
      setError("Please select a valid image file (JPG, PNG or WEBP).");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Image must be ${maxSizeMb} MB or smaller.`);
      return;
    }

    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = document.createElement("img");
      img.onload = () => {
        // Compress: downscale to max 800px via canvas.
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          onChange(dataUrl, file);
          setBusy(false);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.82);
        onChange(compressed, file);
        setBusy(false);
      };
      img.onerror = () => {
        onChange(dataUrl, file);
        setBusy(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setError("Could not read the selected file.");
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden border-2 border-dashed border-border bg-surface-alt",
            round ? "h-24 w-24 rounded-full" : "h-28 w-40 rounded-xl"
          )}
        >
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          ) : value ? (
            <>
              <Image
                src={value}
                alt="Preview"
                fill
                className={cn("object-cover", round && "rounded-full")}
                unoptimized
              />
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  reset();
                }}
                aria-label="Remove photo"
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <ImagePlus className="h-7 w-7 text-muted" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-alt"
          >
            {value ? "Replace photo" : "Upload photo"}
          </button>
          <p className="max-w-48 text-[11px] text-muted">
            JPG, PNG or WEBP up to {maxSizeMb} MB
          </p>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
        aria-label={label ?? "Upload file"}
      />
    </div>
  );
});
