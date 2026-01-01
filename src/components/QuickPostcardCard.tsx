import { useRef } from "react";
import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";

interface QuickPostcardCardProps {
  onPhotoSelected: (photo: { id: string; url: string }) => void;
}

const QuickPostcardCard = ({ onPhotoSelected }: QuickPostcardCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onPhotoSelected({
        id: `quick-${Date.now()}`,
        url,
      });
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full p-5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/30 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Wand2 className="w-7 h-7 text-primary" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-0.5">
              Try it out
            </h3>
            <p className="text-sm text-muted-foreground">
              Make a Postcard now
            </p>
          </div>

          {/* Arrow indicator */}
          <div className="text-primary/60">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </motion.button>
    </>
  );
};

export default QuickPostcardCard;
