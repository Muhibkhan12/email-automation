import api from "../libs/Axios";
import type{ EmailLogs,UpdateEmailLogsType } from "../types/EmaillogsTypes";

export const getEmaillog = async() => {
    const response = await api.get('/email-logs/');
    return response.data
}

export const getEmaillogById = async(id : number) => {
    const response = await api.get(`/email-logs/${id}`)
    return response.data
}

export const updateEmailLogs = async (id: number, data: UpdateEmailLogsType): Promise<EmailLogs> => {
    const response = await api.patch(`/email-logs/update/${id}`, data)
    return response.data
}

export const addEmailLogs = async(data : EmailLogs) => {
    const response = await api.post(`/email-logs/add`,data);
    return response.data
}