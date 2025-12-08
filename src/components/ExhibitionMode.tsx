import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Photo } from "@/types/binder";
import { X, Heart, Pause, Smartphone, Monitor } from "lucide-react";
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

// Alignment options for random positioning
const verticalAlignments = ["items-start", "items-center", "items-end"] as const;
const horizontalAlignments = ["justify-start", "justify-center", "justify-end"] as const;

const SLIDE_DURATION = 6000;
const CROSSFADE_DURATION = 1500;

// Generate random alignment for each slide
const getRandomAlignment = () => ({
  vertical: verticalAlignments[Math.floor(Math.random() * verticalAlignments.length)],
  horizontal: horizontalAlignments[Math.floor(Math.random() * horizontalAlignments.length)],
});

const ExhibitionMode = ({ photos, onClose }: ExhibitionModeProps) => {
  const [displayIndex, setDisplayIndex] = useState(0);
  const [activeLayer, setActiveLayer] = useState<"A" | "B">("A");
  const [layerAIndex, setLayerAIndex] = useState(0);
  const [layerBIndex, setLayerBIndex] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [kenBurnsActive, setKenBurnsActive] = useState(true);
  const [viewMode, setViewMode] = useState<"monitor" | "mobile">("monitor");
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-generate random alignments for each photo
  const [alignments, setAlignments] = useState<{ vertical: string; horizontal: string }[]>(() =>
    photos.map(() => getRandomAlignment())
  );

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
      setActiveLayer(prev => prev === "A" ? "B" : "A");
      setDisplayIndex(prev => (prev + 1) % photos.length);
      
      // Generate new random alignment for the next-next photo
      setAlignments(prev => {
        const newAlignments = [...prev];
        const nextNextIndex = (displayIndex + 2) % photos.length;
        newAlignments[nextNextIndex] = getRandomAlignment();
        return newAlignments;
      });
      
      setKenBurnsActive(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setKenBurnsActive(true);
        });
      });
      
      transitionTimeoutRef.current = setTimeout(() => {
        setLayerAIndex(prev => {
          if (activeLayer === "A") {
            return (prev + 2) % photos.length;
          }
          return prev;
        });
        setLayerBIndex(prev => {
          if (activeLayer === "B") {
            return (prev + 2) % photos.length;
          }
          return prev;
        });
      }, CROSSFADE_DURATION);
      
    }, SLIDE_DURATION);

    return () => {
      clearInterval(slideTimer);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [isPaused, photos.length, activeLayer, displayIndex]);

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
    const photoId = photos[displayIndex].id;
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, [displayIndex, photos]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  const toggleViewMode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setViewMode(prev => prev === "monitor" ? "mobile" : "monitor");
  }, []);

  const photoA = photos[layerAIndex % photos.length];
  const photoB = photos[layerBIndex % photos.length];
  const effectA = kenBurnsEffects[layerAIndex % kenBurnsEffects.length];
  const effectB = kenBurnsEffects[layerBIndex % kenBurnsEffects.length];
  const currentPhoto = photos[displayIndex];
  const isFavorited = favorites.has(currentPhoto.id);

  const isLayerAActive = activeLayer === "A";
  const alignmentA = alignments[layerAIndex % photos.length];
  const alignmentB = alignments[layerBIndex % photos.length];

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] transition-opacity duration-500 flex items-center justify-center",
        isEntering ? "opacity-0" : "opacity-100"
      )}
      style={{ backgroundColor: "#000000" }}
      onClick={handleScreenTap}
    >
      {/* Container for view mode */}
      <div 
        className={cn(
          "relative overflow-hidden transition-all duration-500",
          viewMode === "mobile" 
            ? "w-[375px] h-full max-h-[812px] rounded-3xl border-4 border-neutral-800" 
            : "w-full h-full"
        )}
        style={{ backgroundColor: "#000000" }}
      >
        {/* Layer A */}
        <div 
          className={cn(
            "absolute inset-0 transition-opacity flex p-8",
            alignmentA?.vertical || "items-center",
            alignmentA?.horizontal || "justify-center",
            isLayerAActive ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
          style={{ transitionDuration: `${CROSSFADE_DURATION}ms` }}
        >
          <div className={cn(
            "max-w-full max-h-full overflow-hidden",
            viewMode === "mobile" ? "max-w-[90%] max-h-[80%]" : "max-w-[85%] max-h-[85%]"
          )}>
            <img
              src={photoA.url}
              alt={photoA.alt}
              className={cn(
                "max-w-full max-h-full object-contain transition-transform ease-out",
                isPaused ? effectA.from : (isLayerAActive && kenBurnsActive ? effectA.to : effectA.from)
              )}
              style={{ 
                transitionDuration: isPaused ? "0ms" : `${SLIDE_DURATION}ms`,
              }}
            />
          </div>
        </div>

        {/* Layer B */}
        <div 
          className={cn(
            "absolute inset-0 transition-opacity flex p-8",
            alignmentB?.vertical || "items-center",
            alignmentB?.horizontal || "justify-center",
            !isLayerAActive ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
          style={{ transitionDuration: `${CROSSFADE_DURATION}ms` }}
        >
          <div className={cn(
            "max-w-full max-h-full overflow-hidden",
            viewMode === "mobile" ? "max-w-[90%] max-h-[80%]" : "max-w-[85%] max-h-[85%]"
          )}>
            <img
              src={photoB.url}
              alt={photoB.alt}
              className={cn(
                "max-w-full max-h-full object-contain transition-transform ease-out",
                isPaused ? effectB.from : (!isLayerAActive && kenBurnsActive ? effectB.to : effectB.from)
              )}
              style={{ 
                transitionDuration: isPaused ? "0ms" : `${SLIDE_DURATION}ms`,
              }}
            />
          </div>
        </div>

        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] z-20" />

        {/* UI Overlay */}
        <div 
          className={cn(
            "absolute inset-0 flex flex-col justify-between transition-opacity duration-300 z-30",
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
            <div className="flex items-center justify-center gap-6">
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
              
              {/* View mode toggle */}
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleViewMode}
                className="rounded-full h-14 w-14 text-foreground hover:text-foreground"
              >
                {viewMode === "monitor" ? (
                  <Smartphone className="w-6 h-6" />
                ) : (
                  <Monitor className="w-6 h-6" />
                )}
              </Button>
              
              {/* Play/Resume hint */}
              <div className="text-center min-w-[80px]">
                <p className="text-sm text-muted-foreground">Tap to resume</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {displayIndex + 1} / {photos.length}
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
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 safe-area-bottom z-30">
          <div 
            key={displayIndex}
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
    </div>
  );
};

export default ExhibitionMode;
