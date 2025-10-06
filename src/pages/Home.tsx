import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonButton,
  IonIcon, IonSpinner, IonAlert, IonContent
} from '@ionic/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { heart, heartOutline, chevronBack, chevronForward } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Navbar from './Navbar';
import './Home.css';

const TMDB_API_KEY = '2ee8239d9aa958acaf92d9552bd28587';

const genreMap: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  genre_ids: number[];
  release_date: string;
}

interface GenreRow {
  genreId: number;
  movies: Movie[];
  page: number;
  totalPages: number;
}

// ✅ Show all genres
const genresToShow = [
  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36,
  27, 10402, 9648, 10749, 878, 53, 10752, 37
];

const Home: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [genreRows, setGenreRows] = useState<GenreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const history = useHistory();

  // 🔹 Fetch user & favorites
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUser(data);
          setFavorites(data.favorites || []);
        }
      } else {
        history.push('/login');
      }
    });
    return () => unsubscribe();
  }, [history]);

  // 🔹 Fetch movies per genre
  useEffect(() => {
    const fetchGenreMovies = async () => {
      setLoading(true);
      try {
        const rows: GenreRow[] = [];
        for (let genreId of genresToShow) {
          const res = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=1`
          );
          const data = await res.json();
          rows.push({
            genreId,
            movies: data.results.slice(0, 5), // first 5
            page: 1,
            totalPages: data.total_pages,
          });
        }
        setGenreRows(rows);
      } catch (err) {
        console.error(err);
        setAlertMessage('Error loading movies');
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };
    fetchGenreMovies();
  }, []);

  // 🔹 Toggle favorite
  const toggleFavorite = async (movie: Movie) => {
    if (!user?.uid) return;
    const userRef = doc(db, 'users', user.uid);
    const isFav = favorites.some(f => f.id === movie.id);
    try {
      if (isFav) {
        await updateDoc(userRef, { favorites: arrayRemove(movie) });
        setFavorites(favorites.filter(f => f.id !== movie.id));
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(movie) });
        setFavorites([...favorites, movie]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 🔹 Handle next/prev per genre row
  const handleArrowClick = async (genreId: number, direction: 'next' | 'prev') => {
    const row = genreRows.find(r => r.genreId === genreId);
    if (!row) return;
    let newPage = row.page;
    if (direction === 'next' && row.page < row.totalPages) newPage++;
    if (direction === 'prev' && row.page > 1) newPage--;

    if (newPage === row.page) return;

    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${newPage}`
      );
      const data = await res.json();
      const updatedRows = genreRows.map(r =>
        r.genreId === genreId
          ? { ...r, movies: data.results.slice(0, 5), page: newPage, totalPages: data.total_pages }
          : r
      );
      setGenreRows(updatedRows);
    } catch (err) {
      console.error(err);
      setAlertMessage('Error loading movies');
      setShowAlert(true);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    history.push('/login');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <Navbar />
          <IonButton slot="end" onClick={handleLogout}>Logout</IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dark-bg">
        {loading ? (
          <div className="centered"><IonSpinner name="crescent" /></div>
        ) : (
          <div className="page-container">

            {/* Favorites */}
            {favorites.length > 0 && (
              <section className="section">
                <h2 className="section-title">My Favorites</h2>
                <div className="movie-row">
                  {favorites.map(movie => (
                    <div key={movie.id} className="movie-card">
                      <img
                        src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                        alt={movie.title}
                      />
                      <IonIcon
                        icon={heart}
                        color="danger"
                        className="favorite-icon"
                        onClick={() => toggleFavorite(movie)}
                      />
                      <div className="movie-title-overlay">{movie.title}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Genre Rows */}
            {genreRows.map(row => (
              <section key={row.genreId} className="section">
                <div className="section-header-inline">
                  <h2 className="section-title">{genreMap[row.genreId]}</h2>
                  <div className="arrow-buttons">
                    <IonButton
                      fill="clear"
                      onClick={() => handleArrowClick(row.genreId, 'prev')}
                      disabled={row.page === 1}
                    >
                      <IonIcon icon={chevronBack} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      onClick={() => handleArrowClick(row.genreId, 'next')}
                      disabled={row.page === row.totalPages}
                    >
                      <IonIcon icon={chevronForward} />
                    </IonButton>
                  </div>
                </div>
                <div className="movie-row">
                  {row.movies.map(movie => {
                    const isFav = favorites.some(f => f.id === movie.id);
                    return (
                      <div key={movie.id} className="movie-card">
                        <img
                          src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                          alt={movie.title}
                        />
                        <IonIcon
                          icon={isFav ? heart : heartOutline}
                          color={isFav ? 'danger' : 'light'}
                          className="favorite-icon"
                          onClick={() => toggleFavorite(movie)}
                        />
                        <div className="movie-title-overlay">{movie.title}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Notification"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
