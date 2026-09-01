// import axios from "axios"
import api from "../libs/Axios";
import type{ User, AuthResponse, UserLogin, RegisterUser} from "../types/UserTypes"

export const loginUser = async(data : UserLogin): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
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