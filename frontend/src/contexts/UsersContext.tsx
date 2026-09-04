import { createContext, useEffect, useState, type ReactNode } from 'react'
import { addUser,getAllUser, deleteUser, updateUser, getUsersById,getUsersWithSenderAccounts,getSenderAccountWithUserById} from '../services/UserServices';
import type { User, UserLogin,UpdateUser, UserWithSenderAccounts  } from '../types/UserTypes';

type UsersProviderProps = {
  children : ReactNode;
}

type UsersContextType = {
    user: User[];
    loading: boolean;
    usersWithSenderAccounts: UserWithSenderAccounts[];
    userWithSenderAccount: UserWithSenderAccounts | null;
    addUsers: (data: UserLogin) => Promise<void>;
    editUser: (id: number, data: UpdateUser) => Promise<void>;
    removeUser: (id: number) => Promise<void>;
    fetchUserWithSenderAccounts : () => Promise<void>;
    fetchUserWithSenderAccountsById : (id : number) => Promise<void>;
};

export const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const UserProvider = ({ children } : UsersProviderProps) => {
  const [user, setUser] = useState<User[]>([]);
  const [usersWithSenderAccounts, setUsersWithSenderAccounts] = useState<UserWithSenderAccounts[]>([]);
  const [userWithSenderAccount, setUserWithSenderAccount] = useState<UserWithSenderAccounts | null>(null);
  const [loading, setLoading] = useState(false);

      const fetchUser = async () => {

      try {
        setLoading(true)

        const data = await getAllUser();
        setUser(data);
      }finally{
        setLoading(false)
      }
    };

    const addUsers = async (data : UserLogin)=> {
      const newUser = await  addUser(data);
      setUser(prev=> [...prev, newUser]);
    };

    const editUser = async(id : number, data : UpdateUser)=> {
      const updatedUser = await updateUser(id, data)
      setUser(prev => 
        prev.map(user => user.id === id ? updatedUser : user)
      )
    }

    const removeUser = async(id : number) => {
      await deleteUser(id);
      setUser(prev => prev.filter(user => user.id !== id));
    }

    const fetchUserWithSenderAccountsById = async(id : number) => {
      const data = await getSenderAccountWithUserById(id);
      setUserWithSenderAccount(data);
    }
    const fetchUserWithSenderAccounts = async() => {
      const data = await getUsersWithSenderAccounts();
      setUsersWithSenderAccounts(data);
    }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UsersContext.Provider value={{user, loading, addUsers, editUser, removeUser,fetchUserWithSenderAccountsById,usersWithSenderAccounts,userWithSenderAccount, fetchUserWithSenderAccounts}}>
      {children}
    </UsersContext.Provider>
  );
};

export default UsersContext