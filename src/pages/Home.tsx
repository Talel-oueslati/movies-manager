import React, { useEffect, useState } from 'react';
import {
  IonPage, IonContent, IonButton,
  IonIcon, IonSpinner, IonAlert,
  IonImg
} from '@ionic/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { heart, heartOutline, chevronBack, chevronForward, personCircle, logOutOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Home.css';
import logo from "../assets/movie-logoapp.png";

const TMDB_API_KEY = '2ee8239d9aa958acaf92d9552bd28587';

const genreMap: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

// =================== Interfaces ===================
interface Movie {
  id: string | number;
  title: string;
  poster_path?: string;
  posterBase64?: string;
  genre?: string;
  genre_ids?: number[];
  release_date?: string;
  description?: string;
  addedByAdmin?: boolean;
}

interface TMDbMovie {
  id: number;
  title: string;
  poster_path?: string;
  genre_ids?: number[];
  release_date?: string;
  overview?: string;
}

interface GenreRow {
  genreId: number;
  movies: Movie[];
  page: number;
  totalPages: number;
}

interface MatchedUser {
  uid: string;
  prénom: string;
  nom: string;
  photo?: string;
  email?: string;
  favorites?: Movie[];
  matchPercentage: number;
}

const genresToShow = [28, 12, 16, 35, 80, 18, 14, 10749, 878];

const Home: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [adminMovies, setAdminMovies] = useState<Movie[]>([]);
  const [genreRows, setGenreRows] = useState<GenreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showMatchedUserPopup, setShowMatchedUserPopup] = useState<number | null>(null);
  const history = useHistory();

  // ================= User Auth =================
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
    setDropdownOpen(false);
  };

  const handleProfileClick = () => {
    if (user) history.push('/profile');
    setDropdownOpen(false);
  };

  // ================= Fetch Admin Movies =================
  useEffect(() => {
    const fetchAdminMovies = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'movies'));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          addedByAdmin: true,
        })) as Movie[];
        setAdminMovies(data);
      } catch (err) {
        console.error("Error fetching admin movies:", err);
      }
    };
    fetchAdminMovies();
  }, []);

  // ================= Fetch TMDb Movies (initial load) =================
  useEffect(() => {
    const fetchGenreMovies = async () => {
      setLoading(true);
      try {
        const rows: GenreRow[] = [];
        for (let genreId of genresToShow) {
          const res = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=1`
          );
          const data: { results: TMDbMovie[]; total_pages: number } = await res.json();

          const adminInGenre = adminMovies.filter(
            (m) => m.genre?.toLowerCase() === genreMap[genreId]?.toLowerCase()
          );

          const combinedMovies: Movie[] = [
            ...adminInGenre,
            ...data.results
              .filter(
                (tmdb: TMDbMovie) =>
                  !adminInGenre.some(ad => ad.title?.toLowerCase() === tmdb.title?.toLowerCase())
              )
              .map((tmdb) => ({
                id: tmdb.id,
                title: tmdb.title,
                poster_path: tmdb.poster_path,
                genre_ids: tmdb.genre_ids,
                release_date: tmdb.release_date,
                description: tmdb.overview,
                addedByAdmin: false,
              }))
          ];

          rows.push({
            genreId,
            movies: combinedMovies,
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
  }, [adminMovies]);

  // ================= Matching Users =================
  useEffect(() => {
    const fetchMatchedUsers = async () => {
      if (!user || !favorites.length) return;
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const matchedUsersList: MatchedUser[] = [];

        snapshot.forEach(docSnap => {
          const u = docSnap.data();
          if (u.uid === user.uid || !u.favorites || u.favorites.length === 0) return;

          const common = u.favorites.filter((f: any) =>
            favorites.some(f2 => f2.id === f.id)
          ).length;
          const percent = (common / favorites.length) * 100;

          if (percent >= 75) {
            matchedUsersList.push({
              uid: u.uid,
              prénom: u.prénom,
              nom: u.nom,
              photo: u.photo,
              email: u.email,
              favorites: u.favorites,
              matchPercentage: percent
            });
          }
        });

        // Sort by highest match percentage first
        matchedUsersList.sort((a, b) => b.matchPercentage - a.matchPercentage);
        setMatchedUsers(matchedUsersList);
      } catch (err) {
        console.error('Error fetching matched users', err);
      }
    };
    fetchMatchedUsers();
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

  // ================= Contact Button Handler =================
  const handleContact = (email?: string) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    } else {
      setAlertMessage('No email available for this user');
      setShowAlert(true);
    }
    setShowMatchedUserPopup(null);
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
      const res = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${newPage}`
      );
      const data: { results: TMDbMovie[]; total_pages: number } = await res.json();

      // Keep admin movies constant
      const adminInGenre = adminMovies.filter(
        (m) => m.genre?.toLowerCase() === genreMap[genreId]?.toLowerCase()
      );

      // Combine admin + current page TMDb
      const combinedMovies: Movie[] = [
        ...adminInGenre,
        ...data.results
          .filter(
            (tmdb: TMDbMovie) =>
              !adminInGenre.some(ad => ad.title?.toLowerCase() === tmdb.title?.toLowerCase())
          )
          .map((tmdb) => ({
            id: tmdb.id,
            title: tmdb.title,
            poster_path: tmdb.poster_path,
            genre_ids: tmdb.genre_ids,
            release_date: tmdb.release_date,
            description: tmdb.overview,
            addedByAdmin: false,
          }))
      ];

      const updatedRows = genreRows.map(r =>
        r.genreId === genreId
          ? { ...r, movies: combinedMovies, page: newPage, totalPages: data.total_pages }
          : r
      );
      setGenreRows(updatedRows);
    } catch (err) {
      console.error(err);
      setAlertMessage('Error loading movies');
      setShowAlert(true);
    }
  };

  // ================= Render =================
  return (
    <IonPage>
      {/* Navbar */}
      <div className="navbar" style={{ marginTop: '-20px', backgroundColor: '#1a1a1a' }}></div>
      <div
        className="navbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1a1a1a',
          zIndex: 999,
          height: '60px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        }}
      >
        <div className="navbar-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <IonImg src={logo} alt="Movie Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </div>

        <div
          className="navbar-user"
          style={{ display: 'flex', alignItems: 'center', position: 'relative', cursor: 'pointer' }}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img
            src={
              user?.photo && !user.photo.startsWith("blob:")
                ? user.photo
                : "https://media.gqmagazine.fr/photos/603e6a8da9360b0585bcbc6a/16:9/w_2560%2Cc_limit/108387402"
            }
            alt="User"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "2px solid white",
              marginRight: "8px",
              objectFit: "cover",
            }}
          />
          <span style={{ color: 'white', fontWeight: '500' }}>
            {user?.prénom} {user?.nom}
          </span>

          <div
            className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}
            style={{
              position: 'absolute',
              top: 'calc(100% + 5px)',
              right: 0,
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              overflow: 'hidden',
              display: dropdownOpen ? 'block' : 'none',
              minWidth: '140px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              zIndex: 1000,
            }}
          >
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li className="dropdown-item" onClick={handleProfileClick} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <IonIcon icon={personCircle} style={{ color: 'white', fontSize: '20px' }} />
                <span style={{ color: 'white' }}>Profile</span>
              </li>
              <li className="dropdown-item" onClick={handleLogout} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <IonIcon icon={logOutOutline} style={{ color: 'white', fontSize: '20px' }} />
                <span style={{ color: 'white' }}>Logout</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <br /><br /><br /><br />

      {/* Content */}
      <IonContent fullscreen className="main-content" style={{ paddingTop: '60px', backgroundColor: '#000000' }}>
        {loading ? (
          <div className="centered"><IonSpinner name="crescent" /></div>
        ) : (
          <div className="page-container">
            {/* ❤️ Favorites */}
            {favorites.length > 0 && (
              <section className="section">
                <div className="section-header-inline" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 className="section-title">My Favorites</h2>
                  {matchedUsers.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'white', fontSize: '14px', marginRight: '8px' }}>
                        Matched Users:
                      </span>
                      {matchedUsers.map((matchedUser, index) => (
                        <div 
                          key={matchedUser.uid}
                          style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center',
                            position: 'relative'
                          }} 
                          onMouseEnter={() => setShowMatchedUserPopup(index)}
                          onMouseLeave={() => setShowMatchedUserPopup(null)}
                        >
                          <img
                            src={
                              matchedUser?.photo && !matchedUser.photo.startsWith("blob:")
                                ? matchedUser.photo
                                : "https://media.gqmagazine.fr/photos/603e6a8da9360b0585bcbc6a/16:%2Cc_limit/aa"
                            }
                            alt="User"
                            style={{
                              width: "37px",
                              height: "37px",
                              borderRadius: "50%",
                              border: `2px solid ${matchedUser.matchPercentage >= 90 ? '#00ff00' : matchedUser.matchPercentage >= 80 ? '#ffff00' : '#ffa500'}`,
                            }}
                          />
                          
                          {/* Hover Popup */}
                          {showMatchedUserPopup === index && (
                            <div 
                              style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                backgroundColor: '#1a1a1a',
                                borderRadius: '8px',
                                padding: '12px',
                                minWidth: '180px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                zIndex: 1000,
                                border: '1px solid #333',
                                marginTop: '5px'
                              }}
                            >
                              <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>
                                {matchedUser.prénom} {matchedUser.nom}
                              </div>
                              <div style={{ 
                                color: matchedUser.matchPercentage >= 90 ? '#00ff00' : 
                                       matchedUser.matchPercentage >= 80 ? '#ffff00' : '#ffa500',
                                fontSize: '12px', 
                                marginBottom: '8px',
                                fontWeight: 'bold'
                              }}>
                                Match: {Math.round(matchedUser.matchPercentage)}%
                              </div>
                              <div style={{ color: '#ccc', fontSize: '11px', marginBottom: '8px' }}>
                                {matchedUser.favorites?.length || 0} favorites in common
                              </div>
                              <IonButton 
                                size="small" 
                                fill="solid" 
                                color="primary"
                                onClick={() => handleContact(matchedUser.email)}
                                style={{ 
                                  width: '100%',
                                  '--background': '#e50914',
                                  '--background-hover': '#b2070f'
                                }}
                              >
                                Contact
                              </IonButton>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="movie-row">
                  {favorites.map(movie => (
                    <div key={movie.id} className="movie-card">
                      <img src={movie.posterBase64 || `https://image.tmdb.org/t/p/w300${movie.poster_path}`} alt={movie.title} />
                      <IonIcon icon={heart} color="danger" className="favorite-icon" onClick={() => toggleFavorite(movie)} />
                      <div className="movie-title-overlay" style={{ color: 'white' }}>{movie.title}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Genre Rows (TMDB + Admin) */}
            {genreRows.map(row => (
              <section key={row.genreId} className="section">
                <div className="section-header-inline">
                  <h2 className="section-title">{genreMap[row.genreId]}</h2>
                  <div className="arrow-buttons">
                    <IonButton fill="clear" style={{ color: 'white' }} onClick={() => handleArrowClick(row.genreId, 'prev')} disabled={row.page === 1}>
                      <IonIcon icon={chevronBack} />
                    </IonButton>
                    <IonButton fill="clear" style={{ color: 'white' }} onClick={() => handleArrowClick(row.genreId, 'next')} disabled={row.page === row.totalPages}>
                      <IonIcon icon={chevronForward} />
                    </IonButton>
                  </div>
                </div>
                <div className="movie-row">
                  {row.movies.map(movie => {
                    const isFav = favorites.some(f => f.id === movie.id);
                    const posterSrc = movie.posterBase64 || (movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : "../assets/default.jpg");
                    return (
                      <div key={movie.id} className="movie-card">
                        <img src={posterSrc} alt={movie.title} />
                        <IonIcon
                          icon={isFav ? heart : heartOutline}
                          color={isFav ? 'danger' : 'light'}
                          className="favorite-icon"
                          onClick={() => toggleFavorite(movie)}
                        />
                        <div className="movie-title-overlay" style={{ color: 'white' }}>{movie.title}</div>
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