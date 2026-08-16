import * as pdfjsLib from "pdfjs-dist";

// Initialize worker for browser environment
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn("pdfjs-dist worker configuration fallback:", err);
  }
}

/**
 * Automatically compresses and resizes any image data URL
 * so that its max dimension is <= maxDimension (default 1600px)
 * and JPEG quality is around 0.82.
 * Keeps base64 payloads under 1MB to prevent Vercel 413 Payload Too Large / server errors.
 */
export async function optimizeImageForOcr(
  dataUrl: string,
  maxDimension = 1600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = dataUrl;
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calculate new dimensions if image exceeds maxDimension
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

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

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
 * @param scale Quality scale factor (default 1.5 for crisp OCR text)
 */
export async function convertPdfToPageImages(
  file: File,
  scale = 1.5
): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageImages: string[] = [];

    // Limit pages to first 8 to avoid memory overflow on huge PDF files
    const totalPagesToRead = Math.min(pdf.numPages, 8);

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
      const rawDataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const optimized = await optimizeImageForOcr(rawDataUrl, 1600, 0.82);
      pageImages.push(optimized);
    }

    return pageImages;
  } catch (error) {
    console.error("Error converting PDF to images:", error);
    throw new Error("پی ڈی ایف فائل کو تصویر میں تبدیل کرنے میں ناکامی ہوئی۔ براہ کرم درست پی ڈی ایف کا انتخاب کریں۔");
  }
}

/**
 * Converts a PDF File into a single vertically stacked image data URL.
 * Stacks all pages with neat padding for seamless multi-page Gemini OCR.
 */
export async function convertPdfToSingleStackedImage(
  file: File,
  scale = 1.5
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
            const totalHeight = loadedImages.reduce((sum, img) => sum + img.height + 15, 0);

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
            loadedImages.forEach((img) => {
              ctx.drawImage(img, 0, currentY);
              currentY += img.height;

              // Draw subtle page divider line
              ctx.strokeStyle = "#cbd5e1";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(0, currentY + 7);
              ctx.lineTo(maxWidth, currentY + 7);
              ctx.stroke();

              currentY += 15;
            });

            const stackedRaw = canvas.toDataURL("image/jpeg", 0.82);
            optimizeImageForOcr(stackedRaw, 1800, 0.80).then(resolve).catch(() => resolve(stackedRaw));
          } catch (e) {
            reject(e);
          }
        }
      };
      img.onerror = () => {
        reject(new Error("پی ڈی ایف صفحہ لوڈ کرنے میں ناکامی۔"));
      };
    });
  });
}

