'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import { useToast } from '@/components/Toast/Toast';
import { supabase } from '@/api/supabase';
import { EmployeeInput } from '@/types/employee';
import { useEmployeeManager } from '@/hooks/useEmployeeManager';
import styles from './page.module.css';

type ImportRow = EmployeeInput & { sourceRow: number };

const text = (value: unknown) => String(value ?? '').trim();
const flag = (value: unknown) => ['1', 'sim', 's', 'true', 'x'].includes(text(value).toLowerCase());

function parseEmployeeRows(file: File): Promise<ImportRow[]> {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array', cellText: true, cellDates: false });
    const sheet = workbook.Sheets.FUNCIONARIOS_DADOS ?? workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });

    return rows
      .map((row, index) => ({
        sourceRow: index + 2,
        name: text(row.NOME).toUpperCase(),
        whatsapp_group: [flag(row['ABATE 01']) ? 'FRANGO' : '', flag(row['ABATE 02']) ? 'BOI' : '']
          .filter(Boolean)
          .join(', '),
        phone: text(row.TELEFONE),
        cpf: text(row.CPF),
        rg: text(row.RG),
        pix_type: text(row['TIPO PIX']).toUpperCase(),
        pix_key: text(row['CHAVE PIX']),
        bank: text(row.BANCO).toUpperCase(),
        notes: text(row.OBS),
        nickname: text(row.APELIDO).toUpperCase(),
        sex: text(row.SEXO).toUpperCase(),
        active: true,
      }))
      .filter((row) => row.name.length > 0);
  });
}

export default function CadastroFuncionarios() {
  const manager = useEmployeeManager();
  const toast = useToast();
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setImportRows(await parseEmployeeRows(file));
      toast.success('Prévia da planilha carregada. Revise antes de importar.');
    } catch (error) {
      toast.error(`Não foi possível ler a planilha: ${String(error)}`);
    }
  };

  const importEmployees = async () => {
    if (importRows.length === 0) return;
    setImporting(true);
    const { error } = await supabase.from('ESTOQUE_employee').upsert(
      importRows.map((row) => {
        const { sourceRow, ...employee } = row;
        void sourceRow;
        return employee;
      }),
      { onConflict: 'name' },
    );
    setImporting(false);
    if (error) {
      toast.error(`Erro ao importar: ${error.message}`);
      return;
    }
    setImportRows([]);
    await manager.refresh();
    toast.success(`${importRows.length} funcionários importados.`);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = await manager.saveEmployee();
    if (ok) toast.success('Funcionário salvo.');
    else toast.error(`Erro ao salvar: ${manager.error ?? 'tente novamente.'}`);
  };

  return (
    <PageLayout>
      <Sidebar>
        <div className={styles.sidebarTop}>
          <HeaderInput
            titulo="Funcionários"
            valor={manager.searchTerm}
            setValor={manager.setSearchTerm}
            labelDescricao="Buscar por nome, CPF ou telefone:"
            placeholder="Digite para buscar..."
          />
        </div>
        <nav className={styles.employeeList}>
          {manager.loading ? <p className={styles.message}>Carregando...</p> : manager.filteredEmployees.map((employee) => (
            <button
              type="button"
              key={employee.id}
              className={`${styles.employeeItem} ${manager.selectedId === employee.id ? styles.active : ''}`}
              onClick={() => manager.selectEmployee(employee)}
            >
              <strong>{employee.name}</strong>
              <span>{employee.whatsapp_group || 'Sem grupo'}</span>
            </button>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <button type="button" className={styles.btnAdd} onClick={() => manager.selectEmployee('new')}>+ Novo funcionário</button>
        </div>
      </Sidebar>

      <Main className={styles.mainContent}>
        <section className={styles.importCard}>
          <div>
            <span className={styles.eyebrow}>IMPORTAÇÃO DA PLANILHA</span>
            <h1>Funcionários de abate</h1>
            <p>Selecione a planilha para revisar os dados antes de importar.</p>
          </div>
          <label className={styles.fileButton}>
            Escolher planilha
            <input type="file" accept=".xlsx,.xls" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
          {importRows.length > 0 && (
            <div className={styles.importPreview}>
              <strong>{importRows.length} registros prontos para importar</strong>
              <span>Campos lidos: nome, grupos, telefone, documentos, Pix, banco, observações, apelido e sexo.</span>
              <button type="button" className={styles.btnImport} onClick={importEmployees} disabled={importing}>
                {importing ? 'Importando...' : 'Confirmar importação'}
              </button>
            </div>
          )}
        </section>

        {manager.selectedId ? (
          <form className={styles.formCard} onSubmit={save}>
            <div className={styles.formHeader}>
              <div>
                <span className={styles.eyebrow}>CADASTRO DE FUNCIONÁRIO</span>
                <h2>{manager.selectedId === 'new' ? 'Novo funcionário' : 'Editar funcionário'}</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => manager.setSelectedId(null)}>×</button>
            </div>
            <div className={styles.formGrid}>
              <label className={styles.full}>NOME<input required value={manager.formData.name} onChange={(event) => manager.setFormData({ ...manager.formData, name: event.target.value })} /></label>
              <label>TELEFONE<input value={manager.formData.phone} onChange={(event) => manager.setFormData({ ...manager.formData, phone: event.target.value })} /></label>
              <label>CPF<input value={manager.formData.cpf} onChange={(event) => manager.setFormData({ ...manager.formData, cpf: event.target.value })} /></label>
              <label>RG<input value={manager.formData.rg} onChange={(event) => manager.setFormData({ ...manager.formData, rg: event.target.value })} /></label>
              <label>APELIDO<input value={manager.formData.nickname} onChange={(event) => manager.setFormData({ ...manager.formData, nickname: event.target.value })} /></label>
              <label>TIPO PIX<input value={manager.formData.pix_type} onChange={(event) => manager.setFormData({ ...manager.formData, pix_type: event.target.value })} /></label>
              <label>CHAVE PIX<input value={manager.formData.pix_key} onChange={(event) => manager.setFormData({ ...manager.formData, pix_key: event.target.value })} /></label>
              <label>BANCO<input value={manager.formData.bank} onChange={(event) => manager.setFormData({ ...manager.formData, bank: event.target.value })} /></label>
              <label>SEXO<input value={manager.formData.sex} onChange={(event) => manager.setFormData({ ...manager.formData, sex: event.target.value })} /></label>
              <label className={styles.full}>GRUPOS DE WHATSAPP
                <select value={manager.formData.whatsapp_group} onChange={(event) => manager.setFormData({ ...manager.formData, whatsapp_group: event.target.value })}>
                  <option value="">Nenhum grupo</option>
                  <option value="FRANGO">FRANGO</option>
                  <option value="BOI">BOI</option>
                  <option value="FRANGO, BOI">FRANGO E BOI</option>
                </select>
              </label>
              <label className={`${styles.full} ${styles.check}`}><input type="checkbox" checked={manager.formData.active} onChange={(event) => manager.setFormData({ ...manager.formData, active: event.target.checked })} /> FUNCIONÁRIO ATIVO</label>
              <label className={styles.full}>OBSERVAÇÕES<textarea rows={3} value={manager.formData.notes} onChange={(event) => manager.setFormData({ ...manager.formData, notes: event.target.value })} /></label>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.btnCancel} onClick={() => manager.setSelectedId(null)}>Cancelar</button>
              <button type="submit" className={styles.btnSave} disabled={manager.saving}>{manager.saving ? 'Salvando...' : 'Salvar funcionário'}</button>
            </div>
          </form>
        ) : (
          <div className={styles.emptyState}><h2>Cadastro de funcionários</h2><p>Selecione um funcionário ou importe a planilha existente.</p></div>
        )}
      </Main>
    </PageLayout>
  );
}
