export const PAUSE_REASONS = [
  { code: 'COMPRA_MATERIAL', label: 'Compra de material', tracksRoute: true },
  { code: 'LINK_OPERADORA', label: 'Aguardando liberação do link da operadora', tracksRoute: false },
  { code: 'SEM_ENERGIA_OU_RACK', label: 'Sem energia estabilizada ou rack inacessível', tracksRoute: false },
  { code: 'INFRA_CIVIL', label: 'Infraestrutura civil ou tubulação pendente', tracksRoute: false },
  { code: 'MOBILIARIO_PDV', label: 'Aguardando montagem do mobiliário do PDV', tracksRoute: false },
  { code: 'RESTRICAO_SHOPPING', label: 'Restrição de horário ou ruído no local', tracksRoute: false },
  { code: 'AGUARDANDO_EQUIPAMENTO', label: 'Aguardando chegada de equipamento', tracksRoute: false },
  { code: 'SEM_EPI_OU_ACESSO_ALTURA', label: 'Aguardando EPI ou liberação para trabalho em altura', tracksRoute: false },
  { code: 'AGUARDANDO_TI_CLIENTE', label: 'Aguardando liberação da equipe de TI do cliente', tracksRoute: false },
] as const;

export type PauseReasonCode = (typeof PAUSE_REASONS)[number]['code'];

export function isPauseReasonCode(value: unknown): value is PauseReasonCode {
  return PAUSE_REASONS.some((reason) => reason.code === value);
}

export function getPauseReasonLabel(value?: string | null) {
  return PAUSE_REASONS.find((reason) => reason.code === value)?.label || 'Motivo não informado';
}
