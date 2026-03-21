/**
 * Compress and resize a base64 image data URL.
 * Returns a smaller JPEG data URL suitable for storage.
 *
 * @param {string} dataUrl - base64 data URL from FileReader
 * @param {number} maxWidth - max width in pixels (default 800)
 * @param {number} quality - JPEG quality 0-1 (default 0.7)
 * @returns {Promise<string>} compressed base64 data URL
 */
export function compressImage(dataUrl, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down if wider than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Output as JPEG for smaller size
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl); // fallback to original on error
    img.src = dataUrl;
  });
}
