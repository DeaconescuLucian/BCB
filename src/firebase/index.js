import { initializeApp } from "firebase/app";
import { getAuth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, inMemoryPersistence, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = { ...require("../firebase-config.json") };
var firebaseui = require('firebaseui');

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
auth.useDeviceLanguage();

//const db = getFirestore(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log(user);
    localStorage.setItem("user", user)
  } else {
    console.log("No user.");
  }
});

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  'login_hint': 'user@gmail.com'
});

export const signInWithGoogle = () => {
  const auth = getAuth();
  console.log(googleProvider)
  setPersistence(auth, browserSessionPersistence).then(() => {
    return signInWithRedirect(auth, googleProvider)
    .then((result) => {
      getRedirectResult(auth)
        .then((result) => {
          // This gives you a Google Access Token. You can use it to access Google APIs.
          const credential = GoogleAuthProvider.credentialFromResult(result);
          console.log(credential)
          const token = credential.accessToken;

          // The signed-in user info.
          const user = result.user;
          console.log(user)
          // IdP data available using getAdditionalUserInfo(result)
          // ...
        }).catch((error) => {
          // Handle Errors here.
          const errorCode = error.code;
          const errorMessage = error.message;
          // The email of the user's account used.
          const email = error.customData.email;
          // The AuthCredential type that was used.
          const credential = GoogleAuthProvider.credentialFromError(error);
          // ...
        });
    })
    .catch((error) => {
      console.log(error)
    })
  })


  // signInWithPopup(auth, googleProvider)
  //   .then((result) => {
  //     console.log(result)
  //     // This gives you a Google Access Token. You can use it to access the Google API.
  //     const credential = GoogleAuthProvider.credentialFromResult(result);
  //     //const token = credential.accessToken;
  //     // The signed-in user info.
  //     const user = result.user;
  //     console.log(user)
  //     // IdP data available using getAdditionalUserInfo(result)
  //     // ...
  //   })
  //   .catch((error) => {
  //     // Handle Errors here.
  //     const errorCode = error.code;
  //     const errorMessage = error.message;
  //     // The email of the user's account used.
  //     const email = error.customData.email;
  //     // The AuthCredential type that was used.
  //     const credential = GoogleAuthProvider.credentialFromError(error);
  //     console.log(errorCode, errorMessage,email,credential)
  //     // ...
  //   });
};

export const logout = () => {
  // const auth = getAuth();
  // signOut(auth).then(() => {
  //   localStorage.setItem("user", null)
  //   console.log("Sign out!")
  //   console.log(auth)
  // }).catch((error) => {

  // });
  const auth = getAuth();
  setPersistence(auth, browserSessionPersistence).then(() => {
    signOut(auth).then(() => {
        localStorage.setItem("user", null)
        console.log("Sign out!")
        console.log(auth)
      }).catch((error) => {
    
      });
  })
}

export const signInWithEmail = () => {
  var ui = new firebaseui.auth.AuthUI(auth);
  ui.start('#firebaseui-auth-container', {
    signInOptions: [
      auth.EmailAuthProvider.PROVIDER_ID
    ],
    // Other config options...
  });
}

