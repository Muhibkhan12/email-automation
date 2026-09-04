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

        // No token means user is not logged in
        if (!token) {
          setUser(null);
          return;
        }

        // Token exists → get current user from backend
        const profile = await getProfile();

        setUser(profile);

      } catch (error) {

        // Token is invalid/expired
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