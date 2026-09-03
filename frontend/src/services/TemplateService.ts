import axios from 'axios'
import type { HtmlTemplates,updateHtmlTemplates, } from '../types/HtmlTemplatesTypes';

export const getHTMLTemplates = async(): Promise<HtmlTemplates[]> => {
    const response = await axios.get("/html_tempaltes");
    return response.data
};

export const getHTMLTemplatesById = async(id : number) => {
    const response = await axios.get(`/html_tempaltes/${id}`);
    return response
};

export const editHtmlTemplates = async(id : number, data : updateHtmlTemplates):Promise<updateHtmlTemplates> => {
    const resposne = await axios.put(`/html_tempaltes/update/${id}`, data);
    return resposne.data
}

export const deleteHtmlTemplates = async(id : number) => {
    const response = await axios.delete(`/html_templates/delete/${id}`)
    return response.data
}