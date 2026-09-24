import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/api/supabase';
import { EmployeeInput, IEmployee } from '@/types/employee';

const emptyEmployee: EmployeeInput = {
  name: '',
  whatsapp_group: '',
  phone: '',
  cpf: '',
  rg: '',
  pix_type: '',
  pix_key: '',
  bank: '',
  notes: '',
  nickname: '',
  sex: '',
  active: true,
};

export function useEmployeeManager() {
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeInput>(emptyEmployee);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('ESTOQUE_employee')
      .select('*')
      .order('name', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEmployees((data as IEmployee[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchEmployees);
  }, [fetchEmployees]);

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((employee) =>
      [employee.name, employee.cpf, employee.phone, employee.nickname]
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [employees, searchTerm]);

  const selectEmployee = (employee: IEmployee | 'new') => {
    if (employee === 'new') {
      setSelectedId('new');
      setFormData(emptyEmployee);
      return;
    }
    setSelectedId(employee.id);
    setFormData({
      name: employee.name,
      whatsapp_group: employee.whatsapp_group,
      phone: employee.phone,
      cpf: employee.cpf,
      rg: employee.rg,
      pix_type: employee.pix_type,
      pix_key: employee.pix_key,
      bank: employee.bank,
      notes: employee.notes,
      nickname: employee.nickname,
      sex: employee.sex,
      active: employee.active,
    });
  };

  const saveEmployee = async () => {
    setSaving(true);
    setError(null);
    const payload = { ...formData, name: formData.name.trim().toUpperCase() };
    const response = selectedId === 'new'
      ? await supabase.from('ESTOQUE_employee').insert(payload)
      : await supabase.from('ESTOQUE_employee').update(payload).eq('id', selectedId);

    setSaving(false);
    if (response.error) {
      setError(response.error.message);
      return false;
    }
    await fetchEmployees();
    setSelectedId(null);
    return true;
  };

  return {
    employees,
    filteredEmployees,
    selectedId,
    setSelectedId,
    formData,
    setFormData,
    searchTerm,
    setSearchTerm,
    loading,
    saving,
    error,
    selectEmployee,
    saveEmployee,
    refresh: fetchEmployees,
  };
}
