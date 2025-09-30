import React, { useEffect, useState, useRef } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, 
  IonLabel, IonAvatar, IonIcon, IonButtons, IonAlert
} from '@ionic/react';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User } from '../models/User';
import { useHistory } from 'react-router-dom';
import { personCircle, chevronDown } from 'ionicons/icons';

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const history = useHistory();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            setAlertMessage('User profile not found in database');
            setShowAlert(true);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setAlertMessage('Error loading user profile');
          setShowAlert(true);
        }
      }
    };

    fetchUserData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      history.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    if (user) {
      history.push('/profile');
    } else {
      setAlertMessage('User data not available');
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
          <IonButtons slot="end">
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <IonButton 
                fill="clear" 
                className="flex items-center space-x-2"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {user?.photo ? (
                  <IonAvatar style={{ width: '32px', height: '32px' }}>
                    <img src={user.photo} alt="Profile" />
                  </IonAvatar>
                ) : (
                  <IonIcon icon={personCircle} size="large" />
                )}
                <IonIcon icon={chevronDown} size="small" />
              </IonButton>
              
              {/* Dropdown Menu */}
         {/* Dropdown Menu */}
{showDropdown && (
  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-300">
    <button
      onClick={handleProfileClick}
      className="flex items-center px-4 py-3 text-base font-medium text-gray-800 hover:bg-gray-100 hover:text-indigo-600 w-full text-left transition-colors duration-200"
    >
      <IonIcon icon={personCircle} className="mr-3 text-lg" />
      Profile
    </button>
    <button
      onClick={handleLogout}
      className="flex items-center px-4 py-3 text-base font-medium text-gray-800 hover:bg-gray-100 hover:text-red-600 w-full text-left transition-colors duration-200"
    >
      <IonIcon icon="log-out-outline" className="mr-3 text-lg" />
      Logout
    </button>
  </div>
)}

            </div>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Welcome to Your App! 🎉</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>You are successfully logged in.</p>
            
            {user ? (
              <IonItem>
                {user.photo && (
                  <IonAvatar slot="start">
                    <img src={user.photo} alt="Profile" />
                  </IonAvatar>
                )}
                <IonLabel>
                  <h2>{user.prénom} {user.nom}</h2>
                  <p>Email: {user.email}</p>
                  <p>Age: {user.age}</p>
                </IonLabel>
              </IonItem>
            ) : (
              <p>Loading user data...</p>
            )}
          </IonCardContent>
        </IonCard>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Notification'}
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;