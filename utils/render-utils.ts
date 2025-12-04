// Utility functions for rendering PDF pages progressively

interface RenderOptions {
  batchSize?: number;
  useLazyLoading?: boolean;
  lazyLoadMargin?: string;
  onProgress?: (current: number, total: number) => void;
  onBatchComplete?: () => void;
}

let intersectionObserver: IntersectionObserver | null = null;

export function cleanupLazyRendering() {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
}

export async function renderPagesProgressively(
  pdfDoc: any,
  container: HTMLElement,
  createWrapper: (canvas: HTMLCanvasElement, pageNumber: number) => HTMLElement,
  options: RenderOptions = {}
) {
  const {
    batchSize = 8,
    useLazyLoading = true,
    lazyLoadMargin = '300px',
    onProgress,
    onBatchComplete,
  } = options;

  const totalPages = pdfDoc.numPages;
  
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) continue;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      const wrapper = createWrapper(canvas, pageNum);
      container.appendChild(wrapper);
      
      if (onProgress) {
        onProgress(pageNum, totalPages);
      }
      
      // Batch rendering
      if (pageNum % batchSize === 0 && onBatchComplete) {
        onBatchComplete();
        // Small delay between batches to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error);
    }
  }
  
  if (onBatchComplete) {
    onBatchComplete();
  }
  
  // Setup lazy loading observer if enabled
  if (useLazyLoading) {
    setupLazyLoading(container, lazyLoadMargin);
  }
}

function setupLazyLoading(container: HTMLElement, margin: string) {
  cleanupLazyRendering();
  
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          // Element is visible, ensure it's rendered
          element.style.visibility = 'visible';
        }
      });
    },
    {
      root: null,
      rootMargin: margin,
      threshold: 0.01,
    }
  );
  
  // Observe all page thumbnails
  const thumbnails = container.querySelectorAll('.page-thumbnail');
  thumbnails.forEach((thumb) => {
    intersectionObserver?.observe(thumb);
  });
}
