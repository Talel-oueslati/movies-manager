import React, { useEffect, useState } from 'react';
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

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const history = useHistory();

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {user && (
          <IonCard>
            <IonCardContent className="ion-text-center">
              {user.photo && (
                <IonAvatar style={{ width: '100px', height: '100px', margin: '20px auto' }}>
                  <img src={user.photo} alt="Profile" />
                </IonAvatar>
              )}
              <h2>{user.prénom} {user.nom}</h2>
              <IonItem>
                <IonLabel>
                  <strong>Email:</strong> {user.email}
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <strong>Age:</strong> {user.age}
                </IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;