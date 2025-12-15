import { Plus, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import LibraryPopover from "@/components/LibraryPopover";
import SearchOverlay from "@/components/SearchOverlay";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onPhotosLoaded?: (files: FileList) => number;
  unsortedCount?: number;
  onCreateBinder?: () => void;
  isSearchOpen?: boolean;
  searchQuery?: string;
  onSearchToggle?: () => void;
  onSearchChange?: (query: string) => void;
  onReset?: () => void;
  triggerUpload?: boolean;
  onUploadTriggered?: () => void;
}

const Header = ({ 
  title = "MemoryDeck",
  onPhotosLoaded,
  unsortedCount = 0,
  onCreateBinder,
  isSearchOpen = false,
  searchQuery = "",
  onSearchToggle,
  onSearchChange,
  onReset,
  triggerUpload = false,
  onUploadTriggered,
}: HeaderProps) => {
  return (
    <header className="glass-strong sticky top-0 z-50 px-4 py-3 safe-area-top relative">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {onReset && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
              onClick={onReset}
              title="Reset all data"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onPhotosLoaded && (
            <LibraryPopover 
              onPhotosLoaded={onPhotosLoaded} 
              unsortedCount={unsortedCount}
              triggerOpen={triggerUpload}
              onTriggerConsumed={onUploadTriggered}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
            onClick={onSearchToggle}
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="rounded-full"
            onClick={onCreateBinder}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {onSearchChange && (
        <SearchOverlay
          isOpen={isSearchOpen}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onClose={() => onSearchToggle?.()}
        />
      )}
    </header>
  );
};

export default Header;
