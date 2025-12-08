import { useState, useCallback } from "react";

export interface UnsortedPhoto {
  id: string;
  url: string;
  file: File;
  addedAt: Date;
}

export function useUnsortedPhotos() {
  const [unsortedPhotos, setUnsortedPhotos] = useState<UnsortedPhoto[]>([]);

  const addPhotos = useCallback((files: FileList) => {
    const newPhotos: UnsortedPhoto[] = Array.from(files).map((file) => ({
      id: `unsorted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file),
      file,
      addedAt: new Date(),
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
    clearAll,
    count: unsortedPhotos.length,
  };
}
