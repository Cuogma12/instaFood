import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';


// Initialize Firebase services
const db = firestore();
export { auth, db };