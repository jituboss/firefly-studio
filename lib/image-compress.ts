/**
 * E16-06 — client-side image compression before upload.
 *
 * A phone camera produces 3-8 MB per shot. A receipt only needs to be legible,
 * and uploading the original burns the user's data allowance, the server's
 * disk, and on a slow connection the upload itself. Downscaling to 1600px on
 * the long edge at JPEG quality 0.8 typically turns 4 MB into 250-400 KB while
 * staying comfortably readable.
 *
 * Runs in the browser, so this never touches the server's CPU.
 */

export const MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.8;

/** Below this there is nothing worth compressing. */
const SKIP_BELOW_BYTES = 400 * 1024;

export interface CompressResult {
  file: File;
  originalBytes: number;
  compressed: boolean;
}

export async function compressImage(file: File): Promise<CompressResult> {
  const original = { file, originalBytes: file.size, compressed: false };

  // PNGs of screenshots re-encode badly as JPEG and GIFs lose animation, so
  // only photographic formats are touched.
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return original;
  if (file.size < SKIP_BELOW_BYTES) return original;
  if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas === 'undefined') {
    return original;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) return original;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });

    // Re-encoding can grow a small or already-optimised file. Keep whichever
    // is smaller rather than assuming the new one wins.
    if (blob.size >= file.size) return original;

    const renamed = file.name.replace(/\.(png|webp|jpe?g)$/i, '') + '.jpg';
    return {
      file: new File([blob], renamed, { type: 'image/jpeg', lastModified: Date.now() }),
      originalBytes: file.size,
      compressed: true,
    };
  } catch {
    // A corrupt image, an unsupported codec, or a canvas the browser refuses to
    // allocate. Uploading the original is always better than failing.
    return original;
  }
}
