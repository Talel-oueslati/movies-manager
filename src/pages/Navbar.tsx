import React, { useState, useRef, useEffect } from 'react';
import { IonButton, IonAvatar, IonIcon } from '@ionic/react';
import { personCircle, chevronDown, logOutOutline } from 'ionicons/icons';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useHistory } from 'react-router-dom';
import { User } from '../models/User';

const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const history = useHistory();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        }
      } else {
        setUser(null);
        history.push('/login');
      }
    });
    return () => unsubscribe();
  }, [history]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    history.push('/login');
  };

  const handleProfileClick = () => {
    if (user) history.push('/profile');
  };

  return user? (
    <div className="relative" ref={dropdownRef} style={{ display: 'inline-block' }}>
      <IonButton fill="clear" className="flex items-center space-x-2" onClick={() => setShowDropdown(!showDropdown)}>
        {user?.photo ? (
          <IonAvatar style={{ width: '36px', height: '36px' }}>
            <img src={user.photo} alt="Profile" />
          </IonAvatar>
        ) : (
          <IonIcon icon={personCircle} size="large" />
        )}
        <span className="font-medium text-gray-800">{user?.prénom} {user?.nom}</span>
        <IonIcon icon={chevronDown} size="small" />
      </IonButton>

      {/* Dropdown menu */}
      {showDropdown && (
        <div
          className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <button
            onClick={handleProfileClick}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors duration-150"
          >
            <IonIcon icon={personCircle} className="mr-2 text-base" />
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors duration-150"
          >
            <IonIcon icon={logOutOutline} className="mr-2 text-base" />
            Logout
          </button>
        </div>
      )}
    </div>
  ):null;
};

export default Navbar;
