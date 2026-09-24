export interface IEmployee {
  id: string;
  name: string;
  whatsapp_group: string;
  phone: string;
  cpf: string;
  rg: string;
  pix_type: string;
  pix_key: string;
  bank: string;
  notes: string;
  nickname: string;
  sex: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type EmployeeInput = Omit<IEmployee, 'id' | 'created_at' | 'updated_at'>;
