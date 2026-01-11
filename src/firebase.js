// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC310A6fhBb04sOmUjV_vFoZsOxDpUhc7E",
  authDomain: "preppilotapp.firebaseapp.com",
  projectId: "preppilotapp",
  storageBucket: "preppilotapp.firebasestorage.app",
  messagingSenderId: "391244178642",
  appId: "1:391244178642:web:948b4e19b3b8b5a292f90b",
  measurementId: "G-NHW7F78504"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);