import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import type { Photo } from "@/types/binder";
import { X, RotateCcw, Heart, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { toast } from "sonner";

interface PhotoDetailViewProps {
  photo: Photo;
  onClose: () => void;
}

const MAX_MESSAGE_LENGTH = 150;

const PhotoDetailView = ({ photo, onClose }: PhotoDetailViewProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [message, setMessage] = useState("");
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSignaturePrinting, setIsSignaturePrinting] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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

  // Detect image orientation
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setIsLandscape(img.naturalWidth >= img.naturalHeight);
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

  const handleShare = useCallback(async () => {
    setIsGeneratingShare(true);
    
    try {
      // Dynamically import html2canvas to reduce initial bundle
      const html2canvas = (await import("html2canvas")).default;
      
      // Get actual card dimensions from the DOM
      const cardElement = cardRef.current;
      const cardWidth = (cardElement?.offsetWidth || 300) * 2; // Scale for quality
      const cardHeight = (cardElement?.offsetHeight || 400) * 2;
      const scaleFactor = 2;
      
      // Always side-by-side: Photo LEFT, Postcard Back RIGHT
      const collageContainer = document.createElement("div");
      collageContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        display: flex;
        flex-direction: row;
        gap: ${16 * scaleFactor}px;
        padding: ${24 * scaleFactor}px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: ${16 * scaleFactor}px;
      `;
      document.body.appendChild(collageContainer);

      // Create front card (photo) with blurred background wings
      const frontCard = document.createElement("div");
      frontCard.style.cssText = `
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        border-radius: ${12 * scaleFactor}px;
        overflow: hidden;
        box-shadow: 0 ${10 * scaleFactor}px ${30 * scaleFactor}px rgba(0,0,0,0.3);
        position: relative;
      `;
      
      // Blurred background (wings effect)
      const blurredBg = document.createElement("div");
      blurredBg.style.cssText = `
        position: absolute;
        inset: 0;
        background-image: url(${photo.url});
        background-size: cover;
        background-position: center;
        filter: blur(30px) brightness(0.6);
        transform: scale(1.3);
      `;
      frontCard.appendChild(blurredBg);
      
      // Centered photo container with object-fit: contain
      const photoContainer = document.createElement("div");
      photoContainer.style.cssText = `
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: ${12 * scaleFactor}px;
      `;
      const photoImg = document.createElement("img");
      photoImg.src = photo.url;
      photoImg.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: ${8 * scaleFactor}px;
      `;
      photoImg.crossOrigin = "anonymous";
      photoContainer.appendChild(photoImg);
      frontCard.appendChild(photoContainer);
      collageContainer.appendChild(frontCard);

      // Create back card (postcard) with 2x2 grid layout
      const backCard = document.createElement("div");
      backCard.style.cssText = `
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        border-radius: ${12 * scaleFactor}px;
        overflow: hidden;
        box-shadow: 0 ${10 * scaleFactor}px ${30 * scaleFactor}px rgba(0,0,0,0.3);
        background: linear-gradient(135deg, #f5f0e6 0%, #ebe5d9 50%, #f0ebe0 100%);
        padding: ${16 * scaleFactor}px;
        position: relative;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: ${8 * scaleFactor}px;
      `;

      // Postage stamp - top right
      const stamp = document.createElement("div");
      stamp.style.cssText = `
        position: absolute;
        top: ${12 * scaleFactor}px;
        right: ${12 * scaleFactor}px;
        width: ${48 * scaleFactor}px;
        height: ${60 * scaleFactor}px;
        background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2));
        border: ${2 * scaleFactor}px dashed rgba(100,100,100,0.4);
        border-radius: ${4 * scaleFactor}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10;
      `;
      stamp.innerHTML = `
        <div style="width: ${30 * scaleFactor}px; height: ${30 * scaleFactor}px; background: rgba(100,100,100,0.2); border-radius: ${4 * scaleFactor}px; margin-bottom: ${4 * scaleFactor}px;"></div>
        <span style="font-size: ${6 * scaleFactor}px; color: rgba(100,100,100,0.6); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Postage</span>
      `;
      backCard.appendChild(stamp);

      // Top-left quadrant - Message area (spans both top cells)
      const messageArea = document.createElement("div");
      messageArea.style.cssText = `
        grid-column: 1 / 3;
        grid-row: 1;
        font-family: 'Courier New', Courier, monospace;
        font-size: ${12 * scaleFactor}px;
        color: #2c2c2c;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        padding: ${8 * scaleFactor}px;
        padding-right: ${70 * scaleFactor}px;
        display: flex;
        align-items: flex-start;
      `;
      messageArea.textContent = message || "Wish you were here!";
      backCard.appendChild(messageArea);

      // Bottom-left quadrant - Address lines
      const addressArea = document.createElement("div");
      addressArea.style.cssText = `
        grid-column: 1;
        grid-row: 2;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: ${8 * scaleFactor}px;
      `;
      addressArea.innerHTML = `
        <div style="height: 1px; background: rgba(100,100,100,0.25); margin-bottom: ${14 * scaleFactor}px;"></div>
        <div style="height: 1px; background: rgba(100,100,100,0.25); margin-bottom: ${14 * scaleFactor}px;"></div>
        <div style="height: 1px; background: rgba(100,100,100,0.25); width: 80%;"></div>
      `;
      backCard.appendChild(addressArea);

      // Bottom-right quadrant - Signature area (50% width, 50% height)
      const signatureArea = document.createElement("div");
      signatureArea.style.cssText = `
        grid-column: 2;
        grid-row: 2;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: ${8 * scaleFactor}px;
      `;

      if (signatureDataUrl) {
        const sigImg = document.createElement("img");
        sigImg.src = signatureDataUrl;
        sigImg.style.cssText = `width: 100%; height: 100%; object-fit: contain;`;
        signatureArea.appendChild(sigImg);
      } else {
        const sigPlaceholder = document.createElement("div");
        sigPlaceholder.style.cssText = `
          width: 100%;
          height: 100%;
          border: ${2 * scaleFactor}px dashed rgba(100,100,100,0.4);
          border-radius: ${8 * scaleFactor}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Courier New', Courier, monospace;
          font-size: ${11 * scaleFactor}px;
          color: rgba(100,100,100,0.6);
        `;
        sigPlaceholder.textContent = "Your Signature";
        signatureArea.appendChild(sigPlaceholder);
      }

      backCard.appendChild(signatureArea);
      collageContainer.appendChild(backCard);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture the collage
      const canvas = await html2canvas(collageContainer, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      // Clean up
      document.body.removeChild(collageContainer);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 1.0);
      });

      const file = new File([blob], "postcard.png", { type: "image/png" });

      // Try native share first
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Postcard",
          text: message || "Check out my postcard!",
        });
        toast.success("Shared successfully!");
      } else {
        // Fallback: download the image
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
  }, [photo.url, message, signatureDataUrl]);

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
        {/* Tilt wrapper - applies parallax effect */}
        <motion.div
          className={cn(
            "relative w-full",
            isLandscape ? "aspect-[4/3]" : "aspect-[3/4]"
          )}
          style={{
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

            {/* Zoom hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-3 py-1.5 pointer-events-none"
            >
              <span className="text-xs text-foreground/70">Double-tap to zoom</span>
            </motion.div>
            
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
            
            {/* Postage Stamp placeholder - top right (both orientations) */}
            <div className="absolute top-4 right-4 w-12 h-16 bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-dashed border-muted-foreground/40 rounded flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-muted-foreground/20 rounded mb-1" />
              <span className="text-[6px] text-muted-foreground/60 font-medium uppercase tracking-wide">Postage</span>
            </div>
            
            {/* Dynamic Layout based on orientation - CSS Grid */}
            {isLandscape ? (
              /* Landscape: Horizontal two-column grid */
              <div 
                className="absolute inset-4 top-6 grid gap-3"
                style={{ 
                  gridTemplateColumns: '1fr 1fr',
                  gridTemplateRows: '1fr',
                }}
              >
                {/* Left column - Message area (full height) */}
                <div className="flex flex-col h-full pr-2 border-r border-muted-foreground/30">
                  <Textarea
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Write your message here..."
                    className={cn(
                      "flex-1 resize-none border-none bg-transparent p-0 h-full",
                      "text-sm leading-relaxed",
                      "placeholder:text-muted-foreground/40",
                      "focus-visible:ring-0 focus-visible:ring-offset-0"
                    )}
                    style={{
                      fontFamily: "'Courier New', Courier, monospace",
                      color: "#2c2c2c",
                    }}
                  />
                  <div className="mt-2 text-right">
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
                
                {/* Right column - Signature area (vertically centered) */}
                <div className="flex flex-col justify-center pl-2 pr-16">
                  {/* Decorative address lines */}
                  <div className="w-full space-y-3 mb-4">
                    <div className="h-px bg-muted-foreground/25" />
                    <div className="h-px bg-muted-foreground/25" />
                    <div className="h-px bg-muted-foreground/25 w-2/3" />
                  </div>
                  
                  {/* Signature area */}
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
                        className="w-full h-16 relative cursor-pointer"
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
                          className="w-full h-full object-contain"
                          style={{
                            filter: isSignaturePrinting ? "contrast(1.3)" : "none",
                          }}
                        />
                      </motion.div>
                    ) : (
                      <motion.button 
                        key="tap-to-sign"
                        className={cn(
                          "w-full h-16 border-2 border-dashed border-muted-foreground/40 rounded-lg",
                          "flex items-center justify-center",
                          "hover:border-primary/50 hover:bg-primary/5 transition-colors",
                          "cursor-pointer"
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
              </div>
            ) : (
              /* Portrait: Vertical two-row grid */
              <div 
                className="absolute inset-4 top-24 grid gap-3"
                style={{ 
                  gridTemplateColumns: '1fr',
                  gridTemplateRows: '1fr 1fr',
                }}
              >
                {/* Top row - Message area (full height) */}
                <div className="flex flex-col h-full pb-2 border-b border-muted-foreground/30">
                  <Textarea
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Write your message here..."
                    className={cn(
                      "flex-1 resize-none border-none bg-transparent p-0 h-full",
                      "text-sm leading-relaxed",
                      "placeholder:text-muted-foreground/40",
                      "focus-visible:ring-0 focus-visible:ring-offset-0"
                    )}
                    style={{
                      fontFamily: "'Courier New', Courier, monospace",
                      color: "#2c2c2c",
                    }}
                  />
                  <div className="mt-2 text-right">
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
                
                {/* Bottom row - Signature area (vertically centered) */}
                <div className="flex flex-col justify-center pt-2">
                  {/* Decorative address lines */}
                  <div className="w-full space-y-3 mb-4">
                    <div className="h-px bg-muted-foreground/25" />
                    <div className="h-px bg-muted-foreground/25" />
                    <div className="h-px bg-muted-foreground/25 w-2/3" />
                  </div>
                  
                  {/* Signature area */}
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
                        className="w-full h-20 relative cursor-pointer"
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
                          className="w-full h-full object-contain"
                          style={{
                            filter: isSignaturePrinting ? "contrast(1.3)" : "none",
                          }}
                        />
                      </motion.div>
                    ) : (
                      <motion.button 
                        key="tap-to-sign"
                        className={cn(
                          "w-full h-20 border-2 border-dashed border-muted-foreground/40 rounded-lg",
                          "flex items-center justify-center",
                          "hover:border-primary/50 hover:bg-primary/5 transition-colors",
                          "cursor-pointer"
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
              </div>
            )}
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
              isFavorited ? "text-red-500" : "text-foreground"
            )}
            onClick={() => setIsFavorited(!isFavorited)}
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
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PhotoDetailView;
