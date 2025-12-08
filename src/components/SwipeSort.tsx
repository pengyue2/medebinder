import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import type { Photo } from "@/types/binder";
import type { Binder } from "@/types/binder";
import { Heart, Archive, FolderPlus, ArrowLeft, CheckCircle, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BinderPickerModal from "./BinderPickerModal";
import PhotoDetailView from "./PhotoDetailView";
import { useToast } from "@/hooks/use-toast";

interface SwipeSortProps {
  photos: Photo[];
  binders: Binder[];
  dailyGoal: number;
  onClose: (organizedPhotoIds?: string[], goalWasCompleted?: boolean) => void;
  onOrganizedCountChange?: (count: number) => void;
  onAddPhotoToBinder?: (binderId: string, photo: Photo) => void;
  onCreateBinder?: (name: string) => Binder;
}

const SWIPE_THRESHOLD = 100;
const ROTATION_RANGE = 15;

const SwipeSort = ({ photos, binders, dailyGoal, onClose, onOrganizedCountChange, onAddPhotoToBinder, onCreateBinder }: SwipeSortProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | "up" | null>(null);
  const [showBinderPicker, setShowBinderPicker] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<Photo | null>(null);
  const [organizedCount, setOrganizedCount] = useState(0);
  const [organizedPhotos, setOrganizedPhotos] = useState<Photo[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [postcardPhoto, setPostcardPhoto] = useState<Photo | null>(null);
  const { toast } = useToast();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform values for visual feedback
  const rotate = useTransform(x, [-200, 0, 200], [-ROTATION_RANGE, 0, ROTATION_RANGE]);
  const archiveOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const addOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const favoriteOpacity = useTransform(y, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const currentPhoto = photos[currentIndex];
  const remainingCount = photos.length - currentIndex;

  const trackOrganizedPhoto = useCallback((photo: Photo) => {
    const newCount = organizedCount + 1;
    const newOrganized = [...organizedPhotos, photo];
    setOrganizedCount(newCount);
    setOrganizedPhotos(newOrganized);
    
    // Notify parent of the new count
    onOrganizedCountChange?.(newCount);

    // Check if we hit the daily goal - show summary card
    if (newCount === dailyGoal && dailyGoal > 0) {
      setTimeout(() => {
        setShowSummary(true);
      }, 400);
    }
  }, [organizedCount, organizedPhotos, onOrganizedCountChange]);

  const handleCreatePostcard = useCallback(() => {
    setShowPhotoPicker(true);
  }, []);

  const handlePhotoSelect = useCallback((photo: Photo) => {
    setShowPhotoPicker(false);
    setPostcardPhoto(photo);
  }, []);

  const handleClosePostcard = useCallback(() => {
    setPostcardPhoto(null);
  }, []);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;

    // Check for swipe up (favorite)
    if (offset.y < -SWIPE_THRESHOLD || (velocity.y < -500 && offset.y < -50)) {
      setExitDirection("up");
      trackOrganizedPhoto(currentPhoto);
      toast({
        title: "Added to Favorites",
        description: "Photo marked as favorite ❤️",
      });
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setExitDirection(null);
      }, 300);
      return;
    }

    // Check for swipe left (archive)
    if (offset.x < -SWIPE_THRESHOLD || (velocity.x < -500 && offset.x < -50)) {
      setExitDirection("left");
      trackOrganizedPhoto(currentPhoto);
      toast({
        title: "Archived",
        description: "Photo hidden from daily stack",
      });
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setExitDirection(null);
      }, 300);
      return;
    }

    // Check for swipe right (add to binder)
    if (offset.x > SWIPE_THRESHOLD || (velocity.x > 500 && offset.x > 50)) {
      setPendingPhoto(currentPhoto);
      setShowBinderPicker(true);
      // Reset position
      x.set(0);
      y.set(0);
      return;
    }

    // Reset if no threshold met
    x.set(0);
    y.set(0);
  }, [currentPhoto, toast, x, y, trackOrganizedPhoto]);

  const handleBinderSelect = useCallback((binderId: string) => {
    const binder = binders.find((b) => b.id === binderId);
    setShowBinderPicker(false);
    setExitDirection("right");
    if (pendingPhoto) {
      trackOrganizedPhoto(pendingPhoto);
      onAddPhotoToBinder?.(binderId, pendingPhoto);
    }
    toast({
      title: `Added to ${binder?.title || "Binder"}`,
      description: "Photo organized successfully ✓",
    });
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setExitDirection(null);
      setPendingPhoto(null);
    }, 300);
  }, [binders, toast, pendingPhoto, trackOrganizedPhoto, onAddPhotoToBinder]);

  const handleBinderPickerClose = useCallback(() => {
    setShowBinderPicker(false);
    setPendingPhoto(null);
  }, []);

  // Summary Card - shown when 10 photos organized OR all photos sorted
  const showSummaryCard = showSummary || currentIndex >= photos.length;
  
  console.log("SwipeSort debug:", { 
    currentIndex, 
    photosLength: photos.length, 
    showSummary, 
    showSummaryCard,
    organizedCount,
    currentPhoto: !!currentPhoto 
  });

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 safe-area-top">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full glass"
          onClick={() => onClose(organizedPhotos.map(p => p.id), false)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Daily Stack</p>
          <p className="text-xs text-muted-foreground">{remainingCount} remaining</p>
        </div>
        
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Cards stack OR Summary Card */}
      <div className="absolute inset-0 flex items-center justify-center pt-20 pb-32">
        <AnimatePresence mode="sync">
          {showSummaryCard ? (
            // Summary Card
            showPhotoPicker ? (
              // Photo Picker Grid
              <motion.div
                key="photo-picker"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm mx-auto px-8"
              >
                <div className="glass-strong rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 text-center">
                    Select a photo for your postcard
                  </h3>
                  <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {organizedPhotos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => handlePhotoSelect(photo)}
                        className="aspect-square rounded-xl overflow-hidden ring-2 ring-transparent hover:ring-primary transition-all duration-200"
                      >
                        <img
                          src={photo.url}
                          alt={photo.alt}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowPhotoPicker(false)}
                    className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="summary"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm mx-auto px-8"
              >
                <div className="glass-strong rounded-3xl p-8 text-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
                  {/* Check Circle Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center"
                  >
                    <CheckCircle className="w-12 h-12 text-primary" />
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-foreground mb-2"
                  >
                    Daily Ritual Complete!
                  </motion.h2>

                  {/* Subtitle */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground mb-8"
                  >
                    You organized {organizedPhotos.length} memories.
                  </motion.p>

                  {/* Primary Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={handleCreatePostcard}
                      size="lg"
                      className="w-full rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold shadow-lg"
                    >
                      <Stamp className="w-5 h-5 mr-2" />
                      Create Today's Postcard
                    </Button>
                  </motion.div>

                  {/* Secondary Link */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={() => onClose(organizedPhotos.map(p => p.id), true)}
                    className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to Home
                  </motion.button>
                </div>
              </motion.div>
            )
          ) : currentPhoto ? (
            // Regular card stack
            <motion.div
              key="card-stack"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center px-8"
            >
              {/* Background cards (stack effect) */}
              {currentPhoto && photos.slice(currentIndex + 1, currentIndex + 3).map((photo, i) => (
                <div
                  key={photo.id}
                  className="absolute w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden"
                  style={{
                    transform: `scale(${1 - (i + 1) * 0.05}) translateY(${(i + 1) * 15}px)`,
                    zIndex: 10 - i,
                    opacity: 1 - (i + 1) * 0.3,
                  }}
                >
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              {/* Current card */}
              {currentPhoto && (
                <motion.div
                  key={currentPhoto.id}
                  className="absolute w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing z-20"
                  style={{ x, y, rotate }}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.9}
                  onDragEnd={handleDragEnd}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{
                    x: exitDirection === "left" ? -400 : exitDirection === "right" ? 400 : 0,
                    y: exitDirection === "up" ? -400 : 0,
                    opacity: 0,
                    transition: { duration: 0.3 },
                  }}
                >
                  <img
                    src={currentPhoto.url}
                    alt={currentPhoto.alt}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />

                  {/* Swipe indicators */}
                  <motion.div
                    className="absolute inset-0 bg-destructive/30 flex items-center justify-center"
                    style={{ opacity: archiveOpacity }}
                  >
                    <div className="glass-strong rounded-full p-4">
                      <Archive className="w-12 h-12 text-foreground" />
                    </div>
                  </motion.div>

                  <motion.div
                    className="absolute inset-0 bg-primary/30 flex items-center justify-center"
                    style={{ opacity: addOpacity }}
                  >
                    <div className="glass-strong rounded-full p-4">
                      <FolderPlus className="w-12 h-12 text-foreground" />
                    </div>
                  </motion.div>

                  <motion.div
                    className="absolute inset-0 bg-accent/30 flex items-center justify-center"
                    style={{ opacity: favoriteOpacity }}
                  >
                    <div className="glass-strong rounded-full p-4">
                      <Heart className="w-12 h-12 text-foreground fill-current" />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Bottom instructions - hide when showing summary */}
      {!showSummaryCard && (
        <div className="absolute bottom-8 left-0 right-0 z-20 safe-area-bottom">
          <div className="flex justify-center gap-8 px-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <Archive className="w-5 h-5 text-destructive" />
              </div>
              <span className="text-xs text-muted-foreground">Archive</span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-accent" />
              </div>
              <span className="text-xs text-muted-foreground">Favorite</span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Add</span>
            </div>
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            Swipe left to archive • Up to favorite • Right to add
          </p>
        </div>
      )}

      {/* Binder picker modal */}
      <AnimatePresence>
        {showBinderPicker && (
          <BinderPickerModal
            binders={binders}
            onSelect={handleBinderSelect}
            onClose={handleBinderPickerClose}
            onCreateBinder={onCreateBinder}
          />
        )}
      </AnimatePresence>


      {/* Postcard view */}
      <AnimatePresence>
        {postcardPhoto && (
          <PhotoDetailView
            photo={postcardPhoto}
            onClose={handleClosePostcard}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SwipeSort;
