'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

import { apiClient } from '@/libs/axios';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { ApiResponse } from '@/types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function AvatarUpload() {
  const { user, setUser } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WebP, or GIF files are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('File must be smaller than 5 MB.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await apiClient.post<ApiResponse<{ avatar: string }>>(
        '/upload/avatar',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      if (user) setUser({ ...user, avatar: data.data.avatar });
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--border-hi)] hover:border-[var(--gold)] transition-colors group cursor-pointer"
        title="Click to change avatar"
      >
        {user?.avatar ? (
          <Image src={user.avatar} alt="Avatar" fill sizes="96px" className="object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[var(--gold)] [font-family:var(--f-title)] text-[22px] font-bold"
            style={{
              background:
                'linear-gradient(135deg, oklch(0.78 0.16 82 / 0.15), oklch(0.68 0.22 295 / 0.15))',
            }}
          >
            {initials}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] [font-family:var(--f-mono)] tracking-widest">
            CHANGE
          </span>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {error && (
        <p className="text-[11px] text-[var(--rose)] [font-family:var(--f-mono)]">{error}</p>
      )}
    </div>
  );
}
