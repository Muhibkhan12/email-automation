export interface HtmlTemplates {
  id: number;
  name: string;
  html_content: string;
  description: string;
  is_active: boolean;
}

export interface updateHtmlTemplates {
  name?: string;
  html_content?: string;
  description?: string;
  is_active?: boolean;
}

export interface htmlTemplateId {
  id: number;
}