import axios from "axios";
import type { User, RegisterUser, UserLogin } from "../types/UserTypes"; 
export const getAllUser = async() => {
    const response = await axios.get('/auth/users');
    return response.data
}