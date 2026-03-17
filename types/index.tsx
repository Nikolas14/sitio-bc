export interface IProduct {
  id: number;
  name: string;
  type?: string;
  price: number;
  weightAlt?: number;
}

export interface IOperation {
  id?: string;
  product_id: number;
  type: 'IN' | 'OUT';
  quant: number;
  customer?: string;
  date?: string;
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