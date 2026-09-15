'use client';

import { useState } from 'react';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { useCustomerManager } from '@/hooks/useCustomerManager';
import styles from './page.module.css';

export default function PedidoPage() {
    const customerManager = useCustomerManager();
    const [orderText, setOrderText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const selectedCustomer = customerManager.selectedId && customerManager.selectedId !== 'new'
        ? customerManager.customers.find((customer) => customer.id === customerManager.selectedId)
        : null;
    const orderLines = orderText.split('\n').filter((line) => line.trim());

    const handlePrint = () => {
        const clearForm = () => {
            setOrderText('');
            setSearchTerm('');
            customerManager.setSelectedId(null);
        };

        window.addEventListener('afterprint', clearForm, { once: true });
        window.print();
    };

    const selectCustomer = (customer: typeof customerManager.customers[number]) => {
        customerManager.handleSelect(customer);
    };

    const visibleCustomers = customerManager.customers.filter((customer) =>
        [customer.name, customer.cpf, customer.city].some((value) =>
            value.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );

    return (
        <PageLayout>
            <Sidebar className={styles.sidebar}>
                <div className={styles.sidebarTop}>
                    <HeaderInput
                        titulo="Novo pedido"
                        setValor={setSearchTerm}
                        valor={searchTerm}
                        labelDescricao="Pesquise o cliente:"
                        placeholder="Nome, CPF ou cidade..."
                    />
                </div>
                <div className={styles.customerList}>
                    {customerManager.loading ? <p className={styles.listMessage}>Carregando clientes...</p> : visibleCustomers.map((customer) => (
                        <button
                            type="button"
                            key={customer.id}
                            className={`${styles.customerItem} ${selectedCustomer?.id === customer.id ? styles.active : ''}`}
                            onClick={() => selectCustomer(customer)}
                        >
                            <span>{customer.name}</span>
                            <small>{customer.cpf || 'CPF não informado'}{customer.city ? ` · ${customer.city}` : ''}</small>
                        </button>
                    ))}
                    {!customerManager.loading && visibleCustomers.length === 0 && <p className={styles.listMessage}>Nenhum cliente encontrado.</p>}
                </div>
            </Sidebar>

            <Main className={styles.mainArea}>
                <section className={styles.editorCard}>
                    <div className={styles.pageHeader}>
                        <div>
                            <span className={styles.eyebrow}>IMPRESSÃO DE PEDIDOS</span>
                            <h1>Montar pedido</h1>
                            <p>Selecione o cliente e cole o pedido exatamente como recebeu.</p>
                        </div>
                        <button type="button" className={styles.printButton} onClick={handlePrint} disabled={!selectedCustomer || !orderText.trim()}>
                            Imprimir pedido
                        </button>
                    </div>

                    <div className={styles.selectedCustomer}>
                        <span className={styles.label}>CLIENTE SELECIONADO</span>
                        {selectedCustomer ? <strong>{selectedCustomer.name}</strong> : <span className={styles.muted}>Selecione um cliente na lista lateral</span>}
                    </div>

                    <label className={styles.label} htmlFor="orderText">TEXTO DO PEDIDO</label>
                    <textarea
                        id="orderText"
                        className={styles.orderInput}
                        value={orderText}
                        onChange={(event) => setOrderText(event.target.value)}
                        placeholder={'Cole aqui o pedido recebido...\n\nExemplo:\n4 kg acem\n2 kg bananinha\n5 kg denver'}
                        spellCheck={false}
                    />
                    <p className={styles.helper}>O texto será mantido como foi colado, mesmo que os produtos não estejam cadastrados.</p>
                </section>

                <section className={styles.printPreview}>
                    <div className={styles.previewHeader}>
                        <div>
                            <span className={styles.eyebrow}>PEDIDO</span>
                            <h2>BEIT CHABAD BELÉM</h2>
                        </div>
                        <div className={styles.previewDate}>{new Date().toLocaleString('pt-BR')}</div>
                    </div>

                    {selectedCustomer ? (
                        <div className={styles.customerData}>
                            <div><span>CLIENTE</span><strong>{selectedCustomer.name}</strong></div>
                            <div><span>CPF</span><strong>{selectedCustomer.cpf || '-'}</strong></div>
                            <div className={styles.wide}><span>ENDEREÇO</span><strong>{selectedCustomer.address || '-'}</strong></div>
                            <div><span>CEP</span><strong>{selectedCustomer.cep || '-'}</strong></div>
                            <div><span>TELEFONE</span><strong>{selectedCustomer.phone || '-'}</strong></div>
                            <div><span>CIDADE</span><strong>{selectedCustomer.city || '-'}</strong></div>
                            <div><span>AEROPORTO</span><strong>{selectedCustomer.airport || '-'}</strong></div>
                            <div className={styles.wide}><span>RETIRADA</span><strong>{selectedCustomer.pickup_person || '-'}</strong></div>
                            {selectedCustomer.pickup_cpf && <div><span>CPF RETIRADA</span><strong>{selectedCustomer.pickup_cpf}</strong></div>}
                            {selectedCustomer.alternative_pickup_person && <div className={styles.wide}><span>RETIRADA ALTERNATIVA</span><strong>{selectedCustomer.alternative_pickup_person}</strong></div>}
                            {selectedCustomer.notes && <div className={styles.wide}><span>OBSERVAÇÕES DO CLIENTE</span><strong>{selectedCustomer.notes}</strong></div>}
                        </div>
                    ) : <p className={styles.emptyPreview}>Selecione um cliente para visualizar o pedido.</p>}

                    <div className={styles.orderSection}>
                        <h3>ITENS DO PEDIDO</h3>
                        {orderLines.length > 0 ? orderLines.map((line, index) => <p key={`${line}-${index}`}><span>{index + 1}.</span>{line}</p>) : <p className={styles.muted}>Cole o texto do pedido para visualizar os itens.</p>}
                    </div>
                </section>
            </Main>
        </PageLayout>
    );
}
