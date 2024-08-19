import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = { ...require("../firebase-config.json") };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const user = "zymbrw@gmail.com"

export const login = async () => {
    const docRef = doc(db, "users", user);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
    } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
    }
}


