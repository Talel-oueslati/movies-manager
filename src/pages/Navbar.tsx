import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonButton,
  IonIcon, IonSpinner, IonAlert, IonContent
} from '@ionic/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { heart, heartOutline, chevronBack, chevronForward, personCircle, menuOutline, logOutOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Home.css';

const TMDB_API_KEY = '2ee8239d9aa958acaf92d9552bd28587';

const genreMap: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

interface Movie {
  id: string | number;
  title: string;
  poster_path: string;
  genre_ids?: number[];
  release_date?: string;
  addedByAdmin?: boolean;
}

interface GenreRow {
  genreId: number;
  movies: Movie[];
  page: number;
  totalPages: number;
}

const genresToShow = [28, 12, 16, 35, 80, 18, 14, 10749, 878];

// User Avatar Component with Fallback
const UserAvatar: React.FC<{ user: any; size?: string }> = ({ user, size = '40px' }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="user-avatar" style={{ width: size, height: size }}>
      {user?.photo && !imageError ? (
        <img
          src={user.photo}
          alt={`${user?.prénom} ${user?.nom}`}
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
          onError={() => setImageError(true)}
        />
      ) : (
        <IonIcon 
          icon={personCircle} 
          style={{ fontSize: size, color: '#fff' }}
        />
      )}
    </div>
  );
};

const Home: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [adminMovies, setAdminMovies] = useState<Movie[]>([]);
  const [genreRows, setGenreRows] = useState<GenreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const history = useHistory();

  // ================= User Auth Logic =================
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

  const handleLogout = async () => {
    await signOut(auth);
    history.push('/login');
  };

  const handleProfileClick = () => {
    if (user) history.push('/profile');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // ================= Admin Featured =================
  useEffect(() => {
    const fetchAdminMovies = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'movies'));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          addedByAdmin: true
        })) as Movie[];
        setAdminMovies(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAdminMovies();
  }, []);

  // ================= TMDb Genre Movies =================
  useEffect(() => {
    const fetchGenreMovies = async () => {
      setLoading(true);
      try {
        const rows: GenreRow[] = [];
        for (let genreId of genresToShow) {
          const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=1`);
          const data = await res.json();
          rows.push({
            genreId,
            movies: data.results.slice(0, 5),
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

  // ================= Matched User Logic =================
  useEffect(() => {
    const fetchMatchedUser = async () => {
      if (!user || !favorites.length) return;
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        let bestMatch = null;
        let highestPercent = 0;

        snapshot.forEach(docSnap => {
          const u = docSnap.data();
          if (u.uid === user.uid || !u.favorites) return;
          const common = u.favorites.filter((f:any) => favorites.some(f2 => f2.id === f.id)).length;
          const percent = (common / favorites.length) * 100;
          if (percent >= 70 && percent > highestPercent) {
            highestPercent = percent;
            bestMatch = u;
          }
        });

        setMatchedUser(bestMatch);
      } catch (err) {
        console.error('Error fetching matched user', err);
      }
    };
    fetchMatchedUser();
  }, [user, favorites]);

  // ================= Favorites =================
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

  // ================= Genre Pagination =================
  const handleArrowClick = async (genreId: number, direction: 'next' | 'prev') => {
    const row = genreRows.find(r => r.genreId === genreId);
    if (!row) return;
    let newPage = row.page;
    if (direction === 'next' && row.page < row.totalPages) newPage++;
    if (direction === 'prev' && row.page > 1) newPage--;
    if (newPage === row.page) return;

    try {
      const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${newPage}`);
      const data = await res.json();
      const updatedRows = genreRows.map(r => r.genreId === genreId
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

  return (
    <IonPage>
      {/* ================= Simple Sidebar ================= */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <UserAvatar user={user} size="50px" />
            <div className="user-info">
              <span className="user-name">{user?.prénom} {user?.nom}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <div className="nav-item" onClick={handleProfileClick}>
              <IonIcon icon={personCircle} className="nav-icon" />
              <span>Profile</span>
            </div>
            <div className="nav-item logout-btn" onClick={handleLogout}>
              <IonIcon icon={logOutOutline} className="nav-icon" />
              <span>Logout</span>
            </div>
          </nav>
        </div>
        
        {/* Overlay to close sidebar when clicking outside */}
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      </div>

      {/* ================= Main Content ================= */}
      <IonContent className="main-content">
        {/* Simple Header */}
        <IonHeader className="simple-header">
          <IonToolbar color="dark">
            <div className="header-content">
              <IonIcon 
                icon={menuOutline} 
                className="menu-icon"
                onClick={toggleSidebar}
              />
              <div className="profile-section" onClick={handleProfileClick}>
                <UserAvatar user={user} size="35px" />
                <span className="profile-name">{user?.prénom} {user?.nom}</span>
              </div>
            </div>
          </IonToolbar>
        </IonHeader>

        {loading ? (
          <div className="centered"><IonSpinner name="crescent" /></div>
        ) : (
          <div className="page-container">

            {/* 🎬 Featured by Admin */}
            {adminMovies.length > 0 && (
              <section className="section">
                <div className="section-header-inline">
                  <h2 className="section-title">🎬 Featured by Admin</h2>
                </div>
                <div className="movie-row">
                  {adminMovies.map(movie => {
                    const isFav = favorites.some(f => f.id === movie.id);
                    return (
                      <div key={movie.id} className="movie-card">
                        <img src={movie.poster_path || '../assets/d2.jpg'} alt={movie.title} />
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
            )}

            {/* ❤️ Favorites Section */}
            {favorites.length > 0 && (
              <section className="section">
                <div className="section-header-inline" style={{ alignItems: 'center' }}>
                  <h2 className="section-title">My Favorites</h2>
                  {matchedUser && (
                    <div className="matched-user">
                      <UserAvatar user={matchedUser} size="40px" />
                    </div>
                  )}
                </div>
                <div className="movie-row">
                  {favorites.map(movie => (
                    <div key={movie.id} className="movie-card">
                      <img src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} alt={movie.title} />
                      <IonIcon icon={heart} color="danger" className="favorite-icon" onClick={() => toggleFavorite(movie)} />
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
                    <IonButton fill="clear" onClick={() => handleArrowClick(row.genreId, 'prev')} disabled={row.page === 1}>
                      <IonIcon icon={chevronBack} />
                    </IonButton>
                    <IonButton fill="clear" onClick={() => handleArrowClick(row.genreId, 'next')} disabled={row.page === row.totalPages}>
                      <IonIcon icon={chevronForward} />
                    </IonButton>
                  </div>
                </div>
                <div className="movie-row">
                  {row.movies.map(movie => {
                    const isFav = favorites.some(f => f.id === movie.id);
                    return (
                      <div key={movie.id} className="movie-card">
                        <img src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} alt={movie.title} />
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