export const OTHER_ROOT_CAUSE = 'Outra causa (descrever)';

export const ticketTeams = [
  { value: 'SUPORTE_TECNICO', label: 'Suporte Técnico' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'ANALISTA', label: 'Analista' },
  { value: 'COMERCIAL', label: 'Comercial' },
] as const;

export type TicketTeam = (typeof ticketTeams)[number]['value'];

export function isTicketTeam(value: unknown): value is TicketTeam {
  return typeof value === 'string' && ticketTeams.some((team) => team.value === value);
}

export function getTicketTeamLabel(value: string | null | undefined) {
  return ticketTeams.find((team) => team.value === value)?.label || 'Não informado';
}

export type ProblemCategory = {
  label: string;
  departments: string[];
  rootCauses: string[];
};

const sharedHardwareDepartments = ['TI - Hardware', 'TI - Lojas'];
const sharedSoftwareDepartments = ['TI - Software', 'TI - Lojas'];

export const problemCategories: ProblemCategory[] = [
  { label: 'Hardware - Computador Gerência', departments: sharedHardwareDepartments, rootCauses: ['Troca SSD', 'Fonte queimada', 'Upgrade Máquina', 'Procedimento Remoto - N1'] },
  { label: 'Hardware - Impressora Gerência', departments: sharedHardwareDepartments, rootCauses: ['Queda de objeto/líquido', 'Obstrução da cabeça de impressão', 'Placa queimada', 'Instalação de driver', 'Procedimento remoto - N1', 'Almofada de tinta', 'Sensores', 'Erro geral'] },
  { label: 'Hardware - Impressora PDV', departments: sharedHardwareDepartments, rootCauses: ['Tampa quebrada', 'Cabeça de impressão', 'Placa queimada', 'Fonte queimada', 'Problema no rolete/guilhotina', 'Falha de comunicação/cabos'] },
  { label: 'Hardware - Monitor', departments: sharedHardwareDepartments, rootCauses: ['Tela quebrada', 'Tela queimada'] },
  { label: 'Hardware - Mouse', departments: sharedHardwareDepartments, rootCauses: ['Quebrado', 'Mau funcionamento'] },
  { label: 'Hardware - Nobreak', departments: sharedHardwareDepartments, rootCauses: ['Nobreak queimado', 'Nobreak não carrega', 'Rede elétrica geral', 'Nobreak descarregado/reiniciado'] },
  { label: 'Hardware - Notebook', departments: sharedHardwareDepartments, rootCauses: ['Tela quebrada', 'Queda de líquido', 'Fonte queimada', 'Conector da fonte', 'Teclado com defeito', 'Troca de SSD', 'Bateria'] },
  { label: 'Hardware - PDV', departments: sharedHardwareDepartments, rootCauses: ['Fonte queimada', 'Tela quebrada', 'Troca de SSD', 'Placa queimada'] },
  { label: 'Hardware - Smartphone', departments: sharedHardwareDepartments, rootCauses: ['Conector quebrado', 'Tela quebrada', 'Bateria', 'Celular antigo'] },
  { label: 'Hardware - Tablet', departments: sharedHardwareDepartments, rootCauses: ['Conector quebrado', 'Tela quebrada', 'Tablet antigo', 'Não liga'] },
  { label: 'Hardware - Wi-fi', departments: sharedHardwareDepartments, rootCauses: ['Troca de equipamento', 'Equipamento queimado', 'Infraestrutura local', 'Fonte queimada'] },
  { label: 'Hardware - Câmeras', departments: sharedHardwareDepartments, rootCauses: ['Conector quebrado', 'Não liga'] },
  { label: 'Hardware - Gaveta', departments: sharedHardwareDepartments, rootCauses: ['Chave quebrada', 'Cabo quebrado', 'Emperrada', 'Chave quebrada/perdida'] },
  { label: 'Hardware - Modem 4G', departments: sharedHardwareDepartments, rootCauses: ['Equipamento queimado', 'Chip com problema', 'Falta de chip'] },
  { label: 'Hardware - PinPad', departments: ['TI - Hardware', 'TI - Lojas'], rootCauses: ['Problema leitura cartão', 'Não liga', 'Sem comunicação rede', 'Duplicando/sem aparecer teclas'] },
  { label: 'Hardware - Relógio de Ponto', departments: ['TI - Hardware', 'TI - Lojas'], rootCauses: ['Problema de conexão', 'Equipamento queimado'] },
  { label: 'Hardware - Roteador', departments: sharedHardwareDepartments, rootCauses: ['Equipamento queimado', 'Configuração do equipamento'] },
  { label: 'Hardware - Som', departments: sharedHardwareDepartments, rootCauses: ['Equipamento queimado', 'Infraestrutura local/cabeamento'] },
  { label: 'Software - Erro ao confirmar venda', departments: sharedSoftwareDepartments, rootCauses: ['PinPad sem comunicação', 'Impressora desligada', 'Problema Sefaz', 'Erro SKU'] },
  { label: 'Software - Gestor de Lojas', departments: sharedSoftwareDepartments, rootCauses: ['Bloqueio de senha', 'Usuário não cadastrado', 'Sistema fora do ar', 'Erro de inventário', 'Erro de descarte', 'Erro no envio de fotos'] },
  { label: 'Software - PDV Stoq', departments: sharedSoftwareDepartments, rootCauses: ['PinPad sem comunicação', 'Impressora desligada', 'Erro de login Stoq', 'Erro de Ubuntu'] },
  { label: 'Software - TEF Sitef', departments: sharedSoftwareDepartments, rootCauses: ['Equipamento não liga', 'Sem comunicação com servidor', 'Problema no cadastro da operadora'] },
  { label: 'Software - Stoq Link', departments: sharedSoftwareDepartments, rootCauses: ['Conciliação de venda', 'Login não cadastrado', 'Sincronização de vendas'] },
  { label: 'Software - Pacote Office', departments: sharedSoftwareDepartments, rootCauses: ['Reinstalação', 'Nova licença'] },
  { label: 'Link / Internet', departments: ['TI - Hardware', 'TI - Lojas', 'TI - Telecom'], rootCauses: ['Modem queimado', 'Rompimento de fibra', 'Remanejamento local', 'Switch queimado', 'Topologia incorreta de cabos/equipamentos', 'Oscilação do link principal'] },
  { label: 'PINPAD / POS / GPOS - Troca ou Manutenção', departments: ['TI - Hardware', 'TI - Lojas', 'TI - SmartPOS'], rootCauses: ['Tampa quebrada', 'Carregador quebrado', 'Não inicializa sistema', 'Problema leitura cartão', 'Tela quebrada', 'Atualização de versão'] },
  { label: 'Telefonia Móvel', departments: ['TI - Telecom', 'TI - Hardware'], rootCauses: ['Chip queimado', 'Problema com operadora', 'Remanejamento de funcionário', 'Conector quebrado', 'Tela quebrada', 'Bateria', 'Celular antigo'] },
  { label: 'Televisor', departments: ['TI - Hardware'], rootCauses: ['Tela quebrada', 'Tela queimada'] },
  { label: 'Cadastrar/Alterar Cliente', departments: ['TI - Software'], rootCauses: ['Erro cadastro cliente - Clube Bacio', 'Pontuação de cliente divergente'] },
  { label: 'Acesso ao PDV - Colaboradores', departments: ['TI - Software'], rootCauses: ['Matrícula não cadastrada', 'Nome divergente', 'Troca de nome'] },
  { label: 'Software - Adobe PDF', departments: ['TI - Software'], rootCauses: [] },
  { label: 'Software - Câmeras', departments: sharedSoftwareDepartments, rootCauses: [] },
  { label: 'Software - E-mail', departments: sharedSoftwareDepartments, rootCauses: [] },
  { label: 'Software - Impressora Gerência', departments: sharedSoftwareDepartments, rootCauses: [] },
  { label: 'Software - Inventário', departments: sharedSoftwareDepartments, rootCauses: [] },
  { label: 'Software - MetaBase (Stoq Link)', departments: ['TI - Software'], rootCauses: [] },
  { label: 'Software - Protheus / Totvs', departments: ['TI - Software', 'TI - Lojas'], rootCauses: [] },
  { label: 'Software - Sefaz', departments: sharedSoftwareDepartments, rootCauses: [] },
  { label: 'Cadastrar/Alterar Produto (PDV)', departments: ['TI - Software', 'TI - Lojas'], rootCauses: [] },
  { label: 'Cadastrar/Alterar Tabela de Preços PDV', departments: ['TI - Software', 'TI - Lojas'], rootCauses: [] },
  { label: 'Cadastro de Fornecedor', departments: ['TI - Software'], rootCauses: [] },
  { label: 'Cadastro de Produto', departments: ['TI - Software'], rootCauses: [] },
  { label: 'Acessos / Uso de Softwares', departments: ['TI - Software'], rootCauses: [] },
];

export const problemDepartments = [
  'TI - Hardware',
  'TI - Lojas',
  'TI - Pdv Parado',
  'TI - SmartPOS',
  'TI - Software',
  'TI - Telecom',
];

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function getCategoriesForDepartment(department: string) {
  const selected = normalize(department);
  if (selected === normalize('TI - Pdv Parado')) {
    return problemCategories.filter((category) => /pdv|pinpad|pos|gpos/i.test(category.label));
  }
  return problemCategories.filter((category) => category.departments.some((item) => normalize(item) === selected));
}

export function getRootCauses(categoryLabel: string) {
  const category = problemCategories.find((item) => item.label === categoryLabel);
  return category?.rootCauses.length ? [...category.rootCauses, OTHER_ROOT_CAUSE] : [OTHER_ROOT_CAUSE];
}

export function isValidProblemSelection(department: string, categoryLabel: string, rootCause: string) {
  if (!problemDepartments.some((item) => normalize(item) === normalize(department))) return false;
  const category = getCategoriesForDepartment(department).find((item) => item.label === categoryLabel);
  return Boolean(category && getRootCauses(categoryLabel).includes(rootCause));
}
