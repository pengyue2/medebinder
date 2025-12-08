import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eraser, Check, Pen, Paintbrush, Highlighter, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  color: string;
}

type PenStyle = "pen" | "brush" | "marker";

interface PenConfig {
  lineWidth: number;
  opacity: number;
  lineCap: CanvasLineCap;
}

const penStyles: Record<PenStyle, PenConfig> = {
  pen: { lineWidth: 3, opacity: 1, lineCap: "round" },
  brush: { lineWidth: 8, opacity: 0.7, lineCap: "round" },
  marker: { lineWidth: 12, opacity: 0.5, lineCap: "square" },
};

const inkColors = [
  { name: "Black", value: "#1a1a1a", glow: "rgba(100, 100, 100, 0.8)" },
  { name: "Blue", value: "#1e40af", glow: "rgba(59, 130, 246, 0.8)" },
  { name: "Red", value: "#b91c1c", glow: "rgba(239, 68, 68, 0.8)" },
  { name: "Purple", value: "#7c3aed", glow: "rgba(139, 92, 246, 0.8)" },
  { name: "Green", value: "#15803d", glow: "rgba(34, 197, 94, 0.8)" },
  { name: "Gold", value: "#b45309", glow: "rgba(251, 191, 36, 0.8)" },
];

const MAX_HISTORY = 20;

interface SignatureCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureDataUrl: string) => void;
}

export const SignatureCanvas = ({ isOpen, onClose, onConfirm }: SignatureCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penStyle, setPenStyle] = useState<PenStyle>("pen");
  const [inkColor, setInkColor] = useState(inkColors[0]);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const particleId = useRef(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Initialize canvas ONLY when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    const timeoutId = setTimeout(() => {
      const canvas = canvasRef.current;
      const particleCanvas = particleCanvasRef.current;
      if (!canvas || !particleCanvas) return;

      const ctx = canvas.getContext("2d");
      const pCtx = particleCanvas.getContext("2d");
      if (!ctx || !pCtx) return;

      const rect = canvas.getBoundingClientRect();
      const width = Math.max(rect.width, 300);
      const height = Math.max(rect.height, 300);
      
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      particleCanvas.width = width * window.devicePixelRatio;
      particleCanvas.height = height * window.devicePixelRatio;
      
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      pCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Apply initial pen style
      const config = penStyles[penStyle];
      ctx.lineCap = config.lineCap;
      ctx.lineJoin = "round";
      ctx.lineWidth = config.lineWidth;
      ctx.globalAlpha = config.opacity;
      ctx.strokeStyle = inkColor.value;
    }, 50);

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only re-initialize when modal opens, not when pen/color changes

  // Update drawing style when pen or color changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const config = penStyles[penStyle];
    ctx.lineCap = config.lineCap;
    ctx.lineJoin = "round";
    ctx.lineWidth = config.lineWidth;
    ctx.globalAlpha = config.opacity;
    ctx.strokeStyle = inkColor.value;
  }, [penStyle, inkColor]);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            opacity: p.opacity - 0.08,
            scale: p.scale * 0.95,
          }))
          .filter(p => p.opacity > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  // Draw particles
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => {
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, 20 * particle.scale
      );
      gradient.addColorStop(0, particle.color.replace("0.8", String(particle.opacity)));
      gradient.addColorStop(0.5, particle.color.replace("0.8", String(particle.opacity * 0.4)));
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 20 * particle.scale, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });
  }, [particles]);

  const getCoordinates = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }, []);

  const addParticle = useCallback((x: number, y: number) => {
    setParticles(prev => [
      ...prev,
      {
        id: particleId.current++,
        x,
        y,
        opacity: 1,
        scale: 1,
        color: inkColor.glow,
      },
    ]);
  }, [inkColor.glow]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    setHistory(prev => {
      // Remove any redo states when adding new history
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      // Keep only MAX_HISTORY states
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (!canUndo) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const newIndex = historyIndex - 1;
    const imageData = history[newIndex];
    
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
      setHistoryIndex(newIndex);
      setHasDrawn(newIndex > 0);
    }
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const newIndex = historyIndex + 1;
    const imageData = history[newIndex];
    
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
      setHistoryIndex(newIndex);
      setHasDrawn(true);
    }
  }, [canRedo, history, historyIndex]);

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setHasDrawn(true);
    lastPoint.current = coords;
    addParticle(coords.x, coords.y);
  }, [getCoordinates, addParticle]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPoint.current) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    // Add particle effect
    addParticle(coords.x, coords.y);

    lastPoint.current = coords;
  }, [isDrawing, getCoordinates, addParticle]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      saveToHistory();
    }
    setIsDrawing(false);
    lastPoint.current = null;
  }, [isDrawing, saveToHistory]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const handleConfirm = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error("Canvas not ready for export");
        return;
      }

      // Export with transparent background
      const dataUrl = canvas.toDataURL("image/png");
      if (dataUrl && dataUrl !== "data:,") {
        onConfirm(dataUrl);
      }
    } catch (error) {
      console.error("Error exporting signature:", error);
    }
  }, [onConfirm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-background"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Sign Your Postcard</h2>
            <div className="w-10" />
          </div>

          {/* Pen Style & Color Selector */}
          <div className="px-4 py-3 border-b border-border flex flex-wrap gap-4 items-center justify-center">
            {/* Pen Styles */}
            <div className="flex gap-2">
              <button
                onClick={() => setPenStyle("pen")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  penStyle === "pen" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
                title="Pen"
              >
                <Pen className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPenStyle("brush")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  penStyle === "brush" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
                title="Brush"
              >
                <Paintbrush className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPenStyle("marker")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  penStyle === "marker" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
                title="Marker"
              >
                <Highlighter className="h-5 w-5" />
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-border" />

            {/* Color Picker */}
            <div className="flex gap-2">
              {inkColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setInkColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all border-2",
                    inkColor.name === color.name 
                      ? "border-primary scale-110 shadow-lg" 
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-border" />

            {/* Undo/Redo */}
            <div className="flex gap-2">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  canUndo 
                    ? "bg-muted hover:bg-muted/80" 
                    : "bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
                )}
                title="Undo"
              >
                <Undo2 className="h-5 w-5" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  canRedo 
                    ? "bg-muted hover:bg-muted/80" 
                    : "bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
                )}
                title="Redo"
              >
                <Redo2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative p-4">
            <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
              {/* Particle canvas (behind) */}
              <canvas
                ref={particleCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              {/* Drawing canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              
              {/* Placeholder text */}
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-muted-foreground/40 text-xl italic">
                    Draw your signature here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border flex gap-3" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={(e) => {
                e.stopPropagation();
                clearCanvas();
              }}
            >
              <Eraser className="h-4 w-4" />
              Clear
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={(e) => {
                e.stopPropagation();
                handleConfirm();
              }}
              disabled={!hasDrawn}
            >
              <Check className="h-4 w-4" />
              Confirm Signature
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
