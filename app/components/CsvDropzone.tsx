"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CsvDropzoneProps = {
  onFileSelected?: (file: File) => void;
  onDone?: (result: {
    success: boolean;
    importId?: string;
    created?: number;
    updated?: number;
  }) => void;
  className?: string;
};

export default function CsvDropzone({
  onFileSelected,
  onDone,
  className,
}: CsvDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  function toast(message: string, type: "success" | "error" = "success") {
    const bg =
      type === "success"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";
    const el = document.createElement("div");
    el.className = `fixed top-4 right-4 z-50 rounded-md px-4 py-2 shadow ${bg}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  const uploadFile = useCallback(
    async (file: File) => {
      let interval: number | undefined;
      let stop = false;
      const controller = new AbortController();
      try {
        setIsUploading(true);
        setProgress(5);
        const importId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

        const form = new FormData();
        form.append("file", file);
        form.append("importId", importId);

        // Simulate progressive progress while the server processes the file
        interval = window.setInterval(() => {
          setProgress((p) => {
            if (stop) return p;
            // Ease-out growth towards 95%
            const target = 95;
            const delta = Math.max(1, Math.round((target - p) / 12));
            const next = p + delta;
            return Math.min(next, target);
          });
        }, 250);

        // Timeout after 2 minutes to prevent getting stuck
        const timeoutId = window.setTimeout(() => {
          controller.abort();
        }, 120_000);

        let res: Response;
        try {
          res = await fetch("/api/import", {
            method: "POST",
            body: form,
            credentials: "include",
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timeoutId);
        }

        stop = true;
        if (!res.ok) throw new Error("Import failed");
        const data = await res.json().catch(() => ({}));
        setProgress(100);
        // Ensure toast always shows, even if response had no JSON
        const created =
          data && typeof data.created === "number" ? data.created : 0;
        const updated =
          data && typeof data.updated === "number" ? data.updated : 0;
        toast(`Imported ${created} created, ${updated} updated`);
        onDone?.({ success: true, importId, created, updated });
        await new Promise((r) => setTimeout(r, 700));
        const params = new URLSearchParams({
          importId,
          success: "1",
          created: String(created),
          updated: String(updated),
        });
        router.push(`/admin/leads?${params.toString()}`);
      } catch (err: unknown) {
        const isAbort =
          err instanceof DOMException && err.name === "AbortError";
        console.log(
          `LOG =====> Import error: ${
            isAbort ? "aborted (timeout)" : String(err)
          }`
        );
        toast(
          isAbort ? "Import timed out, please try again" : "Import failed",
          "error"
        );
        onDone?.({ success: false });
      } finally {
        stop = true;
        if (interval) window.clearInterval(interval);
        setIsUploading(false);
        setTimeout(() => setProgress(0), 800);
      }
    },
    [router, onDone]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const isCsv =
        file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
      if (!isCsv) {
        console.log("LOG =====> Invalid file type. Please select a CSV file");
        return;
      }
      setSelectedFileName(file.name);
      onFileSelected?.(file);
      uploadFile(file);
      console.log(`LOG =====> CSV selected: ${file.name}`);
    },
    [onFileSelected, uploadFile]
  );

  const onDrop = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);
      handleFiles(event.dataTransfer?.files ?? null);
    },
    [handleFiles]
  );

  const onDragOver = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isDragActive) setIsDragActive(true);
    },
    [isDragActive]
  );

  const onDragLeave = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);
    },
    []
  );

  const onClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      handleFiles(event.target.files);
      // reset input so selecting the same file twice still triggers onChange
      if (event.target) {
        event.target.value = "";
      }
    },
    [handleFiles]
  );

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick();
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={
          `relative flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer select-none ` +
          (isDragActive
            ? "border-primary-600 bg-accent"
            : "border-input hover:border-neutral-500 bg-background")
        }
        aria-label="CSV file dropzone"
      >
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept=".csv,text/csv"
          onChange={onChange}
        />

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-10 w-10 text-muted-foreground mb-3"
          aria-hidden
        >
          <path d="M12 2a1 1 0 011 1v8.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L11 11.586V3a1 1 0 011-1z" />
          <path d="M5 14a1 1 0 011 1v2a2 2 0 002 2h8a2 2 0 002-2v-2a1 1 0 112 0v2a4 4 0 01-4 4H8a4 4 0 01-4-4v-2a1 1 0 011-1z" />
        </svg>

        <p className="text-foreground font-medium">
          Drag and drop your CSV here
        </p>
        <p className="text-muted-foreground text-sm mt-1">or click to browse</p>
        {selectedFileName && (
          <p className="text-muted-foreground text-sm mt-3">
            Selected: {selectedFileName}
          </p>
        )}
        {isUploading && (
          <div className="w-full mt-4">
            <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-primary-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Processing... {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
