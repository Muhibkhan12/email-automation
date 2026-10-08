import api from "../libs/Axios";

export const ExtractData = async (upload_id: number) => {
    const response = await api.post(`/worker/extract/${upload_id}`);

    return response.data;
};