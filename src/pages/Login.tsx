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
  IonAlert,
  IonGrid,
  IonRow,
  IonCol 
} from '@ionic/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useHistory } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const history = useHistory();

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertMessage('Please enter both email and password');
      setShowAlert(true);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      history.push('/home');
    } catch (error: any) {
      console.error('Error signing in:', error);
      setAlertMessage(`Login failed: ${error.message}`);
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12" size-md="6" offset-md="3">
              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
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
            <IonCol size="12" size-md="6" offset-md="3">
              <IonItem>
                <IonLabel position="stacked">Password</IonLabel>
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
            <IonCol size="12" size-md="6" offset-md="3">
              <IonButton expand="block" onClick={handleLogin}>
                Login
              </IonButton>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12" size-md="6" offset-md="3" className="ion-text-center">
              <p>Don't have an account? <a href="/signup">Sign Up</a></p>
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