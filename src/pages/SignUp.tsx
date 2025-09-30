import React, { useState } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonItem, 
  IonInput, 
  IonButton, 
  IonLabel, 
  IonImg, 
  IonAlert,
  IonGrid,
  IonRow,
  IonCol 
} from '@ionic/react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User } from '../models/User';
import { Camera, CameraResultType } from '@capacitor/camera';

const SignUp: React.FC = () => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri
      });
      setPhoto(image.webPath || '');
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

// In your handleSignUp function in SignUp.tsx
const handleSignUp = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user: User = {
      uid: userCredential.user.uid,
      nom,
      prénom: prenom,
      email,
      age: parseInt(age),
      photo
    };

    // Save complete user data to Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), user);
    
    setAlertMessage('User created successfully!');
    setShowAlert(true);
    
  } catch (error: any) {
    console.error('Error creating user:', error);
    setAlertMessage(`Error: ${error.message}`);
    setShowAlert(true);
  }
};

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sign Up</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonItem>
                <IonLabel position="stacked">Nom *</IonLabel>
                <IonInput 
                  value={nom} 
                  onIonInput={(e: any) => setNom(e.detail.value!)}
                  placeholder="Enter your last name"
                />
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <IonItem>
                <IonLabel position="stacked">Prénom *</IonLabel>
                <IonInput 
                  value={prenom} 
                  onIonInput={(e: any) => setPrenom(e.detail.value!)}
                  placeholder="Enter your first name"
                />
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <IonItem>
                <IonLabel position="stacked">Email *</IonLabel>
                <IonInput 
                  type="email" 
                  value={email} 
                  onIonInput={(e: any) => setEmail(e.detail.value!)}
                  placeholder="Enter your email"
                />
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <IonItem>
                <IonLabel position="stacked">Age *</IonLabel>
                <IonInput 
                  type="number" 
                  value={age} 
                  onIonInput={(e: any) => setAge(e.detail.value!)}
                  placeholder="Enter your age"
                />
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <IonItem>
                <IonLabel position="stacked">Password *</IonLabel>
                <IonInput 
                  type="password" 
                  value={password} 
                  onIonInput={(e: any) => setPassword(e.detail.value!)}
                  placeholder="Enter your password"
                />
              </IonItem>
            </IonCol>
          </IonRow>
          
          <IonRow>
            <IonCol size="12">
              <IonButton expand="block" onClick={takePhoto}>
                Take Profile Photo
              </IonButton>
            </IonCol>
          </IonRow>

          {photo && (
            <IonRow>
              <IonCol size="12" className="ion-text-center">
                <IonImg src={photo} style={{ maxHeight: '200px', margin: '20px auto' }} />
              </IonCol>
            </IonRow>
          )}
          
          <IonRow>
            <IonCol size="12">
              <IonButton expand="block" onClick={handleSignUp}>
                Create Account
              </IonButton>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12" className="ion-text-center">
              <p>Already have an account? <a href="/login">Login</a></p>
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