"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { FieldError } from "./ui";

export const DOC_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const formatSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

export function FileDrop({
  id,
  label,
  hint,
  file,
  onChange,
  types = DOC_TYPES,
  maxBytes = 5 * 1024 * 1024,
  required = false,
  error,
}: {
  id: string;
  label: string;
  hint: string;
  file: File | null;
  onChange: (f: File | null) => void;
  types?: string[];
  maxBytes?: number;
  required?: boolean;
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState("");
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function accept(f: File | undefined) {
    setLocal("");
    if (!f) return;
    if (!types.includes(f.type)) {
      setLocal(types.includes("application/pdf") ? "Use a PNG, JPG, WebP or PDF file." : "Use a PNG, JPG or WebP image.");
      return;
    }
    if (f.size > maxBytes) {
      setLocal(`File is larger than ${formatSize(maxBytes)}.`);
      return;
    }
    onChange(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    accept(e.dataTransfer.files?.[0]);
  }

  const shownError = local || error;

  return (
    <div>
      <p className="label">
        {label} {required ? <span className="text-bad">*</span> : <span className="font-normal text-muted">(optional)</span>}
      </p>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-ok/30 bg-ok-soft p-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-12 shrink-0 rounded-lg border hairline object-cover" />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-ok">
              <FileText size={20} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-muted">{formatSize(file.size)} · ready to upload</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-label={`Remove ${label}`}
            onClick={() => {
              onChange(null);
              if (ref.current) ref.current.value = "";
            }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          id={id}
          onClick={() => ref.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          aria-invalid={Boolean(shownError)}
          aria-describedby={shownError ? id + "-error" : undefined}
          className={`flex w-full items-center gap-4 rounded-xl border border-dashed p-4 text-left transition ${
            shownError ? "border-bad bg-bad-soft/40" : drag ? "border-brand bg-brand-soft" : "border-white/15 bg-white/[0.02] hover:border-gold/50 hover:bg-gold-soft/40"
          }`}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gold-soft text-gold">
            <UploadCloud size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">
              Choose a file <span className="font-normal text-muted">or drag it here</span>
            </span>
            <span className="mt-0.5 block text-xs text-muted">{hint}</span>
          </span>
        </button>
      )}
      <input ref={ref} type="file" className="hidden" accept={types.join(",")} onChange={(e) => accept(e.target.files?.[0])} tabIndex={-1} />
      <FieldError id={id} message={shownError} />
    </div>
  );
}
