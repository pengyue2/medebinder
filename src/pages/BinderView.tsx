import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical, Play, X, Trash2, FolderInput, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhotoGrid from "@/components/PhotoGrid";
import ExhibitionMode from "@/components/ExhibitionMode";
import BinderPickerModal from "@/components/BinderPickerModal";
import { useBinders } from "@/context/BindersContext";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const BinderView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBinderById, binders, removePhotosFromBinder, movePhotos, createBinder } = useBinders();
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showExhibition, setShowExhibition] = useState(false);
  const [isPhotoDetailOpen, setIsPhotoDetailOpen] = useState(false);
  const [showBinderPicker, setShowBinderPicker] = useState(false);
  
  const binder = getBinderById(id || "");

  const handleToggleSelection = useCallback((photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, []);

  const handleEnterSelectionMode = useCallback((photoId: string) => {
    setSelectionMode(true);
    setSelectedPhotos(new Set([photoId]));
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedPhotos(new Set());
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!id || selectedPhotos.size === 0) return;
    removePhotosFromBinder(id, Array.from(selectedPhotos));
    toast.success(`Deleted ${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''}`);
    handleExitSelectionMode();
  }, [id, selectedPhotos, removePhotosFromBinder, handleExitSelectionMode]);

  const handleMoveSelected = useCallback((targetBinderId: string) => {
    if (!id || selectedPhotos.size === 0) return;
    movePhotos(id, targetBinderId, Array.from(selectedPhotos));
    const targetBinder = binders.find(b => b.id === targetBinderId);
    toast.success(`Moved ${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''} to "${targetBinder?.title}"`);
    setShowBinderPicker(false);
    handleExitSelectionMode();
  }, [id, selectedPhotos, movePhotos, binders, handleExitSelectionMode]);

  // Filter out current binder from picker options
  const availableBinders = binders.filter(b => b.id !== id);
  
  if (!binder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Binder not found</p>
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="mt-4 text-primary"
          >
            Go back home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header with Cover Image */}
      <div className="relative h-56">
        {binder.coverImage ? (
          <img
            src={binder.coverImage}
            alt={binder.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        
        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between safe-area-top">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full glass text-foreground"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full glass text-foreground"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-2xl font-bold text-foreground">{binder.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {binder.photoCount} photos
          </p>
        </div>
      </div>
      
      {/* Photo Grid */}
      <main className="pb-24 safe-area-bottom">
        <PhotoGrid 
          photos={binder.photos}
          selectionMode={selectionMode}
          selectedPhotos={selectedPhotos}
          onToggleSelection={handleToggleSelection}
          onEnterSelectionMode={handleEnterSelectionMode}
          onPhotoDetailOpen={setIsPhotoDetailOpen}
        />
        
        {/* Hint text */}
        {!selectionMode && (
          <p className="text-center text-sm text-muted-foreground mt-4 px-4">
            Long-press a photo to select
          </p>
        )}
      </main>
      
      {/* Selection Mode Toolbar */}
      {selectionMode && (
        <div className="fixed bottom-20 left-4 right-4 z-40 animate-fade-in">
          <div className="glass-strong rounded-2xl px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExitSelectionMode}
              className="text-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            
            <span className="text-sm font-medium text-foreground">
              {selectedPhotos.size} selected
            </span>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-foreground hover:text-primary"
                onClick={() => setShowBinderPicker(true)}
              >
                <FolderInput className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-foreground hover:text-destructive"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Action Button - Exhibition Mode (hidden in Photo Detail View) */}
      <div className={cn(
        "fixed bottom-6 right-4 z-50 transition-all duration-300 safe-area-bottom",
        (selectionMode || isPhotoDetailOpen) && "translate-y-20 opacity-0 pointer-events-none"
      )}>
        <Button
          size="lg"
          className="rounded-full h-14 px-6 shadow-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setShowExhibition(true)}
        >
          <Play className="w-5 h-5" />
          <span className="font-semibold">Exhibition</span>
        </Button>
      </div>

      {/* Exhibition Mode Overlay */}
      {showExhibition && (
        <ExhibitionMode 
          photos={binder.photos} 
          onClose={() => setShowExhibition(false)} 
        />
      )}

      {/* Binder Picker Modal for Move action */}
      <AnimatePresence>
        {showBinderPicker && (
          <BinderPickerModal
            binders={availableBinders}
            onSelect={handleMoveSelected}
            onClose={() => setShowBinderPicker(false)}
            onCreateBinder={createBinder}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BinderView;
