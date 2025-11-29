/**
 * HOW TO FIND YOUR FIREBASE CONFIG:
 * 1. Go to the Firebase Console: https://console.firebase.google.com/
 * 2. Click on your project (or create a new one).
 * 3. Click the "Gear" icon next to "Project Overview" in the top left and select "Project settings".
 * 4. Scroll down to the "Your apps" section at the bottom.
 * 5. If you haven't created an app yet, click the "</>" (Web) icon.
 *    - Give it a nickname (e.g., "Rural Runner").
 *    - Uncheck "Firebase Hosting" for now.
 *    - Click "Register app".
 * 6. You will see a code block with "const firebaseConfig = { ... }".
 * 7. Copy that object and paste it below replacing the placeholder.
 *
 * IMPORTANT:
 * Make sure you also go to "Build" -> "Firestore Database" in the left menu
 * and click "Create Database" (start in Test Mode) so the game can save scores!
 */
const firebaseConfig = {
    apiKey: "AIzaSyCGSNglN5sl_OZBxRT5zfrikCGnYBtrFOM",
    authDomain: "hadino-73583.firebaseapp.com",
    projectId: "hadino-73583",
    storageBucket: "hadino-73583.firebasestorage.app",
    messagingSenderId: "643782683062",
    appId: "1:643782683062:web:5aff873c7636e27d157917",
    measurementId: "G-WME2JD8GT2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
