import type { Photo } from "@/types/binder";
import { useState, useCallback } from "react";
import PhotoDetailView from "./PhotoDetailView";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoGridProps {
  photos: Photo[];
  selectionMode: boolean;
  selectedPhotos: Set<string>;
  onToggleSelection: (photoId: string) => void;
  onEnterSelectionMode: (photoId: string) => void;
}

const PhotoGrid = ({ 
  photos, 
  selectionMode, 
  selectedPhotos, 
  onToggleSelection,
  onEnterSelectionMode 
}: PhotoGridProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

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
    }
  };

  return (
    <>
      {/* True CSS Masonry using columns */}
      <div className="columns-2 gap-2 p-3">
        {photos.map((photo, index) => {
          const isSelected = selectedPhotos.has(photo.id);
          
          return (
            <button
              key={photo.id}
              onClick={() => handleClick(photo)}
              onPointerDown={() => handlePointerDown(photo)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className={cn(
                "relative w-full overflow-hidden rounded-xl group cursor-pointer mb-2",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                "transition-all duration-300 break-inside-avoid",
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[0.97]"
              )}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
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
          );
        })}
      </div>
      
      {/* Photo Detail View */}
      {selectedPhoto && !selectionMode && (
        <PhotoDetailView
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
};

export default PhotoGrid;
