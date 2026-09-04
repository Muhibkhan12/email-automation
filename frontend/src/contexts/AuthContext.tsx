import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getProfile,
  logoutUser,
} from "../services/AuthServices";

import type { User } from "../types/UserTypes";


type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};


type AuthProviderProps = {
  children: ReactNode;
};


export const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);


export const AuthProvider = ({
  children,
}: AuthProviderProps) => {

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);


  // Check authentication when the application starts
  useEffect(() => {

    

 const checkAuth = async () => {
  try {
    const token = localStorage.getItem("access_token");

    console.log("🔑 TOKEN:", token);

    if (!token) {
      console.log("❌ NO TOKEN");
      setUser(null);
      return;
    }

    const profile = await getProfile();

    console.log("👤 PROFILE:", profile);
    console.log("👤 PROFILE ROLE:", profile.role);

    setUser(profile);

  } catch (error) {

    console.log("❌ PROFILE REQUEST FAILED:", error);

    localStorage.removeItem("access_token");
    setUser(null);

  } finally {
    setLoading(false);
  }
};


    checkAuth();

  }, []);


  const logout = async () => {

    try {

      await logoutUser();

    } finally {

      setUser(null);
    }

  };


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};