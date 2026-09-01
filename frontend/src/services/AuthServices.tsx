import axios from "axios"
import type{ User, AuthResponse,UserLogin, RegisterUser} from "../types/UserTypes"

export const loginUser = async(data : UserLogin): Promise<AuthResponse> => {
  const response = await axios.post('/auth/login', data);
  return response.data
};

export const UserRegister = async(data: RegisterUser) => {
  const response = await axios.post('/auth/register',data);
  return response.data;
}

export const getProfile = async():Promise<User> =>{
  const response = await axios.get('/auth/profile');
  return response.data
}