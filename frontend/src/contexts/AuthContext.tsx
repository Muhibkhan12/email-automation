// src/contexts/AuthContext.tsx
import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getProfile,
  loginUser,
  logoutUser,
  SendOTP,
  VerifyOTP,
} from "../services/AuthServices";

import type {
  User,
  UserLogin,
} from "../types/UserTypes";


type AuthContextType = {
  user: User | null;
  loading: boolean;

  login: (data: UserLogin) => Promise<User>;
  logout: () => Promise<void>;

  sendOTP: (email: string) => Promise<{ message?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ message?: string }>;
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

  useEffect(() => {

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setUser(null);
          return;
        }
        const profile = await getProfile();
        setUser(profile);
      }
      catch (error) {
        console.error("Auth initialization Failed: ", error);
        setUser(null);
      }
      finally {
        setLoading(false);
      }
    };

    checkAuth();

  }, []);


  // --------------------------------
  // Login
  // --------------------------------

  const login = async (data: UserLogin): Promise<User> => {
    const response = await loginUser(data);
    setUser(response.user);
    return response.user;
  };


  // --------------------------------
  // Logout
  // --------------------------------

  const logout = async () => {
    try {
      await logoutUser();
    }
    finally {
      setUser(null);
    }
  };


  // --------------------------------
  // OTP — Resend
  // --------------------------------

  const sendOTP = async (email: string) => {
    return await SendOTP(email);
  };


  // --------------------------------
  // OTP — Verify
  // --------------------------------

  const verifyOTP = async (email: string, otp: string) => {
    return await VerifyOTP({ email, otp });
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        sendOTP,
        verifyOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};