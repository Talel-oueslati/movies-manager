// import { FavoriteMovie } from "./FavoriteMovie";

import { FavoriteMovie } from "./FavoriteMovie";

// export interface User {
//   uid?: string;
//   nom: string;
//   prénom: string;
//   email: string;
//   age: number;
//   photo?: string;
//   favorites?: FavoriteMovie[]; // Consider using a more minimal type for favorites
// }
export interface User {
  uid?: string;
  nom: string;
  prénom: string;
  email: string;
  age: number;
  photo?: string;
  favorites?: FavoriteMovie[];
  role?: "user" | "admin";  // <-- add role
  active?: boolean;          // <-- for disabling users
}
