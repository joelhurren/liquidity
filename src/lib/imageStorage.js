import { supabase } from './supabase';

const BUCKET = 'wine-images';

/**
 * Upload a base64 data URL to Supabase Storage and return the public URL.
 * Returns null if upload fails or no supabase client.
 */
export async function uploadWineImage(base64DataUrl, wineId) {
  if (!supabase || !base64DataUrl?.startsWith('data:')) return null;

  try {
    const match = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1];
    const ext = mimeType.split('/')[1] || 'jpeg';
    const base64 = match[2];

    // Convert base64 to Uint8Array
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const path = `${wineId}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('Image upload failed:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Image upload error:', err);
    return null;
  }
}

/**
 * Check if a string is a base64 data URL (not a storage URL)
 */
export function isBase64Image(str) {
  return str?.startsWith('data:image/');
}

/**
 * Delete a wine image from storage
 */
export async function deleteWineImage(wineId) {
  if (!supabase) return;
  try {
    // Try common extensions
    for (const ext of ['jpeg', 'jpg', 'png', 'webp']) {
      await supabase.storage.from(BUCKET).remove([`${wineId}.${ext}`]);
    }
  } catch {
    // ignore
  }
}
