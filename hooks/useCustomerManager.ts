import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/api/supabase';
import { ICustomer } from '@/types';

type CustomerFormData = Omit<ICustomer, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: CustomerFormData = {
    name: '',
    cpf: '',
    address: '',
    cep: '',
    phone: '',
    city: '',
    airport: '',
    pickup_person: '',
    pickup_cpf: '',
    alternative_pickup_person: '',
    alternative_pickup_cpf: '',
    notes: '',
};

export function useCustomerManager() {
    const [customers, setCustomers] = useState<ICustomer[]>([]);
    const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
    const [formData, setFormData] = useState<CustomerFormData>(emptyForm);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCustomers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ESTOQUE_customer')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            setError(error.message);
        } else {
            setError(null);
            setCustomers((data as ICustomer[]) ?? []);
        }
        setLoading(false);
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void fetchCustomers();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, []);

    const handleSelect = (customer: ICustomer | 'new') => {
        if (customer === 'new') {
            setSelectedId('new');
            setFormData({ ...emptyForm });
            return;
        }

        setSelectedId(customer.id);
        setFormData({
            name: customer.name ?? '',
            cpf: customer.cpf ?? '',
            address: customer.address ?? '',
            cep: customer.cep ?? '',
            phone: customer.phone ?? '',
            city: customer.city ?? '',
            airport: customer.airport ?? '',
            pickup_person: customer.pickup_person ?? '',
            pickup_cpf: customer.pickup_cpf ?? '',
            alternative_pickup_person: customer.alternative_pickup_person ?? '',
            alternative_pickup_cpf: customer.alternative_pickup_cpf ?? '',
            notes: customer.notes ?? '',
        });
    };

    const saveCustomer = async (): Promise<string | null> => {
        setLoading(true);

        const payload = Object.fromEntries(
            Object.entries(formData).map(([key, value]) => [key, value.trim().toUpperCase()]),
        );
        payload.updated_at = new Date().toISOString();

        const result = selectedId === 'new'
            ? await supabase.from('ESTOQUE_customer').insert(payload)
            : await supabase.from('ESTOQUE_customer').update(payload).eq('id', selectedId);

        if (result.error) {
            setError(result.error.message);
            setLoading(false);
            return result.error.message;
        } else {
            setError(null);
            await fetchCustomers();
            setSelectedId(null);
        }
        setLoading(false);
        return null;
    };

    const handleSave = async (event: React.FormEvent): Promise<boolean> => {
        event.preventDefault();
        const saveError = await saveCustomer();
        return saveError === null;
    };

    const deleteCustomer = async (): Promise<string | null> => {
        if (!selectedId || selectedId === 'new') return 'Nenhum cliente selecionado.';

        setLoading(true);
        const { error } = await supabase.from('ESTOQUE_customer').delete().eq('id', selectedId);
        if (error) {
            setError(error.message);
            setLoading(false);
            return error.message;
        } else {
            setError(null);
            await fetchCustomers();
            setSelectedId(null);
        }
        setLoading(false);
        return null;
    };

    const handleDelete = async (): Promise<boolean> => {
        if (!selectedId || selectedId === 'new') return false;
        if (!confirm(`Excluir permanentemente o cliente "${formData.name}"?`)) return false;

        const deleteError = await deleteCustomer();
        return deleteError === null;
    };

    const filteredCustomers = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return customers.filter((customer) =>
            [customer.name, customer.cpf, customer.phone, customer.city]
                .some((value) => value?.toLowerCase().includes(term)),
        );
    }, [customers, searchTerm]);

    return {
        loading,
        error,
        customers,
        searchTerm,
        setSearchTerm,
        filteredCustomers,
        selectedId,
        setSelectedId,
        formData,
        setFormData,
        handleSelect,
        handleSave,
        handleDelete,
        saveCustomer,
        deleteCustomer,
    };
}
