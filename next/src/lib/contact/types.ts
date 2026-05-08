export type ContactPayload = {
  name: string;
  email: string;
  phone: string;
  inquiry: string;
};

export type ContactRequestBody = {
  name?: string;
  email?: string;
  phone?: string;
  inquiry?: string;
  token?: string;
};
