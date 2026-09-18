'use client';

import { useState } from 'react';

import { ICON_UPLOAD_MAX_BYTES, ICON_UPLOAD_TYPES } from '@/constants/upload';
import { apiClient } from '@/libs/axios';
import type { ApiResponse } from '@/types';

/** Why an upload was rejected — the caller words it, since forms differ. */
export type IconUploadError = 'type' | 'size' | 'failed';

export type IconUploadResult = { url: string } | { error: IconUploadError };

/**
 * Send one image and get back a URL to store in an entity's `icon` field.
 *
 * `icon` holds a string that may be an emoji, a key into the bundled icon
 * registry, or — through this — an uploaded image; `<Icon />` tells them apart.
 */
export function useIconUpload() {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File): Promise<IconUploadResult> {
    // Checked here as well as on the route, so an oversized file is refused
    // before it is sent rather than after.
    if (!ICON_UPLOAD_TYPES.includes(file.type)) return { error: 'type' };
    if (file.size > ICON_UPLOAD_MAX_BYTES) return { error: 'size' };

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await apiClient.post<ApiResponse<{ url: string }>>(
        '/upload/attachment',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return { url: data.data.url };
    } catch {
      return { error: 'failed' };
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
}
