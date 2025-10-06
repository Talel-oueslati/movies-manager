import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonLabel,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonItem,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons
} from '@ionic/react';
import { logoGoogle, logoFacebook, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { useHistory } from 'react-router-dom';

import './login.css';
import Navbar from './Navbar';
import { User } from '../models/User';
import { doc, getDoc } from 'firebase/firestore';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const history = useHistory();

  // const handleLogin = async () => {
  //   if (!email || !password) {
  //     setAlertMessage('Please enter both email and password');
  //     setShowAlert(true);
  //     return;
  //   }

  //   try {
  //     await signInWithEmailAndPassword(auth, email, password);
  //     history.push('/home');
  //   } catch (error: any) {
  //     setAlertMessage(`Login failed: ${error.message}`);
  //     setShowAlert(true);
  //   }
  // };
const handleLogin = async () => {
  if (!email || !password) {
    setAlertMessage('Please enter both email and password');
    setShowAlert(true);
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const currentUser = userCredential.user;

    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

    if (!userDoc.exists()) {
      setAlertMessage('User data not found.');
      setShowAlert(true);
      return;
    }

    const userData = userDoc.data() as User;

    // Check if user is active
    if (userData.active === false) {
      setAlertMessage('Your account is disabled. Contact admin.');
      setShowAlert(true);
      await signOut(auth); // log out the disabled user
      return;
    }

    // Redirect based on role
    if (userData.role === 'admin') {
      history.push('/admin-dashboard'); // go to admin page
    } else {
      history.push('/home'); // normal user
    }

  } catch (error: any) {
    setAlertMessage(`Login failed: ${error.message}`);
    setShowAlert(true);
  }
};

  return (
    <IonPage>
      <IonHeader>
  <IonToolbar>
    <IonTitle>Home</IonTitle>
    <IonButtons slot="end">
      <Navbar />
    </IonButtons>
  </IonToolbar>
</IonHeader>
      <IonContent className="login-wrapper">
        <IonGrid className="login-card">
          <IonRow>
            {/* Left Section: Form */}
            <IonCol size="12" sizeMd="6" className="form-section">
              <div className="form-wrapper">
                <h2 className="title">Sign In</h2>
                <p className="subtitle">Welcome back! Please login to your account.</p>

                <IonItem className="input-item">
                  <IonIcon icon={mailOutline} slot="start" color='white' />
                  <IonInput
                    type="email"
                    value={email}
                    placeholder="Enter your email"
                    onIonInput={(e: any) => setEmail(e.detail.value!)}
                  />
                </IonItem>

                <IonItem className="input-item">
                  <IonIcon icon={lockClosedOutline} slot="start" color='white' />
                  <IonInput
                    type="password"
                    value={password}
                    placeholder="Enter your password"
                    onIonInput={(e: any) => setPassword(e.detail.value!)}
                  />
                </IonItem>

                <IonButton expand="block" className="login-btn" onClick={handleLogin}>
                  Login
                </IonButton>

                <div className="divider">
                  <span>or continue with</span>
                </div>

                <div className="social-buttons">
                  <IonButton fill="outline" shape="round">
                    <IonIcon icon={logoGoogle} slot="start" />
                    Google
                  </IonButton>
                  <IonButton fill="outline" shape="round" color="primary">
                    <IonIcon icon={logoFacebook} slot="start" />
                    Facebook
                  </IonButton>
                </div>

                <p className="signup-link">
                  Don’t have an account? <a href="/signup">Sign Up</a>
                </p>
              </div>
            </IonCol>

            {/* Right Section */}
            <IonCol size="12" sizeMd="6" className="decor-section">
              <div className="decor-content">
                <h3>Your data, your rules</h3>
                <p>Secure, fast, and private authentication for your apps.</p>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Login Error'}
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
