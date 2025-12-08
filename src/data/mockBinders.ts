import coverSummer from "@/assets/cover-summer.jpg";
import coverCats from "@/assets/cover-cats.jpg";
import coverTravel from "@/assets/cover-travel.jpg";
import coverFamily from "@/assets/cover-family.jpg";
import type { Binder } from "@/types/binder";

export const mockBinders: Binder[] = [
  {
    id: "summer-2024",
    title: "Summer 2024",
    coverImage: coverSummer,
    photoCount: 47,
    photos: [
      { id: "s1", url: coverSummer, alt: "Beach sunset" },
      { id: "s2", url: coverSummer, alt: "Palm trees" },
      { id: "s3", url: coverSummer, alt: "Ocean waves" },
      { id: "s4", url: coverSummer, alt: "Golden hour" },
      { id: "s5", url: coverSummer, alt: "Summer vibes" },
      { id: "s6", url: coverSummer, alt: "Beach day" },
    ],
  },
  {
    id: "cats",
    title: "Cats",
    coverImage: coverCats,
    photoCount: 23,
    photos: [
      { id: "c1", url: coverCats, alt: "Fluffy cat" },
      { id: "c2", url: coverCats, alt: "Cat portrait" },
      { id: "c3", url: coverCats, alt: "Cute kitten" },
      { id: "c4", url: coverCats, alt: "Cat eyes" },
    ],
  },
  {
    id: "travel",
    title: "Travel Adventures",
    coverImage: coverTravel,
    photoCount: 89,
    photos: [
      { id: "t1", url: coverTravel, alt: "Mountains" },
      { id: "t2", url: coverTravel, alt: "Hiking trail" },
      { id: "t3", url: coverTravel, alt: "Scenic view" },
      { id: "t4", url: coverTravel, alt: "Adventure" },
      { id: "t5", url: coverTravel, alt: "Peak" },
    ],
  },
  {
    id: "family",
    title: "Family Moments",
    coverImage: coverFamily,
    photoCount: 156,
    photos: [
      { id: "f1", url: coverFamily, alt: "Family dinner" },
      { id: "f2", url: coverFamily, alt: "Celebration" },
      { id: "f3", url: coverFamily, alt: "Together" },
      { id: "f4", url: coverFamily, alt: "Holiday" },
      { id: "f5", url: coverFamily, alt: "Gathering" },
      { id: "f6", url: coverFamily, alt: "Love" },
    ],
  },
];
