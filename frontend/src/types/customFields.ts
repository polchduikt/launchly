export interface CustomField {
  name: string;
  type?: string;
  description?: string;
}

export interface CustomFieldFolder {
  id: string | number;
  name: string;
  fields?: CustomField[];
}

export interface CustomFieldsResponse {
  fields: (string | CustomField)[];
  archivedFields?: (string | CustomField)[];
  folders?: CustomFieldFolder[];
  [key: string]: unknown;
}
