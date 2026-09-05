/**
 * Client-Side Image Optimizer & Square Cropper
 *
 * Resizes, crops to a center square, and compresses uploaded avatar photos
 * directly on the device using HTML5 Canvas. This prevents large 5-15MB phone
 * camera photos from failing uploads on mobile devices like Infinix Hot 10.
 */

export interface OptimizedImageResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export async function optimizeAvatarImage(
  file: File,
  targetDimension: number = 240,
  quality: number = 0.85
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not a valid image.'));
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetDimension;
          canvas.height = targetDimension;

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            return reject(new Error('Could not initialize canvas context.'));
          }

          // Center square crop
          const srcWidth = img.naturalWidth || img.width;
          const srcHeight = img.naturalHeight || img.height;
          const minSide = Math.min(srcWidth, srcHeight);
          const startX = (srcWidth - minSide) / 2;
          const startY = (srcHeight - minSide) / 2;

          // Image smoothing for ultra crisp avatars
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            startX,
            startY,
            minSide,
            minSide,
            0,
            0,
            targetDimension,
            targetDimension
          );

          // Test WebP support or fallback to JPEG
          let mimeType = 'image/webp';
          let dataUrl = canvas.toDataURL(mimeType, quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            mimeType = 'image/jpeg';
            dataUrl = canvas.toDataURL(mimeType, quality);
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Image compression failed.'));
              }

              const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
              const optimizedFile = new File(
                [blob],
                `avatar-${Date.now()}.${ext}`,
                { type: mimeType }
              );

              resolve({
                file: optimizedFile,
                dataUrl,
                width: targetDimension,
                height: targetDimension,
                sizeBytes: blob.size,
              });
            },
            mimeType,
            quality
          );
        } catch (err: any) {
          reject(err instanceof Error ? err : new Error('Image processing error.'));
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
