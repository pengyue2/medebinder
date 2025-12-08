export interface Photo {
  id: string;
  url: string;
  alt: string;
}

export interface Binder {
  id: string;
  title: string;
  coverImage: string;
  photoCount: number;
  photos: Photo[];
}
