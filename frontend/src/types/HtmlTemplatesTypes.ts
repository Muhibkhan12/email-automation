import { number } from "zod"

export interface HtmlTemplates{
    name : string,
    html_content : string,
    description : string,
    is_active : Boolean
}
export interface updateHtmlTemplates {
    name ?: string,
    html_content ?: string,
    description ?: string,
    is_active ?: Boolean
}
export interface htmlTemplateId {
    id : number
}