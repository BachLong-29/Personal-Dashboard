'use client';

import type { ChangeEvent, DragEvent } from 'react';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/libs/utils';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
}

export interface UploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  files?: UploadFile[];
  onFilesChange?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  hint?: string;
  className?: string;
}

export function Upload({
  accept,
  multiple,
  maxSizeMb,
  files = [],
  onFilesChange,
  onRemove,
  hint,
  className,
}: UploadProps) {
  const t = useTranslations('common');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList) => {
    const filtered = Array.from(fileList).filter((f) => {
      if (maxSizeMb && f.size > maxSizeMb * 1024 * 1024) return false;
      return true;
    });
    if (filtered.length) onFilesChange?.(filtered);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'border-[1.5px] border-dashed rounded-[var(--r-lg)] p-8 text-center cursor-pointer',
          'bg-[var(--bg-2)] transition-all duration-200 [transition-timing-function:var(--ease-out)]',
          dragging
            ? 'border-[var(--gold)] bg-[oklch(0.78_0.16_82_/_0.05)] shadow-[var(--sh-glow-gold)]'
            : 'border-[var(--border-hi)] hover:border-[var(--gold)] hover:bg-[oklch(0.78_0.16_82_/_0.05)] hover:shadow-[var(--sh-glow-gold)]',
        )}
      >
        <div
          className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center text-[22px] text-[var(--gold)] border-[1.5px] border-[var(--border-hi)]"
          style={{
            background:
              'linear-gradient(135deg, oklch(0.78 0.16 82 / 0.15), oklch(0.68 0.22 295 / 0.15))',
          }}
        >
          ⬆
        </div>
        <div className="[font-family:var(--f-title)] text-[15px] tracking-[0.06em] text-[var(--text-hi)] mb-1">
          {files.length > 0 ? t('upload.addMore') : t('upload.dropArtifactsHere')}
        </div>
        <div className="text-[11px] text-[var(--text-lo)]">
          {t('upload.or')}{' '}
          <strong className="text-[var(--gold)]">{t('upload.clickToBrowse')}</strong>
          {hint && ` · ${hint}`}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--r-md)] text-[13px]"
            >
              <span className="text-[var(--gold)] w-4 shrink-0">▦</span>
              <div className="flex-1 min-w-0">
                <div className="text-[var(--text-hi)] truncate">{f.file.name}</div>
                <div className="h-[3px] mt-1 bg-[var(--bg-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${f.progress}%`,
                      background: 'linear-gradient(90deg, var(--gold-2), var(--gold))',
                      boxShadow: 'var(--sh-glow-gold)',
                    }}
                  />
                </div>
              </div>
              <span className="font-[var(--f-mono)] text-[11px] text-[var(--text-lo)] shrink-0">
                {(f.file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(f.id)}
                  className="text-[var(--text-dim)] hover:text-[var(--rose)] transition-colors shrink-0"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
