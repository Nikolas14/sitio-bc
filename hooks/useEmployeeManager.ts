import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/api/supabase';
import { IEmployee } from '@/types';

type EmployeeFormData = Omit<IEmployee, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: EmployeeFormData = {
    name: '',
    group_name: '',
    phone: '',
    cpf: '',
    rg: '',
    pix_key: '',
    notes: '',
};

export function useEmployeeManager() {
    const [employees, setEmployees] = useState<IEmployee[]>([]);
    const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
    const [formData, setFormData] = useState<EmployeeFormData>(emptyForm);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmployees = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ESTOQUE_employee')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            setError(error.message);
        } else {
            setError(null);
            setEmployees((data as IEmployee[]) ?? []);
        }
        setLoading(false);
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void fetchEmployees();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, []);

    const handleSelect = (employee: IEmployee | 'new') => {
        if (employee === 'new') {
            setSelectedId('new');
            setFormData({ ...emptyForm });
            return;
        }

        setSelectedId(employee.id);
        setFormData({
            name: employee.name ?? '',
            group_name: employee.group_name ?? '',
            phone: employee.phone ?? '',
            cpf: employee.cpf ?? '',
            rg: employee.rg ?? '',
            pix_key: employee.pix_key ?? '',
            notes: employee.notes ?? '',
        });
    };

    // Chave Pix não vai para maiúsculas: chaves aleatórias são case-sensitive.
    const saveEmployee = async (): Promise<string | null> => {
        setLoading(true);

        const payload = {
            ...formData,
            name: formData.name.trim().toUpperCase(),
            group_name: formData.group_name.trim().toUpperCase(),
            phone: formData.phone.trim(),
            cpf: formData.cpf.trim().toUpperCase(),
            rg: formData.rg.trim().toUpperCase(),
            pix_key: formData.pix_key.trim(),
            notes: formData.notes.trim().toUpperCase(),
            updated_at: new Date().toISOString(),
        };

        const result = selectedId === 'new'
            ? await supabase.from('ESTOQUE_employee').insert(payload)
            : await supabase.from('ESTOQUE_employee').update(payload).eq('id', selectedId);

        if (result.error) {
            setError(result.error.message);
            setLoading(false);
            return result.error.message;
        }

        setError(null);
        await fetchEmployees();
        setSelectedId(null);
        setLoading(false);
        return null;
    };

    const deleteEmployee = async (): Promise<string | null> => {
        if (!selectedId || selectedId === 'new') return 'Nenhum funcionário selecionado.';

        setLoading(true);
        const { error } = await supabase.from('ESTOQUE_employee').delete().eq('id', selectedId);
        if (error) {
            setError(error.message);
            setLoading(false);
            return error.message;
        }

        setError(null);
        await fetchEmployees();
        setSelectedId(null);
        setLoading(false);
        return null;
    };

    const filteredEmployees = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return employees.filter((employee) =>
            [employee.name, employee.cpf, employee.phone, employee.group_name]
                .some((value) => value?.toLowerCase().includes(term)),
        );
    }, [employees, searchTerm]);

    return {
        loading,
        error,
        employees,
        searchTerm,
        setSearchTerm,
        filteredEmployees,
        selectedId,
        setSelectedId,
        formData,
        setFormData,
        handleSelect,
        saveEmployee,
        deleteEmployee,
    };
}
