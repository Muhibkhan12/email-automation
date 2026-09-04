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


  // --------------------------------
  // Check authentication on startup
  // --------------------------------

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

        localStorage.removeItem("access_token");

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

    // IMPORTANT:
    // loginUser already stores the access token
    // Now we also update AuthContext immediately.

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


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};