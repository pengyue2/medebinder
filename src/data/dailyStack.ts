import coverSummer from "@/assets/cover-summer.jpg";
import coverCats from "@/assets/cover-cats.jpg";
import coverTravel from "@/assets/cover-travel.jpg";
import coverFamily from "@/assets/cover-family.jpg";
import type { Photo } from "@/types/binder";

// Photos for the daily stack (unsorted photos)
export const dailyStackPhotos: Photo[] = [
  { id: "daily-1", url: coverSummer, alt: "Beach sunset" },
  { id: "daily-2", url: coverCats, alt: "Cute cat" },
  { id: "daily-3", url: coverTravel, alt: "Mountain view" },
  { id: "daily-4", url: coverFamily, alt: "Family dinner" },
  { id: "daily-5", url: coverSummer, alt: "Palm trees" },
  { id: "daily-6", url: coverCats, alt: "Sleeping kitten" },
  { id: "daily-7", url: coverTravel, alt: "Hiking trail" },
  { id: "daily-8", url: coverFamily, alt: "Holiday celebration" },
  { id: "daily-9", url: coverSummer, alt: "Ocean waves" },
  { id: "daily-10", url: coverTravel, alt: "Scenic overlook" },
];
