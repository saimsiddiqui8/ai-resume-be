import { admin } from "../../configs/admin-authorizer.js";


const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    return {
      uid: uid,
      decodedToken: decodedToken,
      success: true,
    };
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return {
      errorMessage: "Invalid or expired token, please relogin",
      success: false,
    };
  }
};

export {verifyFirebaseToken};
