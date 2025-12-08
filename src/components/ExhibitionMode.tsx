import { useState, useEffect, useCallback } from "react";
import type { Photo } from "@/types/binder";
import { X, Heart, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExhibitionModeProps {
  photos: Photo[];
  onClose: () => void;
}

// Ken Burns effect variations - each photo gets a random effect
const kenBurnsEffects = [
  { from: "scale-100 translate-x-0 translate-y-0", to: "scale-110 -translate-x-4 -translate-y-2" },
  { from: "scale-110 translate-x-4 translate-y-2", to: "scale-100 translate-x-0 translate-y-0" },
  { from: "scale-100 -translate-x-2 translate-y-2", to: "scale-115 translate-x-2 -translate-y-4" },
  { from: "scale-115 translate-x-0 -translate-y-4", to: "scale-105 -translate-x-4 translate-y-0" },
  { from: "scale-105 translate-x-2 translate-y-4", to: "scale-120 -translate-x-2 -translate-y-2" },
];

const SLIDE_DURATION = 6000; // 6 seconds per photo
const CROSSFADE_DURATION = 1500; // 1.5 seconds crossfade

const ExhibitionMode = ({ photos, onClose }: ExhibitionModeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Entry animation
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => setIsEntering(false), 500);
    
    return () => {
      document.body.style.overflow = "";
      clearTimeout(timer);
    };
  }, []);

  // Slideshow logic
  useEffect(() => {
    if (isPaused || photos.length <= 1) return;

    const slideTimer = setInterval(() => {
      setIsTransitioning(true);
      
      // After crossfade completes, update indices
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % photos.length);
        setNextIndex(prev => (prev + 1) % photos.length);
        setIsTransitioning(false);
      }, CROSSFADE_DURATION);
      
    }, SLIDE_DURATION);

    return () => clearInterval(slideTimer);
  }, [isPaused, photos.length]);

  const handleScreenTap = useCallback(() => {
    if (showUI) {
      setShowUI(false);
      setIsPaused(false);
    } else {
      setShowUI(true);
      setIsPaused(true);
    }
  }, [showUI]);

  const toggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const photoId = photos[currentIndex].id;
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, [currentIndex, photos]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  const currentPhoto = photos[currentIndex];
  const nextPhoto = photos[nextIndex % photos.length];
  const currentEffect = kenBurnsEffects[currentIndex % kenBurnsEffects.length];
  const nextEffect = kenBurnsEffects[nextIndex % kenBurnsEffects.length];
  const isFavorited = favorites.has(currentPhoto.id);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] bg-black transition-opacity duration-500",
        isEntering ? "opacity-0" : "opacity-100"
      )}
      onClick={handleScreenTap}
    >
      {/* Current Photo with Ken Burns */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
        style={{ transitionDuration: `${CROSSFADE_DURATION}ms` }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.alt}
            className={cn(
              "w-full h-full object-cover transition-transform ease-out",
              isPaused ? currentEffect.from : currentEffect.to
            )}
            style={{ 
              transitionDuration: isPaused ? "0ms" : `${SLIDE_DURATION}ms`,
            }}
          />
        </div>
      </div>

      {/* Next Photo (for crossfade) with Ken Burns */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity",
          isTransitioning ? "opacity-100" : "opacity-0"
        )}
        style={{ transitionDuration: `${CROSSFADE_DURATION}ms` }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={nextPhoto.url}
            alt={nextPhoto.alt}
            className={cn(
              "w-full h-full object-cover transition-transform ease-out",
              nextEffect.from
            )}
            style={{ 
              transitionDuration: `${SLIDE_DURATION}ms`,
            }}
          />
        </div>
      </div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* UI Overlay */}
      <div 
        className={cn(
          "absolute inset-0 flex flex-col justify-between transition-opacity duration-300",
          showUI ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Top gradient */}
        <div className="h-32 bg-gradient-to-b from-black/60 to-transparent" />
        
        {/* Center pause indicator */}
        <div className="flex-1 flex items-center justify-center">
          <div className="glass rounded-full p-4 animate-pulse">
            <Pause className="w-8 h-8 text-foreground" />
          </div>
        </div>
        
        {/* Bottom controls */}
        <div className="bg-gradient-to-t from-black/80 to-transparent pt-16 pb-8 px-6 safe-area-bottom">
          <div className="flex items-center justify-center gap-8">
            {/* Favorite button */}
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleFavorite}
              className={cn(
                "rounded-full h-14 w-14 transition-all duration-300",
                isFavorited 
                  ? "text-red-500 hover:text-red-400" 
                  : "text-foreground hover:text-foreground"
              )}
            >
              <Heart 
                className={cn(
                  "w-7 h-7 transition-transform",
                  isFavorited && "fill-current scale-110"
                )} 
              />
            </Button>
            
            {/* Play/Resume hint */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Tap to resume</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="lg"
              onClick={handleClose}
              className="rounded-full h-14 w-14 text-foreground hover:text-foreground"
            >
              <X className="w-7 h-7" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 safe-area-bottom">
        <div 
          className={cn(
            "h-full bg-primary transition-all ease-linear",
            isPaused && "transition-none"
          )}
          style={{
            width: isPaused ? "0%" : "100%",
            transitionDuration: isPaused ? "0ms" : `${SLIDE_DURATION}ms`,
          }}
        />
      </div>
    </div>
  );
};

export default ExhibitionMode;
