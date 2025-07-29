import admin from "firebase-admin";

// import serviceAccount from "../second-shot-firebase-adminsdk.json" assert { type: "json" };

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://second-shot.firebaseio.com",
//     storageBucket: "gs://second-shot-1d28a.firebasestorage.app",
//   });
// }

export { admin };