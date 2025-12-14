import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import type { Binder, Photo } from "@/types/binder";

const STORAGE_KEY_BINDERS = "app_binders";

const POSTCARDS_BINDER_ID = "binder-my-postcards";
const POSTCARDS_BINDER_TITLE = "My Postcards";

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
  toggleBinderFavorite: (id: string) => void;
  togglePhotoFavorite: (binderId: string, photoId: string) => void;
  savePostcardToGallery: (postcardDataUrl: string) => void;
  totalCount: number;
}

const BindersContext = createContext<BindersContextType | null>(null);

export function BindersProvider({ children }: { children: ReactNode }) {
  const [binders, setBinders] = useState<Binder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BINDERS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load binders:", e);
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Persist binders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BINDERS, JSON.stringify(binders));
    } catch (e) {
      console.error("Failed to save binders:", e);
    }
  }, [binders]);

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

  const toggleBinderFavorite = useCallback((id: string) => {
    setBinders((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b))
    );
  }, []);

  const togglePhotoFavorite = useCallback((binderId: string, photoId: string) => {
    setBinders((prev) =>
      prev.map((binder) => {
        if (binder.id !== binderId) return binder;
        return {
          ...binder,
          photos: binder.photos.map((p) =>
            p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        };
      })
    );
  }, []);

  // Save postcard image to the "My Postcards" binder
  const savePostcardToGallery = useCallback((postcardDataUrl: string) => {
    setBinders((prev) => {
      // Check if "My Postcards" binder exists
      let postcardsBinder = prev.find((b) => b.id === POSTCARDS_BINDER_ID);
      
      const newPhoto: Photo = {
        id: `postcard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: postcardDataUrl,
        alt: "Postcard",
        createdAt: Date.now(),
      };

      if (postcardsBinder) {
        // Add photo to existing "My Postcards" binder
        return prev.map((binder) => {
          if (binder.id !== POSTCARDS_BINDER_ID) return binder;
          const updatedPhotos = [newPhoto, ...binder.photos];
          return {
            ...binder,
            photos: updatedPhotos,
            photoCount: updatedPhotos.length,
            coverImage: newPhoto.url,
          };
        });
      } else {
        // Create "My Postcards" binder with this photo
        const newBinder: Binder = {
          id: POSTCARDS_BINDER_ID,
          title: POSTCARDS_BINDER_TITLE,
          coverImage: newPhoto.url,
          photoCount: 1,
          photos: [newPhoto],
        };
        return [newBinder, ...prev];
      }
    });
  }, []);

  // Sort binders: favorites first, then by creation order
  const sortedBinders = useMemo(() => {
    return [...binders].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });
  }, [binders]);

  const filteredBinders = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedBinders;
    }
    const query = searchQuery.toLowerCase().trim();
    return sortedBinders.filter((binder) =>
      binder.title.toLowerCase().includes(query)
    );
  }, [sortedBinders, searchQuery]);

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
      toggleBinderFavorite,
      togglePhotoFavorite,
      savePostcardToGallery,
      totalCount: binders.length,
    }),
    [binders, filteredBinders, searchQuery, createBinder, deleteBinder, renameBinder, addPhotoToBinder, removePhotosFromBinder, movePhotos, getBinderById, toggleBinderFavorite, togglePhotoFavorite, savePostcardToGallery]
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
