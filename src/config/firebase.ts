import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';



// Initialize Firebase services
const db = firestore();
const store = storage();

export { auth, db, store };