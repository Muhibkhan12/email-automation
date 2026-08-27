import { createContext, useEffect, useState, type ReactNode } from 'react'
import { getAllUser } from '../services/UserServices';
import type { User } from '../types/UserTypes';

type UsersProviderProps = {
  children : ReactNode;
}

export const UsersContext = createContext<User[]>([]);

export const UserProvider = ({children } : UsersProviderProps) => {
  const [user, setUser] = useState<User[]>([]);
  useEffect(() => {
    const fetchUser = async () => {
      const data = await getAllUser();
      setUser(data);
    }

    fetchUser();
  }, []);

  return (
    <UsersContext.Provider value={user}>
      {children}
    </UsersContext.Provider>
  );
};

export default UsersContext