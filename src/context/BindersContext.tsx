import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { mockBinders } from "@/data/mockBinders";
import type { Binder, Photo } from "@/types/binder";

interface BindersContextType {
  binders: Binder[];
  filteredBinders: Binder[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createBinder: (name: string) => Binder;
  deleteBinder: (id: string) => void;
  addPhotoToBinder: (binderId: string, photo: Photo) => void;
  getBinderById: (id: string) => Binder | undefined;
  totalCount: number;
}

const BindersContext = createContext<BindersContextType | null>(null);

export function BindersProvider({ children }: { children: ReactNode }) {
  const [binders, setBinders] = useState<Binder[]>(mockBinders);
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
      addPhotoToBinder,
      getBinderById,
      totalCount: binders.length,
    }),
    [binders, filteredBinders, searchQuery, createBinder, deleteBinder, addPhotoToBinder, getBinderById]
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
