import { Link } from "react-router-dom";
import type { Binder } from "@/types/binder";
import { ImageIcon } from "lucide-react";

interface BinderCardProps {
  binder: Binder;
}

const BinderCard = ({ binder }: BinderCardProps) => {
  return (
    <Link to={`/binder/${binder.id}`} className="block">
      <article className="binder-card group cursor-pointer">
        {/* Cover Image */}
        <div className="aspect-[4/5] relative">
          <img
            src={binder.coverImage}
            alt={`${binder.title} cover`}
            className="w-full h-full object-cover"
          />
          
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
