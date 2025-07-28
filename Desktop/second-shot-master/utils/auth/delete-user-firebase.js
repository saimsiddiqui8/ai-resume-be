import { getAuth } from "firebase-admin/auth";

const deleteUserFromFirebase = async (firebaseUid) => {
    try {
      const firebaseAuth = getAuth();
      await firebaseAuth.deleteUser(firebaseUid);
      console.log(`Firebase user with UID ${firebaseUid} deleted successfully.`);
    } catch (error) {
      console.error(`Error deleting Firebase user with UID ${firebaseUid}:`, error);
      throw new Error(
        error.code && error.code.startsWith("auth/")
          ? `Firebase Auth Error: ${error.message}`
          : "Failed to delete user from Firebase."
      );
    }
  };

export {deleteUserFromFirebase}  