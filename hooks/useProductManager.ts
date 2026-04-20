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

        if (data) setProducts(data);
        if (error) console.error("Erro ao carregar:", error);
    };

    useEffect(() => {
        if (isAdmin) fetchProducts();
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: any = {
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
            alert("Erro ao salvar: " + error.message);
        } else {
            await fetchProducts();
            setSelectedId(null);
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (selectedId === 'new' || !selectedId) return;
        if (confirm(`Excluir permanentemente o produto "${formData.name.toUpperCase()}"?`)) {
            setLoading(true);
            const { error } = await supabase.from('ESTOQUE_product').delete().eq('id', selectedId);
            if (error) alert("Erro: O produto pode estar vinculado a movimentações.");
            else {
                await fetchProducts();
                setSelectedId(null);
            }
            setLoading(false);
        }
    };

    const handleAdminConfirm = (senhaCorreta: string) => {
        if (adminPassword === senhaCorreta) {
            setIsAdmin(true);
        } else {
            alert('Senha incorreta!');
            setAdminPassword('');
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