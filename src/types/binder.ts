export interface Photo {
  id: string;
  url: string;
  alt: string;
  isFavorite?: boolean;
  createdAt?: number;
}

export interface Binder {
  id: string;
  title: string;
  coverImage: string;
  photoCount: number;
  photos: Photo[];
  isFavorite?: boolean;
}