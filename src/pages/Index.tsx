import { useState, useCallback } from "react";
import Header from "@/components/Header";
import BinderCard from "@/components/BinderCard";
import DailyStackWidget from "@/components/DailyStackWidget";
import SwipeSort from "@/components/SwipeSort";
import { mockBinders } from "@/data/mockBinders";
import { dailyStackPhotos } from "@/data/dailyStack";
import { useUnsortedPhotos } from "@/hooks/useUnsortedPhotos";

const Index = () => {
  const [showSwipeSort, setShowSwipeSort] = useState(false);
  const [organizedCount, setOrganizedCount] = useState(0);
  const { unsortedPhotos, addPhotos, count: unsortedCount } = useUnsortedPhotos();

  const handleOrganizedCountChange = useCallback((count: number) => {
    setOrganizedCount(count);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header onPhotosLoaded={addPhotos} unsortedCount={unsortedCount} />
      
      <main className="px-4 py-6 max-w-lg mx-auto safe-area-bottom">
        {/* Daily Stack Widget */}
        <div className="mb-6">
          <DailyStackWidget 
            photoCount={dailyStackPhotos.length} 
            organizedCount={organizedCount}
            onClick={() => setShowSwipeSort(true)}
            coverImage={dailyStackPhotos[0]?.url}
          />
        </div>
        
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
      {showSwipeSort && (
        <SwipeSort
          photos={dailyStackPhotos}
          binders={mockBinders}
          onClose={() => setShowSwipeSort(false)}
          onOrganizedCountChange={handleOrganizedCountChange}
        />
      )}
    </div>
  );
};

export default Index;
