import { redirect } from 'next/navigation';

// O pedido agora é montado e impresso direto na Nova Projeção.
export default function PedidosPage() {
  redirect('/projecao');
}
