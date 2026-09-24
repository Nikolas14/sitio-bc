'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/api/supabase';
import EnvironmentGate from '@/components/EnvironmentGate/EnvironmentGate';
import { useToast } from '@/components/Toast/Toast';
import styles from './page.module.css';

interface Employee { id: string; name: string; whatsapp_group: string; }
interface Attendance { employee_id: string; work_date: string; abate_type: string; received_chicken: boolean; }

const today = () => new Date().toISOString().slice(0, 10);

export default function GalpaoPage() {
  const toast = useToast();
  const [date, setDate] = useState(today());
  const [abateType, setAbateType] = useState<'FRANGO' | 'BOI'>('FRANGO');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [received, setReceived] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.resolve().then(async () => {
      const [{ data: employeeData, error: employeeError }, { data: attendanceData, error: attendanceError }] = await Promise.all([
        supabase.from('ESTOQUE_employee').select('id, name, whatsapp_group').eq('active', true).order('name'),
        supabase.from('ESTOQUE_employee_attendance').select('employee_id, work_date, abate_type, received_chicken').order('work_date', { ascending: false }),
      ]);
      if (employeeError || attendanceError) {
        toast.error('Execute o schema de funcionários no Supabase antes de usar o galpão.');
        setLoading(false);
        return;
      }
      const rows = (employeeData as Employee[]) ?? [];
      const history = (attendanceData as Attendance[]) ?? [];
      const eligible = rows.filter((employee) => employee.whatsapp_group.toUpperCase().includes(abateType));
      const lastReceived = new Map<string, string>();
      history.filter((row) => row.abate_type === 'FRANGO' && row.received_chicken).forEach((row) => {
        if (!lastReceived.has(row.employee_id)) lastReceived.set(row.employee_id, row.work_date);
      });
      const suggested = abateType === 'FRANGO'
        ? [...eligible].sort((a, b) => (lastReceived.get(a.id) ?? '').localeCompare(lastReceived.get(b.id) ?? '') || Math.random() - .5).slice(0, 14)
        : [];
      setEmployees(eligible);
      setAttendance(Object.fromEntries(eligible.map((employee) => [employee.id, false])));
      setReceived(Object.fromEntries(suggested.map((employee) => [employee.id, true])));
      setLoading(false);
    });
  }, [abateType, toast]);

  const working = useMemo(() => employees.filter((employee) => attendance[employee.id]), [attendance, employees]);
  const selectedChickens = working.filter((employee) => received[employee.id]);

  const toggleAttendance = (employeeId: string, worked: boolean) => {
    const nextAttendance = { ...attendance, [employeeId]: worked };
    setAttendance(nextAttendance);
    if (abateType !== 'FRANGO') return;

    const workingIds = employees.filter((employee) => nextAttendance[employee.id]).map((employee) => employee.id);
    const selectedIds = workingIds.filter((id) => received[id]).slice(0, 14);
    const candidates = workingIds.filter((id) => !selectedIds.includes(id));
    while (selectedIds.length < Math.min(14, workingIds.length) && candidates.length > 0) {
      selectedIds.push(candidates.shift() as string);
    }
    setReceived(Object.fromEntries(workingIds.map((id) => [id, selectedIds.includes(id)])));
  };

  const toggleChicken = (employeeId: string, selected: boolean) => {
    if (selected && selectedChickens.length >= 14) {
      toast.error('Os 14 frangos já foram distribuídos.');
      return;
    }
    setReceived({ ...received, [employeeId]: selected });
  };

  const save = async () => {
    setSaving(true);
    const rows = employees.map((employee) => ({
      employee_id: employee.id,
      work_date: date,
      abate_type: abateType,
      worked: Boolean(attendance[employee.id]),
      received_chicken: abateType === 'FRANGO' && Boolean(attendance[employee.id] && received[employee.id]),
    }));
    const { error } = await supabase.from('ESTOQUE_employee_attendance').upsert(rows, { onConflict: 'employee_id,work_date,abate_type' });
    setSaving(false);
    if (error) toast.error(`Erro ao salvar frequência: ${error.message}`);
    else toast.success('Frequência do dia salva.');
  };

  return <EnvironmentGate role="galpao"><main className={styles.page}>
    <header className={styles.header}><div><span>AMBIENTE DO GALPÃO</span><h1>Frequência do abate</h1><p>Marque quem trabalhou e revise a sugestão de frangos.</p></div><button className={styles.save} onClick={save} disabled={saving || loading}>{saving ? 'Salvando...' : 'Salvar frequência'}</button></header>
    <section className={styles.controls}><label>DATA<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>ABATE<select value={abateType} onChange={(event) => setAbateType(event.target.value as 'FRANGO' | 'BOI')}><option value="FRANGO">FRANGO</option><option value="BOI">BOI</option></select></label><div className={styles.summary}><strong>{working.length}</strong><span>trabalhando</span>{abateType === 'FRANGO' && <><strong>{selectedChickens.length}</strong><span>frangos sugeridos</span></>}</div></section>
    <section className={styles.list}>{loading ? <p>Carregando funcionários...</p> : employees.map((employee) => <label key={employee.id} className={`${styles.employee} ${attendance[employee.id] ? styles.working : ''}`}><input type="checkbox" checked={Boolean(attendance[employee.id])} onChange={(event) => toggleAttendance(employee.id, event.target.checked)} /><span><strong>{employee.name}</strong><small>{received[employee.id] && attendance[employee.id] ? 'Receberá frango' : 'Sem frango'}</small></span>{abateType === 'FRANGO' && attendance[employee.id] && <input className={styles.chicken} type="checkbox" checked={Boolean(received[employee.id])} onChange={(event) => toggleChicken(employee.id, event.target.checked)} aria-label={`Frango para ${employee.name}`} />}</label>)}</section>
  </main></EnvironmentGate>;
}
