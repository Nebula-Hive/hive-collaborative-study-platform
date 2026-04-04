import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import { logoutSession, registerUser, verifyToken } from "@/services";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = "token";

const getErrorMessage = (error, fallbackMessage) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState("student");
  const [viewMode, setViewMode] = useState("student");
  const [loading, setLoading] = useState(true);

  const setAuthState = (firebaseUser, backendUser = null) => {
    const newRole = backendUser?.role || "student";
    setUser(firebaseUser || null);
    setRole(newRole);
    setViewMode(newRole);
  };

  const toggleViewMode = () => {
    if (role === "admin") {
      setViewMode((prev) => (prev === "admin" ? "student" : "admin"));
    }
  };

  const clearSession = async () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAuthState(null, null);
  };

  const syncSessionFromFirebaseUser = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    localStorage.setItem(TOKEN_KEY, idToken);
    setToken(idToken);

    const verifiedUser = await verifyToken(idToken);
    setAuthState(firebaseUser, verifiedUser);

    return verifiedUser;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        await clearSession();
        setLoading(false);
        return;
      }

      try {
        await syncSessionFromFirebaseUser(currentUser);
      } catch (error) {
        // If backend verification fails, clear stale state and sign the user out.
        await signOut(auth);
        await clearSession();
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (currentUser) => {
      if (!currentUser) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        return;
      }

      try {
        const freshToken = await currentUser.getIdToken();
        localStorage.setItem(TOKEN_KEY, freshToken);
        setToken(freshToken);
      } catch (error) {
        // Keep current session state; auth state listener handles hard failures.
      }
    });

    return () => unsub();
  }, []);

  const signup = async ({ name, email, password, studentNumber }) => {
    try {
      await registerUser({ name, email, password, studentNumber });
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await syncSessionFromFirebaseUser(credential.user);
      return credential.user;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Signup failed"));
    }
  };

  const login = async ({ email, password }) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const verifiedUser = await syncSessionFromFirebaseUser(credential.user);
      return verifiedUser;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Login failed"));
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (token) {
        await logoutSession(token);
      }
    } catch (error) {
      // Ignore backend logout failures so local logout always succeeds.
    } finally {
      await signOut(auth);
      await clearSession();
    }
  };

  const refreshAuthUser = async () => {
    if (!auth.currentUser) return null;

    await auth.currentUser.reload();
    setUser(auth.currentUser);

    return auth.currentUser;
  };

  const value = useMemo(
    () => ({
      user,
      role,
      viewMode,
      loading,
      isAuthenticated: !!user,
      signup,
      login,
      logout,
      refreshAuthUser,
      toggleViewMode,
      token,
    }),
    [user, token, role, viewMode, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};