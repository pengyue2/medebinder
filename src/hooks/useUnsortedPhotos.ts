import { useState, useCallback } from "react";
import type { Photo } from "@/types/binder";

export function useUnsortedPhotos() {
  const [unsortedPhotos, setUnsortedPhotos] = useState<Photo[]>([]);

  const addPhotos = useCallback((files: FileList) => {
    const newPhotos: Photo[] = Array.from(files).map((file) => ({
      id: `unsorted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file),
      alt: file.name,
    }));

    setUnsortedPhotos((prev) => [...prev, ...newPhotos]);
    return newPhotos.length;
  }, []);

  const removePhoto = useCallback((id: string) => {
    setUnsortedPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.url);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const removePhotos = useCallback((ids: string[]) => {
    setUnsortedPhotos((prev) => {
      const idsSet = new Set(ids);
      prev.forEach((photo) => {
        if (idsSet.has(photo.id)) {
          URL.revokeObjectURL(photo.url);
        }
      });
      return prev.filter((p) => !idsSet.has(p.id));
    });
  }, []);

  const clearAll = useCallback(() => {
    unsortedPhotos.forEach((photo) => {
      URL.revokeObjectURL(photo.url);
    });
    setUnsortedPhotos([]);
  }, [unsortedPhotos]);

  return {
    unsortedPhotos,
    addPhotos,
    removePhoto,
    removePhotos,
    clearAll,
    count: unsortedPhotos.length,
  };
}
