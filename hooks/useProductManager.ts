import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import { IProduct } from '@/types';


export function useProductManager() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [products, setProducts] = useState<IProduct[]>([]);
    const [selectedId, setSelectedId] = useState<number | 'new' | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        type: '',
        price: '',
        weightAlt: ''
    });

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('ESTOQUE_product')
            .select('*')
            .order('name', { ascending: true });

        if (data) setProducts(data as unknown as IProduct[]);
        if (error) setError(error.message);
    };

    useEffect(() => {
        if (!isAdmin) return;
        supabase
            .from('ESTOQUE_product')
            .select('*')
            .order('name', { ascending: true })
            .then(({ data, error }) => {
                if (data) setProducts(data as unknown as IProduct[]);
                if (error) setError(error.message);
            });
    }, [isAdmin]);

    const handleSelect = (prod: IProduct | 'new') => {
        if (prod === 'new') {
            setSelectedId('new');
            setFormData({ id: '', name: '', type: '', price: '', weightAlt: '' });
        } else {
            setSelectedId(prod.id);
            setFormData({
                id: prod.id.toString(),
                name: prod.name,
                type: prod.type || '',
                price: prod.price?.toString() || '',
                weightAlt: prod.weightAlt?.toString() || ''
            });
        }
    };

    const handleSave = async (e: React.FormEvent): Promise<boolean> => {
        e.preventDefault();
        setLoading(true);

        interface ProductPayload {
            name: string;
            type: string;
            price: number;
            weightAlt: number;
            id?: number;
        }

        const payload: ProductPayload = {
            name: formData.name.toUpperCase().trim(),
            type: formData.type,
            price: parseFloat(formData.price) || 0,
            weightAlt: parseFloat(formData.weightAlt) || 0,
        };

        let error;
        if (selectedId === 'new') {
            if (formData.id) payload.id = parseInt(formData.id);
            const { error: insError } = await supabase.from('ESTOQUE_product').insert([payload]);
            error = insError;
        } else {
            const { error: updError } = await supabase.from('ESTOQUE_product').update(payload).eq('id', selectedId);
            error = updError;
        }

        if (error) {
            setError(error.message);
            setLoading(false);
            return false;
        } else {
            setError(null);
            await fetchProducts();
            setSelectedId(null);
        }
        setLoading(false);
        return true;
    };

    const handleDelete = async (): Promise<boolean> => {
        if (selectedId === 'new' || !selectedId) return false;
        if (confirm(`Excluir permanentemente o produto "${formData.name.toUpperCase()}"?`)) {
            setLoading(true);
            const { error } = await supabase.from('ESTOQUE_product').delete().eq('id', selectedId);
            if (error) {
                setError("O produto pode estar vinculado a movimentações.");
                setLoading(false);
                return false;
            }
            else {
                setError(null);
                await fetchProducts();
                setSelectedId(null);
            }
            setLoading(false);
            return true;
        }
        return false;
    };

    const handleAdminConfirm = async (): Promise<boolean> => {
        const { verifyAdminPassword } = await import('@/utils/adminAuth');
        const ok = await verifyAdminPassword(adminPassword);
        if (ok) {
            setIsAdmin(true);
            setError(null);
            return true;
        } else {
            setError('Senha incorreta!');
            setAdminPassword('');
            return false;
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.id.toString().includes(searchTerm)
        );
    }, [products, searchTerm]);

    return {
        isAdmin,
        adminPassword,
        setAdminPassword,
        handleAdminConfirm,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filteredProducts,
        selectedId,
        setSelectedId,
        formData,
        setFormData,
        handleSelect,
        handleSave,
        handleDelete
    };
}