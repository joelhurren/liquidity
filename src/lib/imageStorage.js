import { supabase } from './supabase';

const BUCKET = 'wine-images';
const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.7;

/**
 * Compress and resize a base64 image using canvas.
 * Returns a smaller base64 JPEG data URL.
 */
export function compressImage(base64DataUrl, maxWidth = MAX_WIDTH, quality = JPEG_QUALITY) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64DataUrl); // fallback to original
    img.src = base64DataUrl;
  });
}

/**
 * Upload a base64 data URL to Supabase Storage and return the public URL.
 * Compresses the image first to reduce storage size.
 * Returns null if upload fails or no supabase client.
 */
export async function uploadWineImage(base64DataUrl, wineId) {
  if (!supabase || !base64DataUrl?.startsWith('data:')) return null;

  try {
    // Compress before uploading
    const compressed = await compressImage(base64DataUrl);
    const match = compressed.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1];
    const base64 = match[2];

    // Convert base64 to Uint8Array
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const path = `${wineId}.jpeg`;

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
    for (const ext of ['jpeg', 'jpg', 'png', 'webp']) {
      await supabase.storage.from(BUCKET).remove([`${wineId}.${ext}`]);
    }
  } catch {
    // ignore
  }
}

/**
 * Migrate all existing base64 images in the DB to Supabase Storage.
 * Call once from the browser console: await migrateImages()
 * Processes one wine at a time to avoid timeouts on the free tier.
 */
export async function migrateImagesToStorage() {
  if (!supabase) return { migrated: 0, errors: 0, skipped: 0 };

  // First get just the IDs (no image data — that would timeout)
  const { data: wines, error } = await supabase
    .from('wines')
    .select('id')
    .not('image_data', 'is', null);

  if (error) {
    console.error('Migration query failed:', error);
    return { migrated: 0, errors: 1, skipped: 0 };
  }

  console.log(`Found ${wines.length} wines with images. Processing one at a time...`);

  let migrated = 0;
  let errors = 0;
  let skipped = 0;

  for (const { id } of wines) {
    // Fetch image_data for this single wine
    const { data: wine, error: fetchErr } = await supabase
      .from('wines')
      .select('id, image_data')
      .eq('id', id)
      .single();

    if (fetchErr || !wine) {
      console.error(`Failed to fetch wine ${id}:`, fetchErr);
      errors++;
      continue;
    }

    // Skip if already a URL (not base64)
    if (!wine.image_data?.startsWith('data:')) {
      skipped++;
      continue;
    }

    console.log(`[${migrated + errors + skipped + 1}/${wines.length}] Migrating wine ${id}...`);
    const imageUrl = await uploadWineImage(wine.image_data, wine.id);
    if (imageUrl) {
      const { error: updateErr } = await supabase
        .from('wines')
        .update({ image_data: imageUrl })
        .eq('id', wine.id);

      if (updateErr) {
        console.error(`Failed to update wine ${id}:`, updateErr);
        errors++;
      } else {
        migrated++;
        console.log(`  ✓ Migrated → ${imageUrl}`);
      }
    } else {
      console.error(`  ✗ Failed to upload image for wine ${id}`);
      errors++;
    }
  }

  console.log(`\nMigration complete: ${migrated} migrated, ${skipped} already done, ${errors} errors`);
  return { migrated, errors, skipped };
}
