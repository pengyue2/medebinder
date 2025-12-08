import { useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type { Photo } from "@/types/binder";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SwipeLightboxProps {
  photo: Photo;
  onClose: () => void;
}

const SwipeLightbox = ({ photo, onClose }: SwipeLightboxProps) => {
  const lightboxScale = useMotionValue(1);
  const lightboxX = useMotionValue(0);
  const lightboxY = useMotionValue(0);
  const springLightboxScale = useSpring(lightboxScale, { stiffness: 300, damping: 30 });
  const springLightboxX = useSpring(lightboxX, { stiffness: 300, damping: 30 });
  const springLightboxY = useSpring(lightboxY, { stiffness: 300, damping: 30 });

  const handleDoubleTap = useCallback(() => {
    const currentScale = lightboxScale.get();
    if (currentScale > 1.2) {
      lightboxScale.set(1);
      lightboxX.set(0);
      lightboxY.set(0);
    } else {
      lightboxScale.set(2.5);
    }
  }, [lightboxScale, lightboxX, lightboxY]);

  const handlePan = useCallback((event: any, info: { delta: { x: number; y: number } }) => {
    const currentScale = lightboxScale.get();
    if (currentScale <= 1) return;
    
    const maxOffset = (currentScale - 1) * 200;
    
    const newX = Math.max(-maxOffset, Math.min(maxOffset, lightboxX.get() + info.delta.x));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, lightboxY.get() + info.delta.y));
    
    lightboxX.set(newX);
    lightboxY.set(newY);
  }, [lightboxScale, lightboxX, lightboxY]);

  const handleClose = useCallback(() => {
    lightboxScale.set(1);
    lightboxX.set(0);
    lightboxY.set(0);
    setTimeout(() => {
      onClose();
    }, 150);
  }, [lightboxScale, lightboxX, lightboxY, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center touch-none"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
      onClick={handleClose}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-[10000] rounded-full bg-white/10 hover:bg-white/20 text-white"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Zoomable image container */}
      <motion.div
        className="w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDoubleTap}
        onPan={handlePan}
        style={{ cursor: lightboxScale.get() > 1 ? "grab" : "zoom-in" }}
      >
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          src={photo.url}
          alt={photo.alt}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
          style={{
            scale: springLightboxScale,
            x: springLightboxX,
            y: springLightboxY,
          }}
        />
      </motion.div>

      {/* Zoom controls hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2"
      >
        <span className="text-sm text-white/80">
          Double-tap to zoom • Drag to pan • Tap outside to close
        </span>
      </motion.div>
    </motion.div>
  );
};

export default SwipeLightbox;
