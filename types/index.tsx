export interface IProduct {
  id: number;
  name: string;
  type?: string;
  current_stock: number;
  price: number;
  weightAlt?: number;
}

export interface IOperation {
  id: number;
  created_at: string;
  type: 'IN' | 'OUT';
  quant: number;
  ESTOQUE_transaction?: {
    customer_vendor: string;
    serial_number: string;
  };
}

// Interface específica para a nossa VIEW do Supabase
export interface IProductBalance {
  id: number;
  name: string;
  type: string;
  price: number;
  total_in: number;
  total_out: number;
  current_stock: number;
}