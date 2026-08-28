import { createContext, useEffect, useState, type ReactNode } from 'react'
import { addUser,getAllUser, deleteUser, updateUser, getUsersById,getUsersWithSenderAccounts,getSenderAccountWithUser } from '../services/UserServices';
import type { User, UserLogin,  } from '../types/UserTypes';
import { UserStar } from 'lucide-react';
import { data } from 'react-router-dom';

type UsersProviderProps = {
  children : ReactNode;
}

export const UsersContext = createContext<User[]>([]);


export const UserProvider = ({children } : UsersProviderProps) => {
  const [user, setUser] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    
    const fetchUser = async () => {

        try {
        setLoading(false)

        const data = await getAllUser();
        setUser(data);
      }finally{
        setLoading(data)
      }
    };

    const addUsers = async (data : UserLogin)=> {
      const newUser = await  addUser(data);
      setUsers(prev=> [...prev, newUser]);
    };

    const editUser = async(id : number, data : UpdateUser)=> {
      const updatedUser = await updateUser(id, data)
      setUser(prev => 
        prev.map(user => user.id === id ? updatedUser : user)
      )
    }

    const removeUser = async(id : number) => {
      await deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    }



    fetchUser();
  }, []);

  return (
    <UsersContext.Provider value={{user, loading, addUser, updateUser, deleteUser,getUsersWithSenderAccounts }}>
      {children}
    </UsersContext.Provider>
  );
};

export default UsersContext