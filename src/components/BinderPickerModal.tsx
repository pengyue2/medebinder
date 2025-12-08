import { motion, AnimatePresence } from "framer-motion";
import type { Binder } from "@/types/binder";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BinderPickerModalProps {
  binders: Binder[];
  onSelect: (binderId: string) => void;
  onClose: () => void;
}

const BinderPickerModal = ({ binders, onSelect, onClose }: BinderPickerModalProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-lg bg-card rounded-t-3xl overflow-hidden safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Add to Binder</h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Binder list */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {binders.map((binder) => (
            <button
              key={binder.id}
              onClick={() => onSelect(binder.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl",
                "transition-colors hover:bg-secondary/50 active:bg-secondary"
              )}
            >
              {/* Cover thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={binder.coverImage}
                  alt={binder.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Info */}
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{binder.title}</p>
                <p className="text-sm text-muted-foreground">{binder.photoCount} photos</p>
              </div>
            </button>
          ))}
        </div>
        
        {/* Create new binder option */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full rounded-xl"
          >
            Create New Binder
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BinderPickerModal;
