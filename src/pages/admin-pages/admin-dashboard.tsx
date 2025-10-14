import React, { useEffect, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonButton, IonLabel, IonItem, IonList, IonSpinner, IonAlert,
  IonIcon,
  IonImg
} from "@ionic/react";
import { collection, getDocs, updateDoc, doc, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import "./admin-dashboard.css";

import logo from "../../assets/movie-logoapp.png";

import { auth, db } from "../../firebaseConfig";
import { logOutOutline, personCircle } from "ionicons/icons";
import { useHistory } from "react-router";
import { Movie } from "../../models/Movie";
import { onAuthStateChanged, signOut } from "firebase/auth";

interface User {
  uid: string;
  nom: string;
  prénom: string;
  email: string;
  active: boolean;
  role?: string;
}

interface GenreRow {
  genreId: number;
  movies: Movie[];
  page: number;
  totalPages: number;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [adminMovies, setAdminMovies] = useState<Movie[]>([]);
  const [genreRows, setGenreRows] = useState<GenreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const history = useHistory();

  // Movie form states
  const [movieTitle, setMovieTitle] = useState("");
  const [movieGenre, setMovieGenre] = useState("");
  const [moviePosterFile, setMoviePosterFile] = useState<File | null>(null);
  const [moviePosterPreview, setMoviePosterPreview] = useState<string>("");
  const [movieDescription, setMovieDescription] = useState("");

  // Fetch current admin
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

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userList: User[] = querySnapshot.docs.map(doc => ({
          ...(doc.data() as User),
          uid: doc.id, // ensure uid comes from doc.id
        }));
        setUsers(userList);
      } catch (err) {
        console.error("Error fetching users:", err);
        setAlertMessage("Failed to load users. Check your Firestore rules.");
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Toggle active status
  const toggleUserActive = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", uid), { active: !currentStatus });
      setUsers(users.map(u => (u.uid === uid ? { ...u, active: !currentStatus } : u)));
    } catch (err) {
      console.error(err);
      setAlertMessage("Error updating user status");
      setShowAlert(true);
    }
  };

  // Handle movie poster file input (desktop)
  const handleMoviePosterFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMoviePosterFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setMoviePosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new movie
  const handleAddMovie = async () => {
    if (!movieTitle || !movieGenre) {
      setAlertMessage("Please fill in the movie title and genre.");
      setShowAlert(true);
      return;
    }

    try {
      let posterBase64 = "";
      if (moviePosterFile) {
        posterBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(moviePosterFile);
        });
      }

      await addDoc(collection(db, "movies"), {
        title: movieTitle,
        genre: movieGenre,
        posterBase64: posterBase64 || "",
        description: movieDescription || "",
        createdAt: serverTimestamp(),
      });

      setAlertMessage("Movie added successfully!");
      setShowAlert(true);
      setMovieTitle("");
      setMovieGenre("");
      setMoviePosterFile(null);
      setMoviePosterPreview("");
      setMovieDescription("");
    } catch (err) {
      console.error(err);
      setAlertMessage("Error adding movie");
      setShowAlert(true);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    history.push('/login');
    setDropdownOpen(false);
  };

  const handleProfileClick = () => {
    if (user) history.push('/profile');
    setDropdownOpen(false);
  };

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

  return (
    <IonPage>
      <div className="navbar">
        <div className="navbar-logo">
          <IonImg src={logo} alt="Movie Logo" className="logo-image" />
        </div>
        <div className="navbar-user" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <UserAvatar user={user} size="40px" />
          <span className="user-name">{user?.prénom} {user?.nom}</span>
          <div className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
            <ul>
              <li className="dropdown-item" onClick={handleProfileClick}>
                <IonIcon icon={personCircle} className="dropdown-icon" style={{ color: 'white' }} />
                <span style={{ color: 'white' }}>Profile</span>
              </li>
              <li className="dropdown-item" onClick={handleLogout}>
                <IonIcon style={{ color: 'white' }} icon={logOutOutline} className="dropdown-icon" />
                <span style={{ color: 'white' }}>Logout</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <IonContent className="admin-dashboard">
        {loading ? (
          <div className="centered"><IonSpinner name="crescent" /></div>
        ) : (
          <>
            {/* Add Movie Section */}
            <section className="add-movie-section">
              <h2>Add New Movie</h2>
              <div className="add-movie-form">
                <IonInput
                  label="Title"
                  value={movieTitle}
                  onIonChange={e => setMovieTitle(e.detail.value!)}
                  placeholder="Enter movie title"
                />
                <IonInput
                  label="Genre"
                  value={movieGenre}
                  onIonChange={e => setMovieGenre(e.detail.value!)}
                  placeholder="e.g. Action, Comedy, Drama"
                />
                <input type="file" accept="image/*" onChange={handleMoviePosterFile} />
                {moviePosterPreview && (
                  <IonImg src={moviePosterPreview} style={{ width: "120px", margin: "10px 0", borderRadius: "5px" }} />
                )}
                <IonInput
                  label="Description"
                  value={movieDescription}
                  onIonChange={e => setMovieDescription(e.detail.value!)}
                  placeholder="(optional)"
                />
                <IonButton expand="block" onClick={handleAddMovie}>
                  ➕ Add Movie
                </IonButton>
              </div>
            </section>

            {/* User Management Section */}
            <section className="user-list-section">
              <h2>Manage Users</h2>
              <IonList>
                {users.map(u => (
                  <IonItem key={u.uid} className="user-item">
                    <IonLabel>
                      <strong style={{ color: '#000000ff' }}>{u.nom} {u.prénom}</strong><br />
                      <small style={{ color: '#000000ff' }}>{u.email}</small>
                    </IonLabel>
                    <IonButton
                      color={u.active ? "danger" : "success"}
                      onClick={() => toggleUserActive(u.uid, u.active)}
                    >
                      {u.active ? "Deactivate" : "Activate"}
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>
            </section>
          </>
        )}

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Notification"
          message={alertMessage}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
