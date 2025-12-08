import { useState, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import BinderCard from "@/components/BinderCard";
import DailyStackWidget from "@/components/DailyStackWidget";
import SwipeSort from "@/components/SwipeSort";
import CreateBinderModal from "@/components/CreateBinderModal";
import { useUnsortedPhotos } from "@/hooks/useUnsortedPhotos";
import { useBinders } from "@/hooks/useBinders";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [showSwipeSort, setShowSwipeSort] = useState(false);
  const [organizedCount, setOrganizedCount] = useState(0);
  const [showCreateBinder, setShowCreateBinder] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const { unsortedPhotos, addPhotos, removePhotos, count: unsortedCount } = useUnsortedPhotos();
  const { filteredBinders, searchQuery, setSearchQuery, createBinder, totalCount, binders } = useBinders();
  const { toast } = useToast();

  const handleOrganizedCountChange = useCallback((count: number) => {
    setOrganizedCount(count);
  }, []);

  const handleSwipeSortClose = useCallback((organizedPhotoIds?: string[]) => {
    setShowSwipeSort(false);
    if (organizedPhotoIds && organizedPhotoIds.length > 0) {
      removePhotos(organizedPhotoIds);
    }
    setOrganizedCount(0);
  }, [removePhotos]);

  const handleCreateBinder = useCallback((name: string) => {
    const newBinder = createBinder(name);
    toast({
      title: "Binder created",
      description: `"${newBinder.title}" is ready for photos`,
    });
  }, [createBinder, toast]);

  const handleSearchToggle = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
    if (isSearchOpen) {
      setSearchQuery("");
    }
  }, [isSearchOpen, setSearchQuery]);

  const coverImage = useMemo(() => {
    return unsortedPhotos[0]?.url;
  }, [unsortedPhotos]);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onPhotosLoaded={addPhotos} 
        unsortedCount={unsortedCount}
        onCreateBinder={() => setShowCreateBinder(true)}
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        onSearchToggle={handleSearchToggle}
        onSearchChange={setSearchQuery}
      />
      
      <main className="px-4 py-6 max-w-lg mx-auto safe-area-bottom">
        {/* Daily Stack Widget - only show if there are unsorted photos */}
        {unsortedCount > 0 && (
          <div className="mb-6">
            <DailyStackWidget 
              photoCount={unsortedCount} 
              organizedCount={organizedCount}
              onClick={() => setShowSwipeSort(true)}
              coverImage={coverImage}
            />
          </div>
        )}

        {/* Empty state for no photos */}
        {unsortedCount === 0 && (
          <div className="mb-6 p-6 rounded-2xl border-2 border-dashed border-muted-foreground/30 text-center">
            <p className="text-muted-foreground mb-2">No photos to organize</p>
            <p className="text-sm text-muted-foreground">
              Tap the ⚙️ icon above to upload photos
            </p>
          </div>
        )}
        
        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {searchQuery ? "Search Results" : "Your Binders"}
          </h2>
          <p className="text-2xl font-bold text-foreground mt-1">
            {searchQuery 
              ? `${filteredBinders.length} of ${totalCount} Collections`
              : `${totalCount} Collections`
            }
          </p>
        </div>
        
        {/* Binder Grid - Bookshelf style */}
        <div className="grid grid-cols-2 gap-4">
          {filteredBinders.map((binder, index) => (
            <div
              key={binder.id}
              className="animate-fade-in"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: "backwards",
              }}
            >
              <BinderCard binder={binder} />
            </div>
          ))}
        </div>

        {/* No results state */}
        {filteredBinders.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No binders match "{searchQuery}"</p>
          </div>
        )}
        
        {/* Empty state hint */}
        {!searchQuery && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Tap + to create a new binder
            </p>
          </div>
        )}
      </main>

      {/* Swipe Sort Overlay */}
      {showSwipeSort && unsortedPhotos.length > 0 && (
        <SwipeSort
          photos={unsortedPhotos}
          binders={binders}
          onClose={handleSwipeSortClose}
          onOrganizedCountChange={handleOrganizedCountChange}
        />
      )}

      {/* Create Binder Modal */}
      <CreateBinderModal
        isOpen={showCreateBinder}
        onClose={() => setShowCreateBinder(false)}
        onCreate={handleCreateBinder}
      />
    </div>
  );
};

export default Index;
