'use client';

import { useMemo, useState } from 'react';
import { Calculator, Plus, Trash2, X } from 'lucide-react';
import type { FinancialOS, LaborPricingLine, LaborForm, LaborProfessional, OSPricing, WorkCondition } from '@/services/osFinanceService';
import { calculateOSPricing, pricingDefaults } from '@/services/osFinanceService';
import styles from './OSPricingModal.module.css';

interface OSPricingModalProps {
  os: FinancialOS;
  isSaving: boolean;
  onClose: () => void;
  onSave: (pricing: OSPricing) => Promise<void>;
}

const costFields = [
  ['travel', 'Deslocamento / combustível'],
  ['toll', 'Pedágio / estacionamento'],
  ['meals', 'Alimentação'],
  ['lodging', 'Hospedagem'],
  ['materials', 'Materiais / outros'],
] as const;

const currency = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value);

const createDefaultPricing = (os: FinancialOS): OSPricing => {
  const laborLines: LaborPricingLine[] = os.pricing?.laborLines || [{
    id: crypto.randomUUID(),
    professional: 'Técnico',
    form: 'Hora',
    condition: 'Horário normal',
    quantity: 1,
    duration: Number(os.serviceHours.toFixed(2)),
  }];
  const otherCosts = os.pricing?.otherCosts || os.reportedExpenses.reduce((costs, expense) => {
    const nature = expense.natureza.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    if (nature.includes('desloc') || nature.includes('combustivel')) costs.travel += expense.valor;
    else if (nature.includes('pedagio') || nature.includes('estacionamento')) costs.toll += expense.valor;
    else if (nature.includes('aliment')) costs.meals += expense.valor;
    else if (nature.includes('hosped')) costs.lodging += expense.valor;
    else costs.materials += expense.valor;
    return costs;
  }, {
    travel: 0,
    toll: 0,
    meals: 0,
    lodging: 0,
    materials: os.reportedExpenses.length ? 0 : os.partsValue,
  });
  const taxPercent = os.pricing?.taxPercent ?? pricingDefaults.taxPercent;
  const profitMarginPercent = os.pricing?.profitMarginPercent ?? pricingDefaults.profitMarginPercent;

  return {
    laborLines,
    otherCosts,
    taxPercent,
    profitMarginPercent,
    calculation: calculateOSPricing(laborLines, otherCosts, taxPercent, profitMarginPercent),
  };
};

export default function OSPricingModal({ os, isSaving, onClose, onSave }: OSPricingModalProps) {
  const [initialPricing] = useState(() => createDefaultPricing(os));
  const [laborLines, setLaborLines] = useState(initialPricing.laborLines);
  const [otherCosts, setOtherCosts] = useState(initialPricing.otherCosts);
  const [taxPercent, setTaxPercent] = useState(initialPricing.taxPercent);
  const [profitMarginPercent, setProfitMarginPercent] = useState(initialPricing.profitMarginPercent);
  const [error, setError] = useState<string | null>(null);

  const calculation = useMemo(
    () => calculateOSPricing(laborLines, otherCosts, taxPercent, profitMarginPercent),
    [laborLines, otherCosts, taxPercent, profitMarginPercent],
  );

  const updateLaborLine = <K extends keyof LaborPricingLine>(index: number, key: K, value: LaborPricingLine[K]) => {
    setLaborLines((current) => current.map((line, lineIndex) =>
      lineIndex === index ? { ...line, [key]: value } : line,
    ));
  };

  const addLaborLine = () => setLaborLines((current) => [...current, {
    id: crypto.randomUUID(),
    professional: 'Técnico',
    form: 'Hora',
    condition: 'Horário normal',
    quantity: 1,
    duration: 0,
  }]);

  const handleSave = async () => {
    setError(null);
    if (
      laborLines.some((line) => !Number.isFinite(line.quantity) || !Number.isFinite(line.duration) || line.quantity < 0 || line.duration < 0) ||
      Object.values(otherCosts).some((value) => !Number.isFinite(value) || value < 0) ||
      !Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent >= 100 ||
      !Number.isFinite(profitMarginPercent) || profitMarginPercent < 0 || profitMarginPercent >= 100
    ) {
      setError('Valores precisam ser positivos, e impostos e margem devem ficar abaixo de 100%.');
      return;
    }

    try {
      await onSave({ laborLines, otherCosts, taxPercent, profitMarginPercent, calculation });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a conciliação.');
    }
  };

  return (
    <div className={styles.overlay}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="pricing-title">
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}><Calculator size={15} /> Conciliação financeira</span>
            <h2 id="pricing-title" className={styles.title}>OS {os.osNumber}</h2>
            <p className={styles.subtitle}>{os.clientName} · {os.technicianName}</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} disabled={isSaving} aria-label="Fechar conciliação">
            <X size={20} />
          </button>
        </header>

        <div className={styles.content}>
          <section className={styles.section} aria-labelledby="labor-title">
            <div className={styles.sectionHeader}>
              <div>
                <h3 id="labor-title" className={styles.sectionTitle}>Mão de obra</h3>
                <p className={styles.hint}>Técnico: R$ 350/dia · Ajudante: R$ 200/dia · 8 horas por diária</p>
              </div>
              <button type="button" className={styles.addButton} onClick={addLaborLine}>
                <Plus size={16} /> Adicionar linha
              </button>
            </div>

            <div className={styles.laborList}>
              {laborLines.map((line, index) => (
                <div className={styles.laborRow} key={line.id}>
                  <label className={styles.field}>
                    <span>Profissional</span>
                    <select value={line.professional} onChange={(event) => updateLaborLine(index, 'professional', event.target.value as LaborProfessional)}>
                      <option value="Técnico">Técnico</option>
                      <option value="Ajudante">Ajudante</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Forma</span>
                    <select value={line.form} onChange={(event) => updateLaborLine(index, 'form', event.target.value as LaborForm)}>
                      <option value="Hora">Hora</option>
                      <option value="Diária">Diária</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Condição</span>
                    <select value={line.condition} onChange={(event) => updateLaborLine(index, 'condition', event.target.value as WorkCondition)}>
                      <option value="Horário normal">Horário normal (1x)</option>
                      <option value="Fora do horário">Fora do horário (1,5x)</option>
                      <option value="Final de semana">Final de semana (1,5x)</option>
                      <option value="Feriado">Feriado (2x)</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Quantidade</span>
                    <input type="number" min="0" step="0.1" value={line.quantity} onChange={(event) => updateLaborLine(index, 'quantity', Number(event.target.value))} />
                  </label>
                  <label className={styles.field}>
                    <span>{line.form === 'Diária' ? 'Dias' : 'Horas'}</span>
                    <input type="number" min="0" step="0.25" value={line.duration} onChange={(event) => updateLaborLine(index, 'duration', Number(event.target.value))} />
                  </label>
                  <button type="button" className={styles.removeButton} onClick={() => setLaborLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} disabled={laborLines.length === 1} aria-label="Remover linha de mão de obra">
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="costs-title">
            <h3 id="costs-title" className={styles.sectionTitle}>Outros custos</h3>
            <div className={styles.costGrid}>
              {costFields.map(([key, label]) => (
                <label className={styles.field} key={key}>
                  <span>{label}</span>
                  <input type="number" min="0" step="0.01" value={otherCosts[key]} onChange={(event) => setOtherCosts((current) => ({ ...current, [key]: Number(event.target.value) }))} />
                </label>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="rates-title">
            <h3 id="rates-title" className={styles.sectionTitle}>Parâmetros comerciais</h3>
            <div className={styles.rateGrid}>
              <label className={styles.field}>
                <span>Impostos (%)</span>
                <input type="number" min="0" max="99.99" step="0.1" value={taxPercent} onChange={(event) => setTaxPercent(Number(event.target.value))} />
              </label>
              <label className={styles.field}>
                <span>Margem de lucro (%)</span>
                <input type="number" min="0" max="99.99" step="0.1" value={profitMarginPercent} onChange={(event) => setProfitMarginPercent(Number(event.target.value))} />
              </label>
            </div>
            <p className={styles.preservedRates}>Valores iniciais preservados da planilha: impostos 10,0% e margem de lucro 40,0%.</p>
          </section>

          <section className={styles.totals} aria-label="Cálculo do fechamento">
            <div><span>Total de horas</span><strong>{calculation.laborHours.toLocaleString('pt-BR')}</strong></div>
            <div><span>Mão de obra</span><strong>{currency(calculation.laborCost)}</strong></div>
            <div><span>Outros custos</span><strong>{currency(calculation.otherCosts)}</strong></div>
            <div><span>Custo total</span><strong>{currency(calculation.totalCost)}</strong></div>
            <div><span>Preço antes de impostos</span><strong>{currency(calculation.priceBeforeTax)}</strong></div>
            <div><span>Impostos</span><strong>{currency(calculation.taxValue)}</strong></div>
            <div className={styles.finalTotal}><span>Preço final ao cliente</span><strong>{currency(calculation.finalPrice)}</strong></div>
            <div><span>Valor final por hora</span><strong>{currency(calculation.finalHourlyPrice)}</strong></div>
          </section>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isSaving}>Cancelar</button>
          <button type="button" className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar conciliação'}
          </button>
        </footer>
      </section>
    </div>
  );
}
