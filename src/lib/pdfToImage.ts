import * as pdfjsLib from "pdfjs-dist";

// Initialize worker for browser environment safely with fallback
if (typeof window !== "undefined") {
  try {
    if (pdfjsLib.GlobalWorkerOptions) {
      const version = pdfjsLib.version || "4.10.38";
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
    }
  } catch (err) {
    console.warn("pdfjs-dist worker initialization notice:", err);
  }
}

/**
 * Specifically boosts faint pencil strokes, handwritten Urdu notes, and light graphite lines.
 * Stretches contrast so paper background turns clean white (#FFFFFF) while pencil marks darken.
 */
export function enhancePencilHandwritingCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pencilIntensity = 1.35
) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      // Perceived luminance
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // If background paper (very bright > 215), push to pure white
      if (gray > 215) {
        d[i] = 255;
        d[i + 1] = 255;
        d[i + 2] = 255;
      } 
      // If faint pencil stroke (between 35 and 215), darken it aggressively
      else if (gray > 35) {
        const normalized = (gray - 35) / 180; // 0 to 1
        const darkened = Math.pow(normalized, pencilIntensity * 1.5) * 210;
        d[i] = Math.max(0, Math.min(255, darkened));
        d[i + 1] = Math.max(0, Math.min(255, darkened));
        d[i + 2] = Math.max(0, Math.min(255, darkened));
      } 
      // Already dark ink
      else {
        d[i] = Math.max(0, r * 0.4);
        d[i + 1] = Math.max(0, g * 0.4);
        d[i + 2] = Math.max(0, b * 0.4);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn("Pencil enhancement canvas notice:", e);
  }
}

/**
 * Automatically compresses, sharpens, and resizes any image data URL
 * so that its max dimension is <= maxDimension (default 1800px)
 * and JPEG quality is around 0.85.
 * Keeps base64 payloads under 1.2MB for instant Gemini multimodal analysis while preserving razor-sharp text.
 */
export async function optimizeImageForOcr(
  dataUrl: string,
  maxDimension = 1800,
  quality = 0.85,
  applyPencilBoost = false
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = dataUrl;
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calculate new dimensions if image exceeds maxDimension (e.g. 4K camera photos)
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill white background for transparent PNGs / screenshots
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      if (applyPencilBoost) {
        enhancePencilHandwritingCanvas(ctx, width, height, 1.3);
      }

      const optimized = canvas.toDataURL("image/jpeg", quality);
      resolve(optimized);
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
  });
}

/**
 * Converts a PDF File into an array of JPEG image data URLs (one per page).
 * @param file PDF File object
 * @param scale Quality scale factor (default 1.75 for crisp OCR text)
 */
export async function convertPdfToPageImages(
  file: File,
  scale = 1.75
): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Ensure worker fallback
    if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        const version = pdfjsLib.version || "4.10.38";
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
      }
    }

    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      useSystemFonts: true
    });
    
    const pdf = await loadingTask.promise;
    const pageImages: string[] = [];

    // Limit pages to first 12 to avoid memory overflow on huge PDF files
    const totalPagesToRead = Math.min(pdf.numPages, 12);

    for (let i = 1; i <= totalPagesToRead; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Fill white background
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext: any = {
        canvasContext: context,
        canvas: canvas,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      const rawDataUrl = canvas.toDataURL("image/jpeg", 0.88);
      const optimized = await optimizeImageForOcr(rawDataUrl, 1800, 0.85);
      pageImages.push(optimized);
    }

    return pageImages;
  } catch (error: any) {
    console.error("Error converting PDF to images:", error);
    throw new Error(`پی ڈی ایف فائل پڑھنے میں خرابی: ${error?.message || "درست پی ڈی ایف فائل منتخب کریں۔"}`);
  }
}

/**
 * Converts a PDF File into a single vertically stacked image data URL.
 * Stacks all pages with neat padding for seamless multi-page Gemini OCR.
 */
export async function convertPdfToSingleStackedImage(
  file: File,
  scale = 1.75
): Promise<string> {
  const pageImages = await convertPdfToPageImages(file, scale);
  if (pageImages.length === 0) {
    throw new Error("پی ڈی ایف میں کوئی صفحہ نہیں ملا۔");
  }
  if (pageImages.length === 1) {
    return pageImages[0];
  }

  // Combine multiple pages into one vertical canvas
  return new Promise((resolve, reject) => {
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    pageImages.forEach((src, idx) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        loadedImages[idx] = img;
        loadedCount++;
        if (loadedCount === pageImages.length) {
          try {
            const maxWidth = Math.max(...loadedImages.map((img) => img.width));
            const totalHeight = loadedImages.reduce((sum, img) => sum + img.height + 20, 0);

            const canvas = document.createElement("canvas");
            canvas.width = maxWidth;
            canvas.height = totalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(pageImages[0]);
              return;
            }

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let currentY = 0;
            loadedImages.forEach((image) => {
              const offsetX = Math.round((maxWidth - image.width) / 2);
              ctx.drawImage(image, offsetX, currentY);
              currentY += image.height + 20;
            });

            const stackedData = canvas.toDataURL("image/jpeg", 0.85);
            resolve(stackedData);
          } catch (err) {
            reject(err);
          }
        }
      };
      img.onerror = () => {
        resolve(pageImages[0]);
      };
    });
  });
}

/**
 * Converts any File (Image or PDF) to an array of base64 image data URLs.
 * Handles JPG, PNG, WEBP, BMP, GIF, PDF seamlessly.
 */
export async function processFileToImageUrls(file: File): Promise<{ name: string; base64: string }[]> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  // 1. PDF File
  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    const pages = await convertPdfToPageImages(file, 1.75);
    return pages.map((pageBase64, idx) => ({
      name: `${file.name} (صفحہ ${idx + 1})`,
      base64: pageBase64
    }));
  }

  // 2. Image File (PNG, JPG, JPEG, WEBP, BMP, GIF, etc.)
  if (fileType.startsWith("image/") || /\.(jpg|jpeg|png|webp|bmp|gif|jfif|tif|tiff|heic)$/i.test(fileName)) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const optimized = await optimizeImageForOcr(base64, 1800, 0.85);
    return [{
      name: file.name,
      base64: optimized
    }];
  }

  throw new Error(`فائل کا فارمیٹ مدعوم نہیں ہے: ${file.name}`);
}

/**
 * Extracts image from clipboard DataTransfer (Ctrl+V paste event).
 */
export async function extractClipboardImages(clipboardData: DataTransfer): Promise<string[]> {
  const imageUrls: string[] = [];
  const items = clipboardData.items;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf("image") !== -1) {
      const file = item.getAsFile();
      if (file) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const optimized = await optimizeImageForOcr(base64, 1800, 0.85);
        imageUrls.push(optimized);
      }
    }
  }

  return imageUrls;
}
