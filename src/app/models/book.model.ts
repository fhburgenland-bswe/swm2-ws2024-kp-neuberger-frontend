export interface Review {
  id?: string;
  rating: number;
  reviewText: string;
}

export interface Book {
  id?: string;
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  description: string;
  coverUrl: string;
  rating?: number | null;
  reviews: Review[];
}
