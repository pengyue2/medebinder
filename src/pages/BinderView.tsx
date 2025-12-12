import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical, Play, X, Trash2, FolderInput, ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhotoGrid from "@/components/PhotoGrid";
import ExhibitionMode from "@/components/ExhibitionMode";
import BinderPickerModal from "@/components/BinderPickerModal";
import { useBinders } from "@/context/BindersContext";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BinderView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBinderById, binders, removePhotosFromBinder, movePhotos, createBinder, renameBinder, deleteBinder, togglePhotoFavorite } = useBinders();
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showExhibition, setShowExhibition] = useState(false);
  const [isPhotoDetailOpen, setIsPhotoDetailOpen] = useState(false);
  const [showBinderPicker, setShowBinderPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteBinderConfirm, setShowDeleteBinderConfirm] = useState(false);
  
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
    setShowDeleteConfirm(false);
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

  const handleRenameBinder = () => {
    if (!binder) return;
    const newName = prompt("Enter new binder name:", binder.title);
    if (newName && newName.trim() && newName !== binder.title) {
      renameBinder(binder.id, newName.trim());
      toast.success("Binder renamed");
    }
  };

  const handleDeleteBinder = () => {
    if (!binder) return;
    deleteBinder(binder.id);
    toast.success("Binder deleted");
    navigate("/");
  };
  
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full glass text-foreground"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-popover">
              <DropdownMenuItem onClick={handleRenameBinder}>
                <Pencil className="w-4 h-4 mr-2" />
                Rename Binder
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteBinderConfirm(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Binder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          binderId={binder.id}
          selectionMode={selectionMode}
          selectedPhotos={selectedPhotos}
          onToggleSelection={handleToggleSelection}
          onEnterSelectionMode={handleEnterSelectionMode}
          onPhotoDetailOpen={setIsPhotoDetailOpen}
          onToggleFavorite={(photoId) => togglePhotoFavorite(binder.id, photoId)}
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
                onClick={() => setShowDeleteConfirm(true)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedPhotos.size} photo{selectedPhotos.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected photo{selectedPhotos.size > 1 ? 's' : ''} will be permanently removed from this binder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Binder Confirmation Dialog */}
      <AlertDialog open={showDeleteBinderConfirm} onOpenChange={setShowDeleteBinderConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{binder.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this binder and all its photos. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBinder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BinderView;
