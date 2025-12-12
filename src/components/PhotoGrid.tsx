import type { Photo } from "@/types/binder";
import { useState, useCallback, useMemo } from "react";
import PhotoDetailView from "./PhotoDetailView";
import { Check, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

interface PhotoGridProps {
  photos: Photo[];
  binderId?: string;
  selectionMode: boolean;
  selectedPhotos: Set<string>;
  onToggleSelection: (photoId: string) => void;
  onEnterSelectionMode: (photoId: string) => void;
  onPhotoDetailOpen?: (isOpen: boolean) => void;
  onToggleFavorite?: (photoId: string) => void;
}

const PhotoGrid = ({ 
  photos,
  binderId,
  selectionMode, 
  selectedPhotos, 
  onToggleSelection,
  onEnterSelectionMode,
  onPhotoDetailOpen,
  onToggleFavorite
}: PhotoGridProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Sort photos: favorites first, then by createdAt descending
  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      // If both have same favorite status, sort by createdAt descending
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      return bTime - aTime;
    });
  }, [photos]);

  const handlePointerDown = useCallback((photo: Photo) => {
    const timer = setTimeout(() => {
      onEnterSelectionMode(photo.id);
    }, 500);
    setLongPressTimer(timer);
  }, [onEnterSelectionMode]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleClick = (photo: Photo) => {
    if (selectionMode) {
      onToggleSelection(photo.id);
    } else {
      setSelectedPhoto(photo);
      onPhotoDetailOpen?.(true);
    }
  };

  const handleCloseDetail = () => {
    setSelectedPhoto(null);
    onPhotoDetailOpen?.(false);
  };

  const handleFavoriteClick = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    onToggleFavorite?.(photoId);
  };

  return (
    <>
      {/* True CSS Masonry using columns with LayoutGroup for animations */}
      <LayoutGroup>
        <div className="columns-2 gap-2 p-3">
          <AnimatePresence mode="popLayout">
            {sortedPhotos.map((photo, index) => {
              const isSelected = selectedPhotos.has(photo.id);
              
              return (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    layout: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 }
                  }}
                  className="mb-2 break-inside-avoid"
                >
                  <button
                    onClick={() => handleClick(photo)}
                    onPointerDown={() => handlePointerDown(photo)}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className={cn(
                      "relative w-full overflow-hidden rounded-xl group cursor-pointer",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                      "transition-all duration-300",
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[0.97]"
                    )}
                  >
                    <img
                      src={photo.url}
                      alt={photo.alt}
                      className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
                      draggable={false}
                    />
                    
                    {/* Hover overlay */}
                    <div className={cn(
                      "absolute inset-0 transition-colors duration-200",
                      selectionMode ? "bg-background/10" : "bg-background/0 group-hover:bg-background/20"
                    )} />
                    
                    {/* Favorite heart button - shown on hover when not in selection mode */}
                    {!selectionMode && onToggleFavorite && (
                      <button
                        onClick={(e) => handleFavoriteClick(e, photo.id)}
                        className={cn(
                          "absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center",
                          "bg-background/60 backdrop-blur-sm transition-all duration-200",
                          "opacity-0 group-hover:opacity-100",
                          photo.isFavorite && "opacity-100 bg-primary/20"
                        )}
                      >
                        <Heart
                          className={cn(
                            "w-4 h-4 transition-colors duration-200",
                            photo.isFavorite
                              ? "fill-primary text-primary"
                              : "text-foreground/70 hover:text-primary"
                          )}
                        />
                      </button>
                    )}
                    
                    {/* Selection indicator */}
                    {selectionMode && (
                      <div className={cn(
                        "absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                        isSelected 
                          ? "bg-primary border-primary" 
                          : "bg-background/50 border-foreground/50 backdrop-blur-sm"
                      )}>
                        {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </LayoutGroup>
      
      {/* Photo Detail View */}
      {selectedPhoto && !selectionMode && (
        <PhotoDetailView
          photo={selectedPhoto}
          onClose={handleCloseDetail}
          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(selectedPhoto.id) : undefined}
        />
      )}
    </>
  );
};

export default PhotoGrid;