import { useRef, useState } from "react";
import { Settings, Upload, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface LibraryPopoverProps {
  onPhotosLoaded: (files: FileList) => number;
  unsortedCount: number;
}

const LibraryPopover = ({ onPhotosLoaded, unsortedCount }: LibraryPopoverProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const count = onPhotosLoaded(files);
      toast({
        title: "Photos loaded",
        description: `Successfully loaded ${count} photo${count !== 1 ? "s" : ""} into your library`,
      });
    }
    // Reset input so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Backdrop blur overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary relative"
          >
            <Settings className="w-5 h-5" />
            {unsortedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {unsortedCount > 99 ? "99+" : unsortedCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-72 z-50" 
          align="center"
          sideOffset={8}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-medium text-foreground">Library</h4>
              <p className="text-sm text-muted-foreground">
                {unsortedCount > 0
                  ? `${unsortedCount} unsorted photo${unsortedCount !== 1 ? "s" : ""}`
                  : "No photos waiting to be organized"}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              onClick={triggerFileInput}
              className="w-full gap-2"
              size="lg"
            >
              <ImagePlus className="w-5 h-5" />
              Upload Photos to Organize
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Select multiple photos at once
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default LibraryPopover;
