/** Longest edge for a local postcard preview. Plenty for the card, small enough for cache. */
const MAX_EDGE_PX = 1280;
const JPEG_QUALITY = 0.78;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read photo"));
    reader.readAsDataURL(file);
  });
}

function canvasToJpeg(source: CanvasImageSource, width: number, height: number): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

function scaledSize(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Resize and JPEG-compress an uploaded photo so it can live in localStorage.
 * Falls back to the raw file if the browser cannot draw it.
 */
export async function fileToPostcardDataUrl(file: File): Promise<string> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const { width, height } = scaledSize(bitmap.width, bitmap.height);
        const dataUrl = canvasToJpeg(bitmap, width, height);
        if (dataUrl) return dataUrl;
      } finally {
        bitmap.close();
      }
    } catch {
      /* try the Image path */
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const dataUrl = await new Promise<string | null>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const { width, height } = scaledSize(image.naturalWidth, image.naturalHeight);
        resolve(canvasToJpeg(image, width, height));
      };
      image.onerror = () => resolve(null);
      image.src = objectUrl;
    });
    if (dataUrl) return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return readAsDataUrl(file);
}
