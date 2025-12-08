import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Binder } from "@/types/binder";
import { X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BinderPickerModalProps {
  binders: Binder[];
  onSelect: (binderId: string) => void;
  onClose: () => void;
  onCreateBinder?: (name: string) => Binder;
}

const BinderPickerModal = ({ binders, onSelect, onClose, onCreateBinder }: BinderPickerModalProps) => {
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newBinderName, setNewBinderName] = useState("");

  const handleCreateBinder = () => {
    if (!newBinderName.trim() || !onCreateBinder) return;
    const newBinder = onCreateBinder(newBinderName.trim());
    setNewBinderName("");
    setShowCreateInput(false);
    onSelect(newBinder.id);
  };

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
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {binder.coverImage ? (
                  <img
                    src={binder.coverImage}
                    alt={binder.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                )}
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
          <AnimatePresence mode="wait">
            {showCreateInput ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Binder name..."
                  value={newBinderName}
                  onChange={(e) => setNewBinderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateBinder()}
                  autoFocus
                  className="flex-1"
                />
                <Button onClick={handleCreateBinder} disabled={!newBinderName.trim()}>
                  Create
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateInput(false)}>
                  Cancel
                </Button>
              </motion.div>
            ) : (
              <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => setShowCreateInput(true)}
                >
                  Create New Binder
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BinderPickerModal;
