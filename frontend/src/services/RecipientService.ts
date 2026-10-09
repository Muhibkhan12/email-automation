import api from "../libs/Axios"
import type { UpdateRecpient } from "../types/RecipientTypes"

export interface GetRecipientsParams {
    page?: number
    limit?: number
    uploadId?: number
    search?: string
    status?: string
}

export const getRecipientsService = async ({
    page = 1,
    limit = 20,
    uploadId,
    search,
    status,
}: GetRecipientsParams = {}) => {
    const params: Record<string, string | number> = { page, limit }
    if (uploadId !== undefined) params.upload_id = uploadId
    if (search && search.trim()) params.search = search.trim()
    if (status && status !== "All") params.status = status

    const response = await api.get('/recipient', { params })
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
    const response = await api.patch(`/recipient/${id}`, data)
    return response.data
}