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
  IonButtons,
  IonImg
} from '@ionic/react';
import { logoGoogle, logoFacebook, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { useHistory } from 'react-router-dom';
import logo from "../assets/movie-logoapp.png";

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
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

    if (!userDoc.exists() || userDoc.data().active === false) {
      await signOut(auth);
      setAlertMessage("Your account is deactivated. Please contact the administrator.");
      setShowAlert(true);
      return;
    }

    if (userDoc.data().role === "admin") {
      history.push("/admin-dashboard");
    } else {
      history.push("/home");
    }
  } catch (error: any) {
    setAlertMessage(`Login failed: ${error.message}`);
    setShowAlert(true);
  }
};


  return (
    <IonPage>
      <IonHeader>

</IonHeader>
      <IonContent className="login-wrapper">
        <IonGrid className="login-card">
          <IonRow>
            {/* Left Section: Form */}
            <IonCol size="12" sizeMd="6" className="form-section">
              <div className="form-wrapper">
                 <IonImg src={logo} alt="Movie App Logo" className="login-logo" />
                <h2 className="title">Welcome Back</h2>
                <p className="subtitle">Welcome back! Please login to your account.</p>

                <IonItem className="input-item">
                  <IonIcon icon={mailOutline} slot="start" style={{color:"white"}} />
                  <IonInput 
                  style={{color:"white"}}
                    type="email"
                    value={email}
                    placeholder="Enter your email"
                    onIonInput={(e: any) => setEmail(e.detail.value!)}
                  />
                </IonItem>

                <IonItem className="input-item">
                  <IonIcon icon={lockClosedOutline} slot="start" style={{color:"white"}} />
                  <IonInput
                  style={{color:"white"}}
                    type="password"
                    value={password}
                    placeholder="Enter your password"
                    onIonInput={(e: any) => setPassword(e.detail.value!)}
                  />
                </IonItem>

                <IonButton 
  expand="block" 
  className="login-btn" 
  onClick={handleLogin} 
>
  Login
</IonButton>

                {/* <div className="divider">
                  <span>or continue with</span>
                </div> */}
{/* 
                <div className="social-buttons">
                  <IonButton fill="outline" shape="round">
                    <IonIcon icon={logoGoogle} slot="start" />
                    Google
                  </IonButton>
                  <IonButton fill="outline" shape="round" color="primary">
                    <IonIcon icon={logoFacebook} slot="start" />
                    Facebook
                  </IonButton>
                </div> */}

                <p className="signup-link" style={{color:'white'}}>
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
