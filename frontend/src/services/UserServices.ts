import api from "../libs/Axios";
import type { User, RegisterUser, UserLogin, UpdateUser, UserWithSenderAccounts  } from "../types/UserTypes";

// UserServices.ts
export const getAllUser = async () => {
  const res = await api.get("/auth/users");
  // Backend wraps in { users: [...] }
  return res.data.users ?? res.data ?? [];
};

export const getUsersById = async(id : number) => {
    const response = await api.get<User>(`/auth/user/${id}`)
    return response.data
}

export const addUser = async(data : UserLogin) => {
    const response = await api.post<User>(`auth/login/`,data)
    return response.data
}

export const updateUser = async (id: number, data: UpdateUser) => {
  const response = await api.put<User>(`/auth/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: number) => {
  const response = await api.delete<User>(`/auth/users/${id}`);
  return response.data;
};

export const getUsersWithSenderAccounts = async () => {
    const response = await api.get<UserWithSenderAccounts[]>(`/auth/users/sender-accounts`)
    return response.data
}

export const getSenderAccountWithUserById = async (id : number)=> {
    const response = await api.get<UserWithSenderAccounts>(`/auth/user/sender-accounts/${id}`)
    return response.data
}