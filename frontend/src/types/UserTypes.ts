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
    name : string;
    email : string;
    password : string;
}
export interface UserLogin {
    name : string
    password : string
}
export interface UpdateUser {
    name?: string
    email?: string
    password?: string
}
export interface LoginResponse { 
    message : string;
    access_token : string
    refresh_token : string
    token_type : "Bearer";
}
export interface UserResponse {
    message : string;
    user : User;
}