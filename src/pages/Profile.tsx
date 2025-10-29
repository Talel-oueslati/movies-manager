import React, { useEffect, useState } from 'react';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonItem, IonLabel, IonAvatar, IonButton, IonIcon,
  IonCard, IonCardContent, IonBackButton, IonButtons,
  IonInput, IonGrid, IonRow, IonCol
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
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const history = useHistory();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
            setEmail(userData.email);
            setAge(userData.age?.toString() || '');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setAlertMessage("Error loading user profile");
          setShowAlert(true);
        }
      } else {
        setUser(null);
        history.push("/login");
      }
    });

    return () => unsubscribe();
  }, [history]);

  const handleModify = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Add logic to save changes to Firebase if needed
    setIsEditing(false);
  };

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
                <IonAvatar style={{ width: "120px", height: "120px", margin: "20px auto" }}>
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
                <IonAvatar style={{ width: "120px", height: "120px", margin: "20px auto" }}>
                  <img
                    src="https://media.gqmagazine.fr/photos/603e6a8da9360b0585bcbc6a/16:9/w_2560%2Cc_limit/108387402"
                    alt="Default"
                  />
                </IonAvatar>
              )}
              <h2 style={{ color: "white", marginBottom: "20px" }}>
                {user.prénom} {user.nom}
              </h2>
              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <IonItem lines="full" className="profile-item">
                      <IonLabel style={{ color: "white", fontWeight: "bold" }}>
                        Email:
                      </IonLabel>
                      {isEditing ? (
                        <IonInput
                          value={email}
                          onIonChange={(e) => setEmail(e.detail.value!)}
                          style={{ color: "white", textAlign: "right" }}
                        />
                      ) : (
                        <IonLabel style={{ color: "white", textAlign: "right" }}>
                          {user.email}
                        </IonLabel>
                      )}
                    </IonItem>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12">
                    <IonItem lines="full" className="profile-item">
                      <IonLabel style={{ color: "white", fontWeight: "bold" }}>
                        Age:
                      </IonLabel>
                      {isEditing ? (
                        <IonInput
                          value={age}
                          type="number"
                          onIonChange={(e) => setAge(e.detail.value!)}
                          style={{ color: "white", textAlign: "right" }}
                        />
                      ) : (
                        <IonLabel style={{ color: "white", textAlign: "right" }}>
                          {user.age}
                        </IonLabel>
                      )}
                    </IonItem>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12" className="ion-text-center">
                    <IonItem><IonButton 
                      className="modify-btn" 
                      onClick={handleModify}
                    >
                      Modify
                    </IonButton>
                    <IonButton
                      disabled={!isEditing}
                      onClick={handleSave}
                      className="save-btn" 
                      style={{ marginLeft: "10px" }}
                    >
                      Save
                    </IonButton></IonItem>

              
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;