import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

const Header = ({ title = "MemoryDeck" }: HeaderProps) => {
  return (
    <header className="glass-strong sticky top-0 z-50 px-4 py-3 safe-area-top">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        
        <div className="flex items-center gap-2">
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
