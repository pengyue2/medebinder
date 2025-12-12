import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import BinderCard from "@/components/BinderCard";
import DailyStackWidget from "@/components/DailyStackWidget";
import DayCompleteWidget from "@/components/DayCompleteWidget";
import SwipeSort from "@/components/SwipeSort";
import CreateBinderModal from "@/components/CreateBinderModal";
import { useApp } from "@/context/AppContext";
import { useBinders } from "@/context/BindersContext";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [showSwipeSort, setShowSwipeSort] = useState(false);
  const [showCreateBinder, setShowCreateBinder] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const { 
    unsortedPhotos, 
    addPhotos, 
    removePhotos, 
    unsortedCount,
    dailyProgress,
    dailyGoal,
    markDayComplete,
    resetDailyProgress,
    initializeDailySession,
  } = useApp();
  
  const { filteredBinders, searchQuery, setSearchQuery, createBinder, deleteBinder, renameBinder, totalCount, binders, addPhotoToBinder } = useBinders();
  const { toast } = useToast();

  // Initialize daily session when component mounts with photos
  useEffect(() => {
    if (unsortedCount > 0 && dailyProgress.initialCount === 0) {
      initializeDailySession();
    }
  }, [unsortedCount, dailyProgress.initialCount, initializeDailySession]);

  const handleSwipeSortClose = useCallback((organizedPhotoIds?: string[], goalWasCompleted?: boolean) => {
    setShowSwipeSort(false);
    if (organizedPhotoIds && organizedPhotoIds.length > 0) {
      removePhotos(organizedPhotoIds);
      
      // If the daily goal was completed, mark day as complete
      if (goalWasCompleted) {
        markDayComplete();
      }
    }
  }, [removePhotos, markDayComplete]);

  const handleRefillStack = useCallback(() => {
    resetDailyProgress();
    toast({
      title: "Stack refilled",
      description: "You can continue organizing photos",
    });
  }, [resetDailyProgress, toast]);

  const handleCreateBinder = useCallback((name: string) => {
    const newBinder = createBinder(name);
    toast({
      title: "Binder created",
      description: `"${newBinder.title}" is ready for photos`,
    });
  }, [createBinder, toast]);

  const handleRenameBinder = useCallback((id: string, newName: string) => {
    renameBinder(id, newName);
    toast({
      title: "Binder renamed",
      description: `Renamed to "${newName}"`,
    });
  }, [renameBinder, toast]);

  const handleDeleteBinder = useCallback((id: string) => {
    deleteBinder(id);
    toast({
      title: "Binder deleted",
      description: "The binder has been removed",
    });
  }, [deleteBinder, toast]);

  const handleSearchToggle = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
    if (isSearchOpen) {
      setSearchQuery("");
    }
  }, [isSearchOpen, setSearchQuery]);

  const coverImage = unsortedPhotos[0]?.url;

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
        {/* Day Complete Widget - show when daily goal is done */}
        {dailyProgress.isComplete && (
          <div className="mb-6">
            <DayCompleteWidget 
              completedCount={dailyProgress.organizedCount}
              onRefill={handleRefillStack}
            />
          </div>
        )}

        {/* Daily Stack Widget - only show if there are unsorted photos and day is not complete */}
        {!dailyProgress.isComplete && unsortedCount > 0 && (
          <div className="mb-6">
            <DailyStackWidget 
              photoCount={unsortedCount} 
              organizedCount={dailyProgress.organizedCount}
              dailyGoal={dailyGoal}
              onClick={() => setShowSwipeSort(true)}
              coverImage={coverImage}
            />
          </div>
        )}

        {/* Empty state for no photos */}
        {!dailyProgress.isComplete && unsortedCount === 0 && (
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
        {filteredBinders.length > 0 && (
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
        )}

        {/* No results state for search */}
        {filteredBinders.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No binders match "{searchQuery}"</p>
          </div>
        )}
        
        {/* Empty state - no binders yet */}
        {totalCount === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Binders yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Start by importing your photos, then organize them into beautiful collections.
            </p>
            <p className="text-sm text-muted-foreground">
              Tap <span className="font-medium">Import Photos</span> in the header to get started
            </p>
          </div>
        )}
        
        {/* Hint when binders exist */}
        {totalCount > 0 && !searchQuery && (
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
          dailyGoal={dailyGoal}
          onClose={handleSwipeSortClose}
          onAddPhotoToBinder={addPhotoToBinder}
          onCreateBinder={createBinder}
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
