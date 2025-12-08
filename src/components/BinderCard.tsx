import { useState } from "react";
import { Link } from "react-router-dom";
import type { Binder } from "@/types/binder";
import { ImageIcon, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";

interface BinderCardProps {
  binder: Binder;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}

const BinderCard = ({ binder, onRename, onDelete }: BinderCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newName = prompt("Enter new binder name:", binder.title);
    if (newName && newName.trim() && newName !== binder.title) {
      onRename?.(binder.id, newName.trim());
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.(binder.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Link to={`/binder/${binder.id}`} className="block">
        <article className="binder-card group cursor-pointer relative">
          {/* 3-dot menu */}
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuItem onClick={handleRename}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Rename Binder
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeleteClick}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Binder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Cover Image */}
          <div className="aspect-[4/5] relative">
            {binder.coverImage ? (
              <img
                src={binder.coverImage}
                alt={`${binder.title} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            
            {/* Binder Spine Effect */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-background/40 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {binder.title}
              </h3>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <ImageIcon className="w-4 h-4" />
                <span>{binder.photoCount} photos</span>
              </div>
            </div>
          </div>
          
          {/* Bottom Edge (3D effect) */}
          <div className="h-2 bg-gradient-to-b from-card to-card/50 rounded-b-2xl" />
        </article>
      </Link>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BinderCard;
