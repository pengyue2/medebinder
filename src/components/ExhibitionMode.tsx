import { useState, useEffect, useCallback, useRef } from "react";
import type { Photo } from "@/types/binder";
import { X, Heart, Pause, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExhibitionModeProps {
  photos: Photo[];
  onClose: () => void;
}

interface CollagePhoto {
  photo: Photo;
  size: "hero" | "medium" | "small";
  position: { x: number; y: number };
  rotation: number;
}

// Layout templates for 2-3 photos
const generateCollageLayout = (count: number): CollagePhoto["size"][] => {
  if (count === 2) {
    // Two photos: one hero, one medium OR two mediums
    return Math.random() > 0.5 ? ["hero", "medium"] : ["medium", "medium"];
  }
  // Three photos: one hero, two smaller
  return ["hero", "small", "small"];
};

// Generate random position avoiding overlap
const generatePositions = (count: number): { x: number; y: number; rotation: number }[] => {
  const positions: { x: number; y: number; rotation: number }[] = [];
  
  if (count === 2) {
    // Two photos layout
    const layout = Math.floor(Math.random() * 3);
    if (layout === 0) {
      // Side by side
      positions.push({ x: 15 + Math.random() * 10, y: 20 + Math.random() * 20, rotation: -5 + Math.random() * 10 });
      positions.push({ x: 55 + Math.random() * 10, y: 25 + Math.random() * 20, rotation: -5 + Math.random() * 10 });
    } else if (layout === 1) {
      // Diagonal
      positions.push({ x: 10 + Math.random() * 15, y: 10 + Math.random() * 15, rotation: -8 + Math.random() * 6 });
      positions.push({ x: 50 + Math.random() * 15, y: 40 + Math.random() * 15, rotation: -3 + Math.random() * 10 });
    } else {
      // Stacked offset
      positions.push({ x: 20 + Math.random() * 20, y: 15 + Math.random() * 10, rotation: -6 + Math.random() * 12 });
      positions.push({ x: 35 + Math.random() * 20, y: 45 + Math.random() * 10, rotation: -6 + Math.random() * 12 });
    }
  } else {
    // Three photos layout
    const layout = Math.floor(Math.random() * 2);
    if (layout === 0) {
      // Hero left, two small right
      positions.push({ x: 5 + Math.random() * 10, y: 15 + Math.random() * 15, rotation: -4 + Math.random() * 8 });
      positions.push({ x: 55 + Math.random() * 10, y: 10 + Math.random() * 10, rotation: -6 + Math.random() * 12 });
      positions.push({ x: 60 + Math.random() * 10, y: 50 + Math.random() * 10, rotation: -6 + Math.random() * 12 });
    } else {
      // Hero center, two corners
      positions.push({ x: 25 + Math.random() * 15, y: 20 + Math.random() * 15, rotation: -3 + Math.random() * 6 });
      positions.push({ x: 5 + Math.random() * 10, y: 55 + Math.random() * 10, rotation: -8 + Math.random() * 16 });
      positions.push({ x: 65 + Math.random() * 10, y: 5 + Math.random() * 10, rotation: -8 + Math.random() * 16 });
    }
  }
  
  return positions;
};

const SCENE_DURATION = 5000; // 5 seconds per scene
const FADE_OUT_DURATION = 1000; // 1 second fade out
const BLACK_PAUSE = 500; // 0.5 second black
const FADE_IN_DURATION = 1000; // 1 second fade in

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const ExhibitionMode = ({ photos, onClose }: ExhibitionModeProps) => {
  // Shuffled queue of photo indices
  const [shuffledQueue, setShuffledQueue] = useState<number[]>(() => 
    shuffleArray(photos.map((_, i) => i))
  );
  const [queueIndex, setQueueIndex] = useState(0);
  
  // Current scene photos (2-3 photos)
  const [currentScene, setCurrentScene] = useState<CollagePhoto[]>([]);
  const [sceneOpacity, setSceneOpacity] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"monitor" | "mobile">("monitor");
  
  const sceneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get next N unique photos from queue
  const getNextScenePhotos = useCallback((startIndex: number, queue: number[]): { photos: CollagePhoto[]; nextIndex: number; newQueue: number[] } => {
    const count = photos.length >= 3 ? (Math.random() > 0.4 ? 3 : 2) : Math.min(2, photos.length);
    const scenePhotos: CollagePhoto[] = [];
    const sizes = generateCollageLayout(count);
    const positions = generatePositions(count);
    
    let currentIndex = startIndex;
    let currentQueue = queue;
    
    for (let i = 0; i < count; i++) {
      // Check if we need to reshuffle
      if (currentIndex >= currentQueue.length) {
        currentQueue = shuffleArray(photos.map((_, idx) => idx));
        currentIndex = 0;
      }
      
      const photoIndex = currentQueue[currentIndex];
      scenePhotos.push({
        photo: photos[photoIndex],
        size: sizes[i],
        position: { x: positions[i].x, y: positions[i].y },
        rotation: positions[i].rotation,
      });
      currentIndex++;
    }
    
    return { photos: scenePhotos, nextIndex: currentIndex, newQueue: currentQueue };
  }, [photos]);

  // Initialize first scene
  useEffect(() => {
    const { photos: initialPhotos, nextIndex, newQueue } = getNextScenePhotos(0, shuffledQueue);
    setCurrentScene(initialPhotos);
    setQueueIndex(nextIndex);
    setShuffledQueue(newQueue);
    
    // Fade in after mount
    setTimeout(() => {
      setSceneOpacity(1);
    }, 100);
  }, []); // Only run once on mount

  // Entry animation
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => setIsEntering(false), 500);
    
    return () => {
      document.body.style.overflow = "";
      clearTimeout(timer);
      if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Slideshow logic
  useEffect(() => {
    if (isPaused || photos.length <= 1) return;

    const runScene = () => {
      // Wait for scene duration
      sceneTimerRef.current = setTimeout(() => {
        // Fade out current scene
        setSceneOpacity(0);
        
        // After fade out, wait in black, then load new scene
        transitionTimerRef.current = setTimeout(() => {
          const { photos: nextPhotos, nextIndex, newQueue } = getNextScenePhotos(queueIndex, shuffledQueue);
          setCurrentScene(nextPhotos);
          setQueueIndex(nextIndex);
          setShuffledQueue(newQueue);
          
          // After black pause, fade in new scene
          setTimeout(() => {
            setSceneOpacity(1);
          }, BLACK_PAUSE);
        }, FADE_OUT_DURATION);
      }, SCENE_DURATION);
    };

    runScene();

    return () => {
      if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, [isPaused, photos.length, queueIndex, shuffledQueue, getNextScenePhotos]);

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
    if (currentScene.length > 0) {
      const photoId = currentScene[0].photo.id;
      setFavorites(prev => {
        const newSet = new Set(prev);
        if (newSet.has(photoId)) {
          newSet.delete(photoId);
        } else {
          newSet.add(photoId);
        }
        return newSet;
      });
    }
  }, [currentScene]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  const toggleViewMode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setViewMode(prev => prev === "monitor" ? "mobile" : "monitor");
  }, []);

  const isFavorited = currentScene.length > 0 && favorites.has(currentScene[0].photo.id);

  // Size classes for collage photos
  const getSizeStyles = (size: CollagePhoto["size"], viewMode: string) => {
    const base = viewMode === "mobile" ? {
      hero: "w-[55%] max-h-[45%]",
      medium: "w-[45%] max-h-[40%]",
      small: "w-[35%] max-h-[30%]",
    } : {
      hero: "w-[45%] max-h-[55%]",
      medium: "w-[35%] max-h-[45%]",
      small: "w-[25%] max-h-[35%]",
    };
    return base[size];
  };

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
        {/* Collage Scene */}
        <div 
          className="absolute inset-0 transition-opacity"
          style={{ 
            opacity: sceneOpacity,
            transitionDuration: sceneOpacity === 1 ? `${FADE_IN_DURATION}ms` : `${FADE_OUT_DURATION}ms`,
          }}
        >
          {currentScene.map((item, index) => (
            <div
              key={`${item.photo.id}-${index}`}
              className={cn(
                "absolute transition-all duration-1000",
                getSizeStyles(item.size, viewMode)
              )}
              style={{
                left: `${item.position.x}%`,
                top: `${item.position.y}%`,
                transform: `rotate(${item.rotation}deg)`,
                zIndex: item.size === "hero" ? 10 : 5,
              }}
            >
              <div className="relative w-full h-full shadow-2xl rounded-lg overflow-hidden bg-neutral-900">
                <img
                  src={item.photo.url}
                  alt={item.photo.alt}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-20" />

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
              
              {/* Scene info */}
              <div className="text-center min-w-[80px]">
                <p className="text-sm text-muted-foreground">Tap to resume</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {currentScene.length} photos
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
            key={queueIndex}
            className={cn(
              "h-full bg-primary transition-all ease-linear",
              isPaused && "transition-none"
            )}
            style={{
              width: isPaused ? "0%" : "100%",
              transitionDuration: isPaused ? "0ms" : `${SCENE_DURATION}ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ExhibitionMode;
