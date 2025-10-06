export interface FavoriteMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  added_at?: any; // For the Firestore timestamp
}