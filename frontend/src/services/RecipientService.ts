import api from "../libs/Axios"
import type { UpdateRecpient } from "../types/RecipientTypes"

export const getRecipientsService = async (page: number = 1, limit: number = 20) => {
    const response = await api.get('/recipient', { params: { page, limit } })
    console.log("recipients response:", response.data) // remove once shape is confirmed
    return response.data
}

export const getRecipientsByCampaign = async (campaignId: number) => {
  const response = await api.get(`/recipient/${campaignId}/recipients`)
  return response.data
}

export const getRecipientsServiceById = async (id: number) => {
    const response = await api.get(`/recipient/${id}`)
    return response.data
}

export const updateRecipient = async (id: number, data: UpdateRecpient) => {
    const response = await api.patch(`/recipient/${id}`, data) // was .put — backend route is @router.patch
    return response.data
}