import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonInput, IonLabel, IonItem, IonTextarea,
  IonSelect, IonSelectOption, IonAlert, IonSpinner
} from '@ionic/react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { useHistory } from 'react-router-dom';
import { auth, db } from '../../firebaseConfig';
import Navbar from '../Navbar';
import './admin-dashboard.css';
interface User {
  uid: string;
  nom: string;
  prénom: string;
  email: string;
  age: number;
  role: 'user' | 'admin';
  active?: boolean;
}

interface Movie {
  id?: string;
  title: string;
  poster_path: string;
  genre_ids: number[];
  release_date: string;
}

const genreMap: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newMovie, setNewMovie] = useState<Movie>({
    title: '',
    poster_path: '',
    genre_ids: [],
    release_date: ''
  });
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const history = useHistory();

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const usersList: User[] = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...(doc.data() as any)
        }));
        setUsers(usersList);
      } catch (error) {
        console.error(error);
        setAlertMessage('Error fetching users');
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Toggle user active status
  const toggleUserActive = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { active: !user.active });
      setUsers(users.map(u => u.uid === user.uid ? { ...u, active: !u.active } : u));
    } catch (error) {
      console.error(error);
      setAlertMessage('Error updating user');
      setShowAlert(true);
    }
  };

  // Add new movie
  const handleAddMovie = async () => {
    if (!newMovie.title || !newMovie.poster_path || !newMovie.genre_ids.length || !newMovie.release_date) {
      setAlertMessage('Please fill all movie fields');
      setShowAlert(true);
      return;
    }
    try {
      await addDoc(collection(db, 'movies'), newMovie);
      setAlertMessage('Movie added successfully!');
      setShowAlert(true);
      setNewMovie({ title: '', poster_path: '', genre_ids: [], release_date: '' });
    } catch (error) {
      console.error(error);
      setAlertMessage('Error adding movie');
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

      <IonContent className="ion-padding">
        <h2>Admin Dashboard</h2>

        {/* Users Table */}
        <section style={{ marginBottom: '30px' }}>
          <h3>Manage Users</h3>
          {loading ? <IonSpinner name="crescent" /> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #555' }}>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.uid} style={{ borderBottom: '1px solid #333' }}>
                    <td>{user.prénom} {user.nom}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.active ? 'Active' : 'Disabled'}</td>
                    <td>
                      <IonButton size="small" onClick={() => toggleUserActive(user)}>
                        {user.active ? 'Disable' : 'Enable'}
                      </IonButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Add Movie Form */}
        <section>
          <h3>Add New Movie</h3>
          <IonItem>
            <IonLabel position="floating">Title</IonLabel>
            <IonInput
              value={newMovie.title}
              onIonChange={e => setNewMovie({ ...newMovie, title: e.detail.value! })}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="floating">Poster URL</IonLabel>
            <IonInput
              value={newMovie.poster_path}
              onIonChange={e => setNewMovie({ ...newMovie, poster_path: e.detail.value! })}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Genres</IonLabel>
            <IonSelect
              value={newMovie.genre_ids}
              multiple
              onIonChange={e => setNewMovie({ ...newMovie, genre_ids: e.detail.value })}
            >
              {Object.entries(genreMap).map(([id, name]) => (
                <IonSelectOption key={id} value={Number(id)}>{name}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="floating">Release Date</IonLabel>
            <IonInput
              type="date"
              value={newMovie.release_date}
              onIonChange={e => setNewMovie({ ...newMovie, release_date: e.detail.value! })}
            />
          </IonItem>
          <IonButton expand="block" style={{ marginTop: '10px' }} onClick={handleAddMovie}>Add Movie</IonButton>
        </section>

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

export default AdminDashboard;
