// 1. Definição do Produto
export interface IProduct {
  id: number;
  name: string;
  type?: string;
  current_stock: number;
  price: number;
  weightAlt?: number;
}

// 2. Definição da Transação (O "Recibo" ou "Capa" do pedido)
export interface ITransaction {
  id: string;
  created_at: string;
  type: 'IN' | 'OUT';
  customer_vendor: string;
  serial_number: string;
  total_price: number;
  total_kg: number;
  discount_percent: number;
  tax_amount?: number;
  shipping_cost?: number;
  notes?: string;
}

// 3. Definição da Operação (Os itens dentro de uma transação ou extrato)
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