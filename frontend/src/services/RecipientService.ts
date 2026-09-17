import api from "../libs/Axios"
import type{ UpdateRecpient } from "../types/RecipientTypes"

export const getRecipientsService = async() => {
    const response =await api.get('/recipient/all')
    return  response.data
}


export const getRecipientsByCampaign = async (campaignId: number) => {
  const response = await api.get(`/recipient/${campaignId}/recipients`)
  return response.data
}

export const getRecipientsServiceById = async(id : number) => {
    const response =await api.get(`/recipient/${id}`)
    return  response.data
}

export const updateRecipient = async(id : number, data : UpdateRecpient) => {
    const response = await api.put(`/recipient/${id}`,data)
    return response.data
}