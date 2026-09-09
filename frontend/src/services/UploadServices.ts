import axios from "axios";

export const campaignStart = async(id : number) => {
    const response = axios.post(`/campaigns/${id}/upload`);
    return response.data
}