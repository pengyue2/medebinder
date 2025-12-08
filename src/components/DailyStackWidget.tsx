import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DailyStackWidgetProps {
  photoCount: number;
  organizedCount: number;
  onClick: () => void;
  coverImage?: string;
}

const GOAL = 10;

const DailyStackWidget = ({ photoCount, organizedCount, onClick, coverImage }: DailyStackWidgetProps) => {
  const progress = Math.min(organizedCount / GOAL, 1);
  const circumference = 2 * Math.PI * 44; // radius = 44
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full glass-strong rounded-2xl p-5 flex items-center gap-5",
        "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        "group cursor-pointer text-left"
      )}
    >
      {/* Circular Progress Ring with Cover Image */}
      <div className="relative w-24 h-24 flex-shrink-0">
        {/* SVG Progress Ring */}
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          {/* Background ring (gray) */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
          />
          {/* Progress ring with gradient */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </svg>

        {/* Cover image inside the ring */}
        <div className="absolute inset-[6px] rounded-full overflow-hidden bg-muted">
          {coverImage ? (
            <img 
              src={coverImage} 
              alt="Daily Stack" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <div className="w-8 h-8 bg-background/30 rounded-lg" />
            </div>
          )}
        </div>

        {/* Progress Counter - floating above */}
        <div className="absolute -top-1 -right-1 bg-background border-2 border-border rounded-full px-2 py-0.5 shadow-lg">
          <span 
            className="text-sm font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            {organizedCount}/{GOAL}
          </span>
        </div>
      </div>
      
      {/* Text content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-foreground">Daily Stack</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {photoCount} {photoCount === 1 ? "photo" : "photos"} to organize
        </p>
        {organizedCount > 0 && organizedCount < GOAL && (
          <p className="text-xs text-primary mt-1 font-medium">
            {GOAL - organizedCount} more to complete today's goal!
          </p>
        )}
        {organizedCount >= GOAL && (
          <p className="text-xs text-green-500 mt-1 font-medium">
            Daily goal complete! ✓
          </p>
        )}
      </div>
    </button>
  );
};

export default DailyStackWidget;
