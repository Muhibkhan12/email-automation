import axios from "axios";
import api from "../libs/Axios";
import { UploadedFile } from "../types/UploadTypes";

// export const campaignStart = async(id : number) => {
//     const response = axios.post(`/campaigns/${id}/upload`);
//     return response.data.data
// }

export const getAllUploadedFiles = async():Promise<UploadedFile> => {
    const response = await api.get("uploads/all");
    return  response.data
}
export const getUploadedFilesById = async(id : number):Promise<UploadedFile> => {
    const response = await api.get(`uploads/${id}`)
    return response.data
}
export const deleteUploadedFile = async(id : number) => {
    const response = await api.delete(`uploads/${id}`);
    return response.data
}