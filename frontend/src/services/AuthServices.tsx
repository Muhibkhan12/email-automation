import axios from "axios"
import type{ AuthResponse,UserLogin, RegisterUser} from "../types/UserTypes"

export const loginUser = async(data : UserLogin): Promise<AuthResponse> => {
  const response = await axios.post('/auth/login', data);
  return response.data
};