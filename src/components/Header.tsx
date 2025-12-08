import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import LibraryPopover from "@/components/LibraryPopover";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onPhotosLoaded?: (files: FileList) => number;
  unsortedCount?: number;
}

const Header = ({ 
  title = "MemoryDeck",
  onPhotosLoaded,
  unsortedCount = 0,
}: HeaderProps) => {
  return (
    <header className="glass-strong sticky top-0 z-50 px-4 py-3 safe-area-top">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        
        <div className="flex items-center gap-2">
          {onPhotosLoaded && (
            <LibraryPopover 
              onPhotosLoaded={onPhotosLoaded} 
              unsortedCount={unsortedCount} 
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="rounded-full"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
