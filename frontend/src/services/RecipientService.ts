import axios from "axios"
import { UpdateRecpient } from "../types/RecipientTypes"


export const getRecipientsService = async() => {
    const response =await axios.get('/recipient/all')
    return  response.data
}
export const getRecipientsServiceById = async(id : number) => {
    const response =await axios.get(`/recipient/${id}`)
    return  response.data
} 
export const updateRecipient = async(id : number, data : UpdateRecpient) => {
    const response = await axios.put(`/recipient/${id}`,data)
    return response.data
}