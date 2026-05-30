import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FilesService {
  blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  bufferToObjectURL(buffer: ArrayBuffer, mimeType: string) {
    const blob = new Blob([buffer], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  revokeObjectURL(url: string) {
    URL.revokeObjectURL(url);
  }

  isImageType(mimeType: string) {
    return mimeType.startsWith('image/');
  }

  isPdfType(mimeType: string) {
    return mimeType === 'application/pdf';
  }

  formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  extractLinkMetadata(url: string): { hostname: string; isValid: boolean } {
    try {
      const parsed = new URL(url);
      return { hostname: parsed.hostname, isValid: true };
    } catch {
      return { hostname: '', isValid: false };
    }
  }

  resolveImageFromClipboard(items: DataTransferItemList) {
    const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
    return Promise.resolve(imageItem?.getAsFile() ?? null);
  }
}
