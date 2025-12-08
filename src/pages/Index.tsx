import { useState, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import BinderCard from "@/components/BinderCard";
import DailyStackWidget from "@/components/DailyStackWidget";
import SwipeSort from "@/components/SwipeSort";
import { mockBinders } from "@/data/mockBinders";
import { useUnsortedPhotos } from "@/hooks/useUnsortedPhotos";

const Index = () => {
  const [showSwipeSort, setShowSwipeSort] = useState(false);
  const [organizedCount, setOrganizedCount] = useState(0);
  const { unsortedPhotos, addPhotos, removePhotos, count: unsortedCount } = useUnsortedPhotos();

  const handleOrganizedCountChange = useCallback((count: number) => {
    setOrganizedCount(count);
  }, []);

  const handleSwipeSortClose = useCallback((organizedPhotoIds?: string[]) => {
    setShowSwipeSort(false);
    // Remove organized photos from unsorted list
    if (organizedPhotoIds && organizedPhotoIds.length > 0) {
      removePhotos(organizedPhotoIds);
    }
    setOrganizedCount(0);
  }, [removePhotos]);

  const coverImage = useMemo(() => {
    return unsortedPhotos[0]?.url;
  }, [unsortedPhotos]);

  return (
    <div className="min-h-screen bg-background">
      <Header onPhotosLoaded={addPhotos} unsortedCount={unsortedCount} />
      
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
            Your Binders
          </h2>
          <p className="text-2xl font-bold text-foreground mt-1">
            {mockBinders.length} Collections
          </p>
        </div>
        
        {/* Binder Grid - Bookshelf style */}
        <div className="grid grid-cols-2 gap-4">
          {mockBinders.map((binder, index) => (
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
        
        {/* Empty state hint */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Tap + to create a new binder
          </p>
        </div>
      </main>

      {/* Swipe Sort Overlay */}
      {showSwipeSort && unsortedPhotos.length > 0 && (
        <SwipeSort
          photos={unsortedPhotos}
          binders={mockBinders}
          onClose={handleSwipeSortClose}
          onOrganizedCountChange={handleOrganizedCountChange}
        />
      )}
    </div>
  );
};

export default Index;
