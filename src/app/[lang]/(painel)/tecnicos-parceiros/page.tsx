'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search, UserPlus, X, MapPin, Mail, BriefcaseBusiness, ShieldCheck } from 'lucide-react';
import styles from './tecnicos-parceiros.module.css';

type TechnicianDetails = {
  situacao_cadastro: string | null;
  empresa: string | null;
  situacao_faiston: string | null;
  cpf: string | null;
  rg: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  telefone: string | null;
  email_contato: string | null;
  codigo_parceiro: string | null;
  especialidades: string | null;
};

type Technician = {
  id: string;
  nome: string;
  email: string | null;
  status: string;
  contaCriada: boolean;
  detalhes: TechnicianDetails | null;
};

type TechnicianForm = TechnicianDetails & { id?: string; nome: string };

const emptyForm: TechnicianForm = {
  nome: '', situacao_cadastro: '', empresa: '', situacao_faiston: '', cpf: '', rg: '',
  endereco: '', cidade: '', estado: '', cep: '', telefone: '', email_contato: '',
  codigo_parceiro: '', especialidades: '',
};

const detailFields: Array<{ key: keyof TechnicianDetails; label: string }> = [
  { key: 'situacao_cadastro', label: 'Status do cadastro' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'situacao_faiston', label: 'Status Faiston' },
  { key: 'cpf', label: 'CPF' },
  { key: 'rg', label: 'RG' },
  { key: 'endereco', label: 'Endereço' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'estado', label: 'Estado' },
  { key: 'cep', label: 'CEP' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'email_contato', label: 'E-mail de contato' },
  { key: 'codigo_parceiro', label: 'Código do parceiro' },
  { key: 'especialidades', label: 'Especialidades' },
];

async function obterTecnicos() {
  const response = await fetch('/api/tecnicos-parceiros', { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Não foi possível carregar os técnicos.');
  return result;
}

export default function TecnicosParceirosPage() {
  const [tecnicos, setTecnicos] = useState<Technician[]>([]);
  const [podeEditar, setPodeEditar] = useState(false);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<Technician | null>(null);
  const [formulario, setFormulario] = useState<TechnicianForm | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const carregar = useCallback(async () => {
    try {
      const result = await obterTecnicos();
      setErro('');
      setTecnicos(result.tecnicos || []);
      setPodeEditar(Boolean(result.permissoes?.podeEditar));
    } catch (loadError) {
      setErro(loadError instanceof Error ? loadError.message : 'Erro ao carregar os técnicos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    obterTecnicos()
      .then((result) => {
        if (!mounted) return;
        setTecnicos(result.tecnicos || []);
        setPodeEditar(Boolean(result.permissoes?.podeEditar));
      })
      .catch((loadError: unknown) => {
        if (mounted) setErro(loadError instanceof Error ? loadError.message : 'Erro ao carregar os técnicos.');
      })
      .finally(() => {
        if (mounted) setCarregando(false);
      });
    return () => { mounted = false; };
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return tecnicos;
    return tecnicos.filter((tecnico) => {
      const dados = tecnico.detalhes;
      return [tecnico.nome, tecnico.email, dados?.empresa, dados?.cidade, dados?.estado, dados?.especialidades]
        .some((valor) => valor?.toLocaleLowerCase('pt-BR').includes(termo));
    });
  }, [busca, tecnicos]);

  const iniciarEdicao = (tecnico?: Technician) => {
    setAviso('');
    setErro('');
    setSelecionado(null);
    setFormulario(tecnico
      ? { ...emptyForm, ...(tecnico.detalhes || {}), id: tecnico.id, nome: tecnico.nome }
      : { ...emptyForm });
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formulario) return;
    setSalvando(true);
    setErro('');
    setAviso('');
    try {
      const response = await fetch('/api/tecnicos-parceiros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar o cadastro.');
      setFormulario(null);
      setAviso(result.avisoConvite || (result.conviteEnviado
        ? 'Cadastro salvo. O convite de acesso foi enviado ao Gmail informado.'
        : 'Pré-cadastro salvo como pendente.'));
      await carregar();
    } catch (saveError) {
      setErro(saveError instanceof Error ? saveError.message : 'Erro ao salvar o cadastro.');
    } finally {
      setSalvando(false);
    }
  };

  const setField = (key: keyof TechnicianForm, value: string) => {
    setFormulario((current) => current ? { ...current, [key]: value } : current);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}><BriefcaseBusiness size={15} /> Equipe de campo</span>
          <h1 className={styles.title}>Técnicos parceiros</h1>
          <p className={styles.subtitle}>Consulte os cadastros e os dados de atendimento dos parceiros técnicos.</p>
        </div>
        {podeEditar && (
          <button type="button" className={styles.primaryButton} onClick={() => iniciarEdicao()}>
            <UserPlus size={17} /> Novo cadastro
          </button>
        )}
      </header>

      {aviso && <p className={styles.successNotice} role="status">{aviso}</p>}
      {erro && !formulario && <p className={styles.errorNotice} role="alert">{erro}</p>}

      <section className={styles.directory} aria-label="Lista de técnicos parceiros">
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={17} aria-hidden="true" />
            <span className={styles.visuallyHidden}>Buscar técnicos</span>
            <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por nome, empresa ou cidade" />
          </label>
          <span className={styles.count}>{filtrados.length} {filtrados.length === 1 ? 'técnico' : 'técnicos'}</span>
        </div>

        {carregando ? <p className={styles.emptyState}>Carregando cadastros…</p> : filtrados.length === 0 ? (
          <p className={styles.emptyState}>{busca ? 'Nenhum técnico corresponde à busca.' : 'Nenhum técnico cadastrado ainda.'}</p>
        ) : (
          <div className={styles.tableScroller}>
            <table className={styles.table}>
              <thead><tr><th scope="col">Técnico</th><th scope="col">Empresa</th><th scope="col">Localidade</th><th scope="col">Cadastro</th><th scope="col">Acesso</th><th scope="col"><span className={styles.visuallyHidden}>Ações</span></th></tr></thead>
              <tbody>
                {filtrados.map((tecnico) => {
                  const detail = tecnico.detalhes;
                  return (
                    <tr key={tecnico.id}>
                      <td><span className={styles.name}>{tecnico.nome}</span><span className={styles.email}>{tecnico.email || 'E-mail não informado'}</span></td>
                      <td>{detail?.empresa || '—'}</td>
                      <td>{[detail?.cidade, detail?.estado].filter(Boolean).join(' / ') || '—'}</td>
                      <td><span className={styles.status}>{detail?.situacao_cadastro || 'Sem status'}</span></td>
                      <td><span className={tecnico.contaCriada && tecnico.status === 'ATIVO' ? styles.accessLinked : styles.accessPending}>{tecnico.contaCriada ? (tecnico.status === 'ATIVO' ? 'Acesso ativo' : tecnico.status === 'BANIDO' ? 'Acesso suspenso' : 'Conta criada · pendente') : 'Pendente · sem conta'}</span></td>
                      <td className={styles.actionsCell}>
                        <button type="button" className={styles.textButton} onClick={() => setSelecionado(tecnico)}>Detalhes</button>
                        {podeEditar && <button type="button" className={styles.textButton} onClick={() => iniciarEdicao(tecnico)}>Editar</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selecionado && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setSelecionado(null)}>
          <section className={`${styles.modal} ${styles.detailsModal}`} role="dialog" aria-modal="true" aria-labelledby="technician-details-title" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div><span className={styles.eyebrow}>Ficha do parceiro</span><h2 id="technician-details-title">{selecionado.nome}</h2></div>
              <button className={styles.iconButton} type="button" aria-label="Fechar detalhes" onClick={() => setSelecionado(null)}><X size={20} /></button>
            </div>
            <div className={styles.profileSummary}>
              <span><Mail size={15} /> {selecionado.email || 'E-mail não informado'}</span>
              <span><MapPin size={15} /> {[selecionado.detalhes?.cidade, selecionado.detalhes?.estado].filter(Boolean).join(' / ') || 'Localidade não informada'}</span>
              <span><ShieldCheck size={15} /> {selecionado.contaCriada ? (selecionado.status === 'ATIVO' ? 'Acesso ativo' : selecionado.status === 'BANIDO' ? 'Acesso suspenso' : 'Conta criada · aguardando aprovação') : 'Sem conta · cadastro pendente'}</span>
            </div>
            <dl className={styles.detailGrid}>
              {detailFields.map(({ key, label }) => (
                <div key={key} className={styles.detailItem}><dt>{label}</dt><dd>{selecionado.detalhes?.[key] || 'Não informado'}</dd></div>
              ))}
            </dl>
            {podeEditar && <button type="button" className={styles.primaryButton} onClick={() => iniciarEdicao(selecionado)}>Editar cadastro</button>}
          </section>
        </div>
      )}

      {formulario && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setFormulario(null)}>
          <section className={`${styles.modal} ${styles.formModal}`} role="dialog" aria-modal="true" aria-labelledby="technician-form-title" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div><span className={styles.eyebrow}>Cadastro protegido</span><h2 id="technician-form-title">{formulario.id ? 'Editar técnico' : 'Novo técnico parceiro'}</h2></div>
              <button className={styles.iconButton} type="button" aria-label="Fechar formulário" onClick={() => setFormulario(null)}><X size={20} /></button>
            </div>
            <p className={styles.formHint}>Um convite de acesso será enviado somente quando o e-mail de contato incluir um endereço @gmail.com. Os demais cadastros ficam pendentes.</p>
            <form onSubmit={salvar} className={styles.form}>
              <label className={styles.field}><span>Nome completo *</span><input required maxLength={150} value={formulario.nome} onChange={(event) => setField('nome', event.target.value)} /></label>
              {detailFields.map(({ key, label }) => (
                <label key={key} className={`${styles.field} ${key === 'endereco' || key === 'email_contato' || key === 'especialidades' ? styles.fieldWide : ''}`}>
                  <span>{label}</span>
                  {key === 'especialidades' || key === 'endereco' ? (
                    <textarea rows={key === 'especialidades' ? 2 : 3} value={formulario[key] || ''} onChange={(event) => setField(key, event.target.value)} />
                  ) : (
                    <input type={key === 'email_contato' ? 'text' : 'text'} maxLength={key === 'estado' ? 2 : undefined} value={formulario[key] || ''} onChange={(event) => setField(key, event.target.value)} />
                  )}
                </label>
              ))}
              {erro && <p className={styles.errorNotice} role="alert">{erro}</p>}
              <div className={styles.formActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setFormulario(null)}>Cancelar</button>
                <button type="submit" className={styles.primaryButton} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar cadastro'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
