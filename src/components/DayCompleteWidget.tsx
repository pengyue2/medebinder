import { CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayCompleteWidgetProps {
  completedCount: number;
  onRefill: () => void;
}

const DayCompleteWidget = ({ completedCount, onRefill }: DayCompleteWidgetProps) => {
  return (
    <div
      className={cn(
        "w-full glass-strong rounded-2xl p-5 flex items-center gap-5",
        "bg-gradient-to-r from-green-500/10 to-emerald-500/10"
      )}
    >
      {/* Checkmark Icon */}
      <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        
        {/* Completed badge */}
        <div className="absolute -top-1 -right-1 bg-background border-2 border-border rounded-full px-2 py-0.5 shadow-lg">
          <span 
            className="text-sm font-bold text-green-500"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            {completedCount}/{completedCount}
          </span>
        </div>
      </div>
      
      {/* Text content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-foreground">All caught up!</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Great job organizing today's photos
        </p>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefill}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Add more manually
        </Button>
      </div>
    </div>
  );
};

export default DayCompleteWidget;
