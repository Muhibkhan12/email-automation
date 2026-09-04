import type { SenderAccount } from "./SenderAccount";

export type UserRole = "ADMIN" | "EMPLOYEE"

export interface User{
    id : number
    username : string;
    email : string;
    role : UserRole
    created_at : string
    updated_at : string
}
export interface RegisterUser {
    username : string;
    email : string;
    password : string;
}

export interface UserLogin {
    email : string
    password : string
}
export interface AuthResponse {
    access_token : string
    refresh_token : string
    token_type : string
    user : User
} 

export interface UpdateUser {
    username?: string
    email?: string
    password?: string
}
export interface LoginResponse { 
    message : string;
    access_token : string
    refresh_token : string
    token_type : "Bearer";
    user : User
}
export interface UserResponse {
    message : string;
    user : User;
}

export interface UserWithSenderAccounts extends User{
    senderAccount : SenderAccount[];
} 