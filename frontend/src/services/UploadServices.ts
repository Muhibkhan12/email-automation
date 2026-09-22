import api from "../libs/Axios";
import type{ UploadedFile } from "../types/UploadTypes";

export const uploadFile = async(campaign_id : number) => {
    const response = await api.post(`campaigns/${campaign_id}/upload`);
    return response.data;
}
export const getAllUploadedFiles = async():Promise<UploadedFile[]> => {
    const response = await api.get("uploads/all");
    return  response.data.data
}
export const getUploadedFilesById = async(id : number):Promise<UploadedFile> => {
    const response = await api.get(`uploads/${id}`)
    return response.data
}
export const deleteUploadedFile = async(id : number) => {
    const response = await api.delete(`uploads/${id}`);
    return response.data
}