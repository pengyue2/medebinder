import { Plus, Search } from "lucide-react";
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
}: HeaderProps) => {
  return (
    <header className="glass-strong sticky top-0 z-50 px-4 py-3 safe-area-top relative">
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
