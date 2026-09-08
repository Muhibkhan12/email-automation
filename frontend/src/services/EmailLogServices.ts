import axios from "axios"

export const getEmaillog = async() => {
    const response = await axios.get('/email-logs/');
    return response.data
}

export const getEmaillogById = async(id : number) => {
    const response = await axios.get(`/email-logs/${id}`)
    return response.data
}
export const updateEmailLogs = async(id : number) => {
    const response = await axios.patch(`/email-logs/update/${id}`, data)
    return response.data
}
export const addEmailLogs = async(data : ) => {
    const response = await axios.post(`/email-logs/add`,data);
    return response.data
}