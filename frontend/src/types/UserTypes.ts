export interface User{
    username : string;
    email : string;
    role : "ADMIN" | "EMPLOYEE";
}

export interface CreateUser {
    name : string;
    email : string;
    password : string;
    role : "ADMIN" | "EMPLOYEE";
}