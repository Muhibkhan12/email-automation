import { Navigate } from "react-router-dom";
import api from "../libs/Axios";
import type{ User, AuthResponse, UserLogin, RegisterUser} from "../types/UserTypes"

export const loginUser = async(data : UserLogin): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  localStorage.setItem("access_token",response.data.access_token);
  return response.data
};

export const UserRegister = async(data: RegisterUser) => {
  const response = await api.post('/auth/register',data);
  return response.data;
}

export const getProfile = async():Promise<User> =>{
  const response = await api.get('/auth/profile');
  return response.data
}

export const logoutUser = async() => {
  localStorage.removeItem("access_token")
  await api.post('/auth/logout');
}