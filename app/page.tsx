'use client';

import { useState } from 'react';
import { InventoryList } from '@/components/InventoryList';
import { OperationModal } from '@/components/OperationModal';
import { useInventory } from '@/hooks/useInventory';

export default function HomePage() {
  const { products, refreshStock } = useInventory();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header Fixo/Navegação */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            </div>
            <div>
              <h1 className="font-black text-slate-900 tracking-tight leading-none">BEIT STOCK</h1>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Controle de Inventário</span>
            </div>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-100 transition-all active:scale-95"
          >
            + Nova Operação
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic">Dashboard</h2>
            <p className="text-slate-500 text-sm font-medium">Acompanhamento de fluxo de produtos</p>
          </div>
          
          <div className="flex gap-2">
             <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Itens</span>
                <span className="text-xl font-black text-slate-700">{products.length}</span>
             </div>
          </div>
        </div>

        <InventoryList />

        {/* Modal renderizado condicionalmente */}
        {showModal && (
          <OperationModal 
            products={products}
            onClose={() => setShowModal(false)}
            onSuccess={refreshStock}
          />
        )}
      </main>
    </div>
  );
}