import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { Binder, Photo } from "@/types/binder";

interface BindersContextType {
  binders: Binder[];
  filteredBinders: Binder[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createBinder: (name: string) => Binder;
  deleteBinder: (id: string) => void;
  renameBinder: (id: string, newName: string) => void;
  addPhotoToBinder: (binderId: string, photo: Photo) => void;
  removePhotosFromBinder: (binderId: string, photoIds: string[]) => void;
  movePhotos: (fromBinderId: string, toBinderId: string, photoIds: string[]) => void;
  getBinderById: (id: string) => Binder | undefined;
  totalCount: number;
}

const BindersContext = createContext<BindersContextType | null>(null);

export function BindersProvider({ children }: { children: ReactNode }) {
  const [binders, setBinders] = useState<Binder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const createBinder = useCallback((name: string) => {
    const newBinder: Binder = {
      id: `binder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: name.trim(),
      coverImage: "",
      photoCount: 0,
      photos: [],
    };
    setBinders((prev) => [newBinder, ...prev]);
    return newBinder;
  }, []);

  const deleteBinder = useCallback((id: string) => {
    setBinders((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const renameBinder = useCallback((id: string, newName: string) => {
    setBinders((prev) =>
      prev.map((b) => (b.id === id ? { ...b, title: newName.trim() } : b))
    );
  }, []);

  const addPhotoToBinder = useCallback((binderId: string, photo: Photo) => {
    setBinders((prev) =>
      prev.map((binder) => {
        if (binder.id !== binderId) return binder;
        const updatedPhotos = [photo, ...binder.photos];
        return {
          ...binder,
          photos: updatedPhotos,
          photoCount: updatedPhotos.length,
          coverImage: photo.url, // Most recent photo becomes cover
        };
      })
    );
  }, []);

  const removePhotosFromBinder = useCallback((binderId: string, photoIds: string[]) => {
    setBinders((prev) =>
      prev.map((binder) => {
        if (binder.id !== binderId) return binder;
        const updatedPhotos = binder.photos.filter((p) => !photoIds.includes(p.id));
        return {
          ...binder,
          photos: updatedPhotos,
          photoCount: updatedPhotos.length,
          coverImage: updatedPhotos[0]?.url || "",
        };
      })
    );
  }, []);

  const movePhotos = useCallback((fromBinderId: string, toBinderId: string, photoIds: string[]) => {
    setBinders((prev) => {
      const fromBinder = prev.find((b) => b.id === fromBinderId);
      if (!fromBinder) return prev;

      const photosToMove = fromBinder.photos.filter((p) => photoIds.includes(p.id));
      if (photosToMove.length === 0) return prev;

      return prev.map((binder) => {
        if (binder.id === fromBinderId) {
          const updatedPhotos = binder.photos.filter((p) => !photoIds.includes(p.id));
          return {
            ...binder,
            photos: updatedPhotos,
            photoCount: updatedPhotos.length,
            coverImage: updatedPhotos[0]?.url || "",
          };
        }
        if (binder.id === toBinderId) {
          const updatedPhotos = [...photosToMove, ...binder.photos];
          return {
            ...binder,
            photos: updatedPhotos,
            photoCount: updatedPhotos.length,
            coverImage: photosToMove[0]?.url || binder.coverImage,
          };
        }
        return binder;
      });
    });
  }, []);

  const getBinderById = useCallback(
    (id: string) => binders.find((b) => b.id === id),
    [binders]
  );

  const filteredBinders = useMemo(() => {
    if (!searchQuery.trim()) {
      return binders;
    }
    const query = searchQuery.toLowerCase().trim();
    return binders.filter((binder) =>
      binder.title.toLowerCase().includes(query)
    );
  }, [binders, searchQuery]);

  const value = useMemo(
    () => ({
      binders,
      filteredBinders,
      searchQuery,
      setSearchQuery,
      createBinder,
      deleteBinder,
      renameBinder,
      addPhotoToBinder,
      removePhotosFromBinder,
      movePhotos,
      getBinderById,
      totalCount: binders.length,
    }),
    [binders, filteredBinders, searchQuery, createBinder, deleteBinder, renameBinder, addPhotoToBinder, removePhotosFromBinder, movePhotos, getBinderById]
  );

  return (
    <BindersContext.Provider value={value}>{children}</BindersContext.Provider>
  );
}

export function useBinders() {
  const context = useContext(BindersContext);
  if (!context) {
    throw new Error("useBinders must be used within a BindersProvider");
  }
  return context;
}
