import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import type { Photo } from "@/types/binder";
import { X, RotateCcw, Heart, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { toast } from "sonner";
import { useBinders } from "@/context/BindersContext";

interface PhotoDetailViewProps {
  photo: Photo;
  onClose: () => void;
  onToggleFavorite?: () => void;
}

const MAX_MESSAGE_LENGTH = 150;

const STAMP_OPTIONS = ["🌎", "✈️", "💌", "🏛️", "🏔️", "🌅", "🎭", "🌸"];

const PhotoDetailView = ({ photo, onClose, onToggleFavorite }: PhotoDetailViewProps) => {
  const { savePostcardToGallery } = useBinders();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFavorited, setIsFavorited] = useState(photo.isFavorite || false);
  const [message, setMessage] = useState("");
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSignaturePrinting, setIsSignaturePrinting] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [photoAspectRatio, setPhotoAspectRatio] = useState(1); // width/height
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [showStampPicker, setShowStampPicker] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageRect, setImageRect] = useState<DOMRect | null>(null);
  // Lightbox zoom state
  const lightboxScale = useMotionValue(1);
  const lightboxX = useMotionValue(0);
  const lightboxY = useMotionValue(0);
  const springLightboxScale = useSpring(lightboxScale, { stiffness: 300, damping: 30 });
  const springLightboxX = useSpring(lightboxX, { stiffness: 300, damping: 30 });
  const springLightboxY = useSpring(lightboxY, { stiffness: 300, damping: 30 });

  // Lock body scroll when modal opens
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Detect image aspect ratio
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setPhotoAspectRatio(img.naturalWidth / img.naturalHeight);
    };
    img.src = photo.url;
  }, [photo.url]);

  // Mouse position for tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for tilt
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), {
    stiffness: 150,
    damping: 20,
  });

  // Parallax shadow effect
  const shadowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [20, -20]), {
    stiffness: 150,
    damping: 20,
  });
  const shadowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [20, -20]), {
    stiffness: 150,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (e.clientX - centerX) / rect.width;
    const y = (e.clientY - centerY) / rect.height;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (touch.clientX - centerX) / rect.width;
    const y = (touch.clientY - centerY) / rect.height;
    
    mouseX.set(x * 0.5); // Reduce sensitivity for touch
    mouseY.set(y * 0.5);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value);
    }
  };

  const handleSignatureConfirm = (dataUrl: string) => {
    setIsSignatureModalOpen(false);
    setIsSignaturePrinting(true);
    
    // Small delay before showing the signature with printing effect
    setTimeout(() => {
      setSignatureDataUrl(dataUrl);
      // Reset printing state after animation completes
      setTimeout(() => {
        setIsSignaturePrinting(false);
      }, 800);
    }, 100);
  };

  // Lightbox handlers
  const openLightbox = useCallback(() => {
    if (isFlipped) return;
    
    // Capture the current image position for animation
    if (imageRef.current) {
      setImageRect(imageRef.current.getBoundingClientRect());
    }
    
    // Reset lightbox state
    lightboxScale.set(1);
    lightboxX.set(0);
    lightboxY.set(0);
    setIsLightboxOpen(true);
  }, [isFlipped, lightboxScale, lightboxX, lightboxY]);

  const closeLightbox = useCallback(() => {
    // Animate back to original scale/position before closing
    lightboxScale.set(1);
    lightboxX.set(0);
    lightboxY.set(0);
    
    // Small delay to allow animation before closing
    setTimeout(() => {
      setIsLightboxOpen(false);
    }, 200);
  }, [lightboxScale, lightboxX, lightboxY]);

  const handleLightboxDoubleTap = useCallback(() => {
    const currentScale = lightboxScale.get();
    if (currentScale > 1.2) {
      // Reset zoom
      lightboxScale.set(1);
      lightboxX.set(0);
      lightboxY.set(0);
    } else {
      // Zoom in
      lightboxScale.set(2.5);
    }
  }, [lightboxScale, lightboxX, lightboxY]);

  const handleLightboxPan = useCallback((event: any, info: { delta: { x: number; y: number } }) => {
    const currentScale = lightboxScale.get();
    if (currentScale <= 1) return;
    
    const maxOffset = (currentScale - 1) * 200;
    
    const newX = Math.max(-maxOffset, Math.min(maxOffset, lightboxX.get() + info.delta.x));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, lightboxY.get() + info.delta.y));
    
    lightboxX.set(newX);
    lightboxY.set(newY);
  }, [lightboxScale, lightboxX, lightboxY]);

  // Determine if card is tall (portrait) for layout decisions
  const isTallCard = photoAspectRatio < 0.8;

  const handleShare = useCallback(async () => {
    setIsGeneratingShare(true);
    
    try {
      const html2canvas = (await import("html2canvas")).default;
      
      // Use the photo's actual aspect ratio for each card
      const cardWidth = 400;
      const cardHeight = cardWidth / photoAspectRatio;
      const gap = 24;
      
      // Total container: two cards side by side
      const totalWidth = cardWidth * 2 + gap;
      const totalHeight = cardHeight;
      
      // Create main container
      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${totalWidth}px;
        height: ${totalHeight}px;
        display: flex;
        gap: ${gap}px;
        background: transparent;
      `;
      document.body.appendChild(container);

      // === FRONT CARD (Photo with plastic frame style) ===
      const frontCard = document.createElement("div");
      frontCard.style.cssText = `
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        border-radius: 16px;
        overflow: hidden;
        position: relative;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      `;
      
      // Full photo as background
      const photoImg = document.createElement("img");
      photoImg.src = photo.url;
      photoImg.crossOrigin = "anonymous";
      photoImg.style.cssText = `
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      frontCard.appendChild(photoImg);
      
      // Photo frame border (plastic style edge)
      const frameBorder = document.createElement("div");
      frameBorder.style.cssText = `
        position: absolute;
        inset: 0;
        border: 6px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        pointer-events: none;
      `;
      frontCard.appendChild(frameBorder);
      
      container.appendChild(frontCard);

      // === BACK CARD (Postcard text side) ===
      const backCard = document.createElement("div");
      backCard.style.cssText = `
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        border-radius: 16px;
        overflow: hidden;
        position: relative;
        background: linear-gradient(135deg, #f5f0e6 0%, #ebe5d9 50%, #f0ebe0 100%);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(0, 0, 0, 0.1);
      `;
      
      // Paper texture
      const paperTexture = document.createElement("div");
      paperTexture.style.cssText = `
        position: absolute;
        inset: 0;
        opacity: 0.3;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
      `;
      backCard.appendChild(paperTexture);

      // Stamp - top right
      const stamp = document.createElement("div");
      stamp.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        width: 48px;
        height: 64px;
        background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2));
        border: 2px dashed rgba(100,100,100,0.4);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      `;
      if (selectedStamp) {
        stamp.innerHTML = `<span style="font-size: 32px;">${selectedStamp}</span>`;
      } else {
        stamp.innerHTML = `
          <div style="width: 32px; height: 32px; background: rgba(100,100,100,0.2); border-radius: 4px; margin-bottom: 4px;"></div>
          <span style="font-size: 8px; color: rgba(100,100,100,0.6); font-weight: 500; text-transform: uppercase;">Postage</span>
        `;
      }
      backCard.appendChild(stamp);

      // Content container
      const contentContainer = document.createElement("div");
      contentContainer.style.cssText = `
        position: absolute;
        inset: 16px;
        display: flex;
        flex-direction: column;
      `;

      // Message area
      const messageArea = document.createElement("div");
      messageArea.style.cssText = `
        flex: 1;
        font-family: 'Courier New', Courier, monospace;
        font-size: 14px;
        color: #2c2c2c;
        line-height: 1.6;
        padding-right: 70px;
        white-space: pre-wrap;
        word-break: break-word;
      `;
      messageArea.textContent = message || "Wish you were here!";
      contentContainer.appendChild(messageArea);

      // Bottom section
      const bottomSection = document.createElement("div");
      bottomSection.style.cssText = `
        display: flex;
        gap: 16px;
        margin-top: auto;
      `;

      // Address lines
      const addressArea = document.createElement("div");
      addressArea.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        gap: 12px;
      `;
      addressArea.innerHTML = `
        <div style="height: 1px; background: rgba(100,100,100,0.25);"></div>
        <div style="height: 1px; background: rgba(100,100,100,0.25);"></div>
        <div style="height: 1px; background: rgba(100,100,100,0.25); width: 70%;"></div>
      `;
      bottomSection.appendChild(addressArea);

      // Signature area
      const signatureArea = document.createElement("div");
      signatureArea.style.cssText = `
        width: 120px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      if (signatureDataUrl) {
        const sigImg = document.createElement("img");
        sigImg.src = signatureDataUrl;
        sigImg.style.cssText = `max-width: 100%; max-height: 100%; object-fit: contain;`;
        signatureArea.appendChild(sigImg);
      } else {
        const sigPlaceholder = document.createElement("div");
        sigPlaceholder.style.cssText = `
          width: 100%;
          height: 100%;
          border: 2px dashed rgba(100,100,100,0.4);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: rgba(100,100,100,0.6);
        `;
        sigPlaceholder.textContent = "Your Signature";
        signatureArea.appendChild(sigPlaceholder);
      }
      bottomSection.appendChild(signatureArea);
      contentContainer.appendChild(bottomSection);
      backCard.appendChild(contentContainer);
      container.appendChild(backCard);

      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      document.body.removeChild(container);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 1.0);
      });

      // Convert blob to data URL and save to postcard gallery
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        savePostcardToGallery(dataUrl);
      };
      reader.readAsDataURL(blob);

      const file = new File([blob], "postcard.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Postcard",
          text: message || "Check out my postcard!",
        });
        toast.success("Shared successfully!");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "postcard.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Postcard saved to downloads!");
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share postcard");
    } finally {
      setIsGeneratingShare(false);
    }
  }, [photo.url, message, signatureDataUrl, photoAspectRatio]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" />

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 rounded-full glass text-foreground"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Zoom hint - positioned at top center of screen, outside card */}
      {!isFlipped && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3.5, times: [0, 0.15, 0.85, 1] }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-3 py-1.5 pointer-events-none"
        >
          <span className="text-xs text-foreground/70">Double-tap to zoom</span>
        </motion.div>
      )}

      {/* 3D Card Container */}
      <motion.div
        ref={cardRef}
        className="relative z-10 w-full max-w-sm"
        style={{
          perspective: 1200,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseLeave}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Tilt wrapper - applies parallax effect with dynamic aspect ratio */}
        <motion.div
          className="relative w-full"
          style={{
            aspectRatio: photoAspectRatio,
            transformStyle: "preserve-3d",
            rotateX: isFlipped ? 0 : rotateX,
            rotateY: isFlipped ? 0 : rotateY,
          }}
        >
          {/* Card with flip */}
          <motion.div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
            }}
            animate={{ 
              rotateY: isFlipped ? 180 : 0,
            }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Floating shadow */}
            <motion.div
              className="absolute -inset-4 rounded-3xl bg-black/30 blur-2xl -z-10"
              style={{
                x: shadowX,
                y: shadowY,
              }}
            />

          {/* Front of card (Photo) */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl overflow-hidden",
              "bg-card border border-border/30",
              "shadow-2xl"
            )}
            style={{
              backfaceVisibility: "hidden",
            }}
          >
            {/* Blurred ambient background */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${photo.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(30px) brightness(0.5)",
                transform: "scale(1.2)",
              }}
            />
            
            {/* Photo container - tap to open lightbox */}
            <div 
              className="absolute inset-0 flex items-center justify-center p-4 cursor-zoom-in"
              onDoubleClick={openLightbox}
            >
              <img
                ref={imageRef}
                src={photo.url}
                alt={photo.alt}
                className="max-w-full max-h-full object-contain rounded-lg"
                draggable={false}
              />
            </div>

            
            {/* Photo frame border */}
            <div className="absolute inset-0 border-[6px] border-card/30 rounded-2xl pointer-events-none" />
            
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Shine effect on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"
              style={{
                opacity: useTransform(mouseX, [-0.5, 0, 0.5], [0, 0.1, 0.3]),
              }}
            />
          </div>

          {/* Back of card (Postcard) */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl overflow-hidden",
              "border border-border/30",
              "shadow-2xl"
            )}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, #f5f0e6 0%, #ebe5d9 50%, #f0ebe0 100%)",
            }}
          >
            {/* Paper texture overlay */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
            
            {/* Postage Stamp - clickable to change */}
            <div className="absolute top-2 right-2 z-20 p-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStampPicker(true);
                }}
                className="w-14 h-18 bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-dashed border-muted-foreground/40 rounded flex flex-col items-center justify-center hover:border-primary/50 hover:bg-primary/10 transition-colors cursor-pointer active:scale-95"
              >
                {selectedStamp ? (
                  <span className="text-3xl">{selectedStamp}</span>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-muted-foreground/20 rounded mb-1" />
                    <span className="text-[6px] text-muted-foreground/60 font-medium uppercase tracking-wide">Postage</span>
                  </>
                )}
              </button>
            </div>

            {/* Stamp Picker Modal */}
            <AnimatePresence>
              {showStampPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-4 right-4 z-50 bg-card border border-border rounded-xl p-3 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs text-muted-foreground mb-2 text-center">Choose a stamp</p>
                  <div className="grid grid-cols-4 gap-2">
                    {STAMP_OPTIONS.map((stamp) => (
                      <button
                        key={stamp}
                        onClick={() => {
                          setSelectedStamp(stamp);
                          setShowStampPicker(false);
                        }}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-2xl hover:bg-muted transition-colors",
                          selectedStamp === stamp && "bg-primary/20 ring-2 ring-primary"
                        )}
                      >
                        {stamp}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowStampPicker(false)}
                    className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Flexbox layout that adapts to card shape */}
            <div className={cn(
              "absolute inset-4 flex gap-3",
              isTallCard ? "flex-col" : "flex-row"
            )}>
              {/* Message area */}
              <div className="flex-1 flex flex-col pr-14">
                <Textarea
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Write your message here..."
                  className={cn(
                    "w-full flex-1 resize-none border-none bg-transparent p-0",
                    "text-sm leading-relaxed",
                    "placeholder:text-muted-foreground/40",
                    "focus-visible:ring-0 focus-visible:ring-offset-0"
                  )}
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    color: "#2c2c2c",
                  }}
                />
                <div className="flex justify-end mt-1">
                  <span 
                    className="text-xs"
                    style={{ 
                      color: message.length >= MAX_MESSAGE_LENGTH ? "#ef4444" : "#9ca3af",
                      fontFamily: "'Courier New', Courier, monospace",
                    }}
                  >
                    {message.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
              </div>

              {/* Bottom section: Address + Signature */}
              <div className={cn(
                "flex gap-3",
                isTallCard ? "flex-row h-24" : "flex-col flex-1"
              )}>
                {/* Address lines */}
                <div className="flex-1 flex flex-col justify-end space-y-2">
                  <div className="h-px bg-muted-foreground/25" />
                  <div className="h-px bg-muted-foreground/25" />
                  <div className="h-px bg-muted-foreground/25 w-2/3" />
                </div>
              </div>
            </div>

            {/* Signature area - positioned absolutely in bottom right */}
            <AnimatePresence mode="wait">
              {signatureDataUrl ? (
                <motion.div
                  key="signature"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    filter: isSignaturePrinting 
                      ? ["blur(2px)", "blur(0px)"] 
                      : "blur(0px)",
                  }}
                  transition={{ 
                    duration: 0.6,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className={cn(
                    "absolute z-10 cursor-pointer border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center",
                    isTallCard ? "bottom-4 right-4 w-2/5 h-20" : "bottom-4 right-4 w-1/3 h-1/4"
                  )}
                  onClick={() => setIsSignatureModalOpen(true)}
                >
                  {isSignaturePrinting && (
                    <motion.div
                      className="absolute inset-0 bg-foreground/10 rounded-lg"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                  <img
                    src={signatureDataUrl}
                    alt="Your signature"
                    className="w-full h-full object-contain p-2"
                    style={{
                      filter: isSignaturePrinting ? "contrast(1.3)" : "none",
                    }}
                  />
                </motion.div>
              ) : (
                <motion.button 
                  key="tap-to-sign"
                  className={cn(
                    "absolute z-10 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer",
                    isTallCard ? "bottom-4 right-4 w-2/5 h-20" : "bottom-4 right-4 w-1/3 h-1/4"
                  )}
                  onClick={() => setIsSignatureModalOpen(true)}
                >
                  <span 
                    className="text-sm text-muted-foreground/60"
                    style={{ fontFamily: "'Courier New', Courier, monospace" }}
                  >
                    Tap to Sign
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom action bar */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="glass-strong rounded-full px-4 py-2 flex items-center gap-2"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full transition-colors",
              isFavorited ? "text-primary" : "text-foreground"
            )}
            onClick={() => {
              setIsFavorited(!isFavorited);
              onToggleFavorite?.();
            }}
          >
            <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-foreground"
            onClick={handleShare}
            disabled={isGeneratingShare}
          >
            {isGeneratingShare ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-foreground gap-2"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">{isFlipped ? "Flip to Front" : "Flip to Back"}</span>
          </Button>
        </motion.div>
      </div>

      {/* Signature Canvas Modal */}
      <SignatureCanvas
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onConfirm={handleSignatureConfirm}
      />

      {/* Full-screen Lightbox Overlay */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center touch-none"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
            onClick={closeLightbox}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-[10000] rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Zoomable image container */}
            <motion.div
              className="w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={handleLightboxDoubleTap}
              onPan={handleLightboxPan}
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

            {/* Zoom controls hint - only pinch to zoom instruction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2"
            >
              <span className="text-sm text-white/80">
                Pinch to Zoom
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PhotoDetailView;
