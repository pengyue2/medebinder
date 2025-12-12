import { Link } from "react-router-dom";
import type { Binder } from "@/types/binder";
import { ImageIcon, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface BinderCardProps {
  binder: Binder;
  onToggleFavorite?: (id: string) => void;
}

const BinderCard = ({ binder, onToggleFavorite }: BinderCardProps) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(binder.id);
  };

  return (
    <Link to={`/binder/${binder.id}`} className="block">
      <article className="binder-card group cursor-pointer relative">
        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteClick}
          className={cn(
            "absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center",
            "bg-background/60 backdrop-blur-sm transition-all duration-200",
            "hover:bg-background/80 hover:scale-110",
            binder.isFavorite && "bg-primary/20"
          )}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors duration-200",
              binder.isFavorite
                ? "fill-primary text-primary"
                : "text-foreground/70 hover:text-primary"
            )}
          />
        </button>

        {/* Cover Image */}
        <div className="aspect-[4/5] relative">
          {binder.coverImage ? (
            <img
              src={binder.coverImage}
              alt={`${binder.title} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          
          {/* Binder Spine Effect */}
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-background/40 to-transparent" />
          
          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
              {binder.title}
            </h3>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <ImageIcon className="w-4 h-4" />
              <span>{binder.photoCount} photos</span>
            </div>
          </div>
        </div>
        
        {/* Bottom Edge (3D effect) */}
        <div className="h-2 bg-gradient-to-b from-card to-card/50 rounded-b-2xl" />
      </article>
    </Link>
  );
};

export default BinderCard;