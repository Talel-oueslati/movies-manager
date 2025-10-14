import React, { useEffect, useState } from 'react';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonItem, IonLabel, IonAvatar, IonButton, IonIcon,
  IonCard, IonCardContent, IonBackButton, IonButtons
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User } from '../models/User';
import { useHistory } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import './profile.css';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const history = useHistory();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setAlertMessage("Error loading user profile");
          setShowAlert(true);
        }
      } else {
        // No user logged in → redirect or clear state
        setUser(null);
        history.push("/login");
      }
    });

    return () => unsubscribe();
  }, [history]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle style={{ color: "white" }}>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" fullscreen>
        {user && (
          <IonCard>
            <IonCardContent className="ion-text-center">
              {user.photo ? (
                <IonAvatar style={{ width: "100px", height: "100px", margin: "20px auto" }}>
                  <img
                    src={
                      user.photo && !user.photo.startsWith("blob:")
                        ? user.photo
                        : "https://media.gqmagazine.fr/photos/603e6a8da9360b0585bcbc6a/16:9/w_2560%2Cc_limit/108387402"
                    }
                    alt="Profile"
                  />
                </IonAvatar>
              ) : (
                <IonAvatar style={{ width: "100px", height: "100px", margin: "20px auto" }}>
                  <img
                    src="https://media.gqmagazine.fr/photos/603e6a8da9360b0585bcbc6a/16:9/w_2560%2Cc_limit/108387402"
                    alt="Default"
                  />
                </IonAvatar>
              )}
              <h2 style={{ color: "white" }}>
                {user.prénom} {user.nom}
              </h2>
              <IonItem lines="none">
                <IonLabel style={{ color: "white" }}>
                  <strong>Email:</strong> <span>{user.email}</span>
                </IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel style={{ color: "white" }}>
                  <strong>Age:</strong> <span>{user.age}</span>
                </IonLabel>
              </IonItem>
              <IonButton className="modify-btn">Modify</IonButton>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;