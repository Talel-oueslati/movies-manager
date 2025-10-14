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
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { personOutline, mailOutline, lockClosedOutline, cameraOutline } from 'ionicons/icons';
import { useHistory } from 'react-router';
import { User } from '../models/User';
import './SignUp.css';
import logo from "../assets/movie-logoapp.png";

const SignUp: React.FC = () => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [photo, setPhoto] = useState<string>(''); // Base64 photo
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const history = useHistory();

  // For camera or gallery (works on mobile)
  const takeOrSelectPhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // user can choose camera or gallery
      });

      if (image.dataUrl) setPhoto(image.dataUrl);
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  // For desktop users (file picker)
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setPhoto(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Sign up logic
  const handleSignUp = async () => {
    try {
      if (!nom || !prenom || !email || !age || !password) {
        setAlertMessage('Please fill in all fields.');
        setShowAlert(true);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // We save the Base64 photo directly in Firestore
      const user: User = {
        uid: userCredential.user.uid,
        nom,
        prénom: prenom,
        email,
        age: parseInt(age),
        photo: photo || '', // base64 string
        favorites: [],
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
                <IonImg src={logo} alt="Movie App Logo" className="login-logo" />
                <h2 className="title">Create Account</h2>
                <p className="subtitle">Sign up to get started with our platform.</p>

                <IonItem className="input-item">
                  <IonIcon icon={personOutline} slot="start" style={{ color: "white" }} />
                  <IonInput style={{ color: "white" }}
                    value={nom}
                    placeholder="Last name"
                    onIonInput={(e: any) => setNom(e.detail.value!)}
                  />
                </IonItem>

                <IonItem className="input-item">
                  <IonIcon icon={personOutline} slot="start" style={{ color: "white" }} />
                  <IonInput style={{ color: "white" }}
                    value={prenom}
                    placeholder="First name"
                    onIonInput={(e: any) => setPrenom(e.detail.value!)}
                  />
                </IonItem>

                <IonItem className="input-item">
                  <IonIcon icon={mailOutline} slot="start" style={{ color: "white" }} />
                  <IonInput style={{ color: "white" }}
                    type="email"
                    value={email}
                    placeholder="Email"
                    onIonInput={(e: any) => setEmail(e.detail.value!)}
                  />
                </IonItem>

                <IonItem className="input-item">
                  <IonIcon icon={personOutline} slot="start" style={{ color: "white" }} />
                  <IonInput style={{ color: "white" }}
                    type="number"
                    value={age}
                    placeholder="Age"
                    onIonInput={(e: any) => setAge(e.detail.value!)}
                  />
                </IonItem>

                <IonItem className="input-item">
                  <IonIcon icon={lockClosedOutline} slot="start" style={{ color: "white" }} />
                  <IonInput style={{ color: "white" }}
                    type="password"
                    value={password}
                    placeholder="Password"
                    onIonInput={(e: any) => setPassword(e.detail.value!)}
                  />
                </IonItem>

         {/* Hidden input to trigger file selection */}
<input
  type="file"
  accept="image/*"
  id="photoInput"
  onChange={handleFileInput}
  style={{ display: 'none' }}
/>

{/* Single visible button */}
<IonButton
  expand="block"
  className="signup-btn"
  onClick={() => document.getElementById('photoInput')?.click()}
>
  <IonIcon icon={cameraOutline} slot="start" />
  Take or Choose Photo
</IonButton>

                {photo && (
                  <div className="photo-preview">
                    <IonImg src={photo} className="signup-photo" />
                  </div>
                )}

                <IonButton expand="block" className="signup-btn primary" onClick={handleSignUp}>
                  Create Account
                </IonButton>

                <p className="signup-link" style={{ color: "white" }}>
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
