import axios from "axios";
import type { User, RegisterUser, UserLogin, UpdateUser  } from "../types/UserTypes";
export const getAllUser = async() => {
    const response = await axios.get<User[]>('/auth/users');
    return response.data
}
export const getUsersById = async(id : number) => {
    const response = await axios.get<User>(`/auth/user/${id}`)
    return response.data
}
export const updateUser = async(id : number, data : UpdateUser) => {
    const response = await axios.post<User>(`/auth/user/${id}`)
    return response.data
}
export const deleteUser = async(id : number) => {
    const response = await axios.delete<User>(`auth/user/delete/${id}`)
    return response.data
}