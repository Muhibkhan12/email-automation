import api from '../libs/Axios';
import type { HtmlTemplates,updateHtmlTemplates, } from '../types/HtmlTemplatesTypes';

export const getHTMLTemplates = async(): Promise<HtmlTemplates[]> => {
    const response = await api.get("/html-templates");
    return response.data.data
};

export const getHTMLTemplatesById = async(id : number) => {
    const response = await api.get(`/html-tempaltes/${id}`);
    return response.data.data
};

export const editHtmlTemplates = async(id : number, data : updateHtmlTemplates):Promise<updateHtmlTemplates> => {
    const resposne = await api.put(`/html-tempaltes/${id}`, data);
    return resposne.data
};

export const deleteHtmlTemplates = async(id : number) => {
    const response = await api.delete(`/html-templates/${id}`)
    return response.data
};