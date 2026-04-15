// 1. Definição do Produto
export interface IProduct {
  id: number;
  name: string;
  type?: string;
  current_stock: number;
  price: number;
  weightAlt?: number;
}

export interface ITransaction {
  id: string;
  type: 'IN' | 'OUT';
  customer_vendor: string;
  total_price: number;
  total_kg: number;
  created_at: string;
  serial_number: string;
  shipping_cost?: number;
  tax_amount?: number;
  discount_percent: number;
  status: 'PENDENTE' | 'ENVIADO' | 'COBRADO' | 'CONCLUIDO'; 
  paid_amount: number; 
}

export interface IOperation {
  id: number;
  transaction_id?: string; // ID que liga ao ITransaction
  product_id?: number;      // ID que liga ao IProduct
  created_at: string;
  type: 'IN' | 'OUT';
  quant: number;
  // Joins do Supabase para o Extrato Detalhado
  ESTOQUE_transaction?: {
    customer_vendor: string;
    serial_number: string;
  };
  // Joins do Supabase para o Recibo de Venda
  ESTOQUE_product?: {
    name: string;
    price: number;
  };
}

export interface IReceiptProduct {
  name: string;
  price: number;
}

export interface IReceiptItem {
  quant: number;
  ESTOQUE_product: IReceiptProduct | null;
}

interface ReceiptTableProps {
  items: IReceiptItem[];
}

export const STATUS_COBRANCA = ['PENDENTE', 'ENVIADO', 'COBRADO', 'CONCLUIDO'];