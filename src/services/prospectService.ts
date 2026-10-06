export type ProspectStatus = 'LEAD' | 'CONTATO' | 'NEGOCIACAO' | 'PROPOSTA' | 'FECHADO' | 'PERDIDO';

export interface Prospect {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  value: number;
  status: ProspectStatus;
  lastContact: string;
  notes: string;
}

// Mock Data
let mockProspects: Prospect[] = [
  {
    id: '1',
    name: 'João Almeida',
    company: 'Rede Farmácias XYZ',
    phone: '+55 11 98888-7777',
    email: 'joao.almeida@xyz.com.br',
    value: 15000.00,
    status: 'NEGOCIACAO',
    lastContact: '2026-10-05T14:30:00Z',
    notes: 'Cliente demonstrou forte interesse no pacote anual de manutenção.',
  },
  {
    id: '2',
    name: 'Mariana Costa',
    company: 'Clínica Sorriso',
    phone: '+55 21 97777-6666',
    email: 'contato@clinicasorriso.med.br',
    value: 5000.00,
    status: 'LEAD',
    lastContact: '2026-10-06T09:15:00Z',
    notes: 'Recebido via formulário do site.',
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    company: 'Condomínio Bela Vista',
    phone: '+55 41 96666-5555',
    email: 'sindico@belavista.com.br',
    value: 22000.00,
    status: 'PROPOSTA',
    lastContact: '2026-10-04T16:45:00Z',
    notes: 'Proposta enviada, aguardando aprovação na assembleia.',
  },
  {
    id: '4',
    name: 'Ana Pereira',
    company: 'Restaurante Sabor',
    phone: '+55 31 95555-4444',
    email: 'gerencia@restaurantesabor.com',
    value: 8500.00,
    status: 'FECHADO',
    lastContact: '2026-10-01T10:00:00Z',
    notes: 'Contrato assinado. Início na próxima semana.',
  }
];

export const prospectService = {
  /**
   * Lista todos os prospectos
   */
  async listProspects(): Promise<Prospect[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockProspects]);
      }, 600);
    });
  },

  /**
   * Atualiza o status de um prospecto
   */
  async updateStatus(id: string, newStatus: ProspectStatus): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const prospect = mockProspects.find(p => p.id === id);
        if (prospect) {
          prospect.status = newStatus;
          prospect.lastContact = new Date().toISOString();
        }
        resolve(true);
      }, 400);
    });
  },

  /**
   * Adiciona um novo prospecto
   */
  async createProspect(prospect: Omit<Prospect, 'id' | 'lastContact'>): Promise<Prospect> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newProspect: Prospect = {
          ...prospect,
          id: Math.random().toString(36).substring(7),
          lastContact: new Date().toISOString(),
        };
        mockProspects.push(newProspect);
        resolve(newProspect);
      }, 600);
    });
  }
};
