import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonLabel,
  IonImg,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonIcon,
} from '@ionic/react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Camera, CameraResultType } from '@capacitor/camera';
import { personOutline, mailOutline, lockClosedOutline, cameraOutline } from 'ionicons/icons';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

import './SignUp.css';
import { useHistory } from 'react-router';
import { User } from '../models/User';

const SignUp: React.FC = () => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const history = useHistory();

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
      });
      setPhoto(image.webPath || '');
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user: User = {
        uid: userCredential.user.uid,
        nom,
        prénom: prenom,
        email,
        age: parseInt(age),
        photo,
        favorites: []
    
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), user);

      setAlertMessage('User created successfully!');
      setShowAlert(true);
        history.push('/home');
    } catch (error: any) {
      console.error('Error creating user:', error);
      setAlertMessage(`Error: ${error.message}`);
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonContent className="signup-wrapper">
        <IonGrid className="signup-card">
          <IonRow>
            {/* Left Section: Form */}
            <IonCol size="12" sizeMd="6" className="form-section">
              <div className="form-wrapper">
                <h2 className="title">Create Account</h2>
                <p className="subtitle">Sign up to get started with our platform.</p>

                <IonItem className="input-item">
                  <IonIcon icon={personOutline} slot="start" />
                  <IonInput
                    value={nom}
                    placeholder="Last name"
                    onIonInput={(e: any) => setNom(e.detail.value!)}
                  />
                </IonItem>

                <IonItem className="input-item">
                  <IonIcon icon={personOutline} slot="start" />
                  <IonInput
                    value={prenom}
                    placeholder="First name"
                    onIonInput={(e: any) => setPrenom(e.detail.value!)}
                  />
                </IonItem>

                <IonItem className="input-item">
                  <IonIcon icon={mailOutline} slot="start" />
                  <IonInput
                    type="email"
                    value={email}
                    placeholder="Email"
                    onIonInput={(e: any) => setEmail(e.detail.value!)}
                  />
                </IonItem>

                <IonItem className="input-item">
                  <IonIcon icon={personOutline} slot="start" />
                  <IonInput
                    type="number"
                    value={age}
                    placeholder="Age"
                    onIonInput={(e: any) => setAge(e.detail.value!)}
                  />
                </IonItem>

                <IonItem className="input-item">
                  <IonIcon icon={lockClosedOutline} slot="start" />
                  <IonInput
                    type="password"
                    value={password}
                    placeholder="Password"
                    onIonInput={(e: any) => setPassword(e.detail.value!)}
                  />
                </IonItem>

                <IonButton expand="block" className="signup-btn secondary" onClick={takePhoto}>
                  <IonIcon icon={cameraOutline} slot="start" />
                  Take Profile Photo
                </IonButton>

                {photo && (
                  <div className="photo-preview">
                    <IonImg src={photo} className="signup-photo" />
                  </div>
                )}

                <IonButton expand="block" className="signup-btn primary" onClick={handleSignUp}>
                  Create Account
                </IonButton>

                <p className="signup-link">
                  Already have an account? <a href="/login">Login</a>
                </p>
              </div>
            </IonCol>

            {/* Right Section */}
            <IonCol size="12" sizeMd="6" className="decor-section">
              <div className="decor-content">
                <h3>Your data, your rules</h3>
                <p>Create an account and take control of your experience securely.</p>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

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

export default SignUp;
