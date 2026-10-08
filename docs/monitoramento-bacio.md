# Monitoramento Bacio di Latte

O painel usa o inventário de lojas da aba **Base Lojas** de `Bacio Lojas.xlsx`. Foram mantidos apenas código e nome; lojas marcadas como encerradas e o centro administrativo foram excluídos (244 lojas).

## Persistência

Aplicar a migration `supabase/migrations/20261009_create_bacio_pdv_monitoring.sql` no Supabase antes de abrir o painel. Ela cria `public.bacio_pdv_status`, com uma linha por terminal e chave única por loja/PDV.

## Envio da telemetria

Configurar `MILVUS_SYNC_SECRET` no servidor Next.js e no processo que coleta os estados do Milvus. O coletor deve enviar um `POST` para `/api/monitoramento/bacio/sync`, autenticando com `Authorization: Bearer <MILVUS_SYNC_SECRET>`.

```json
{
  "pdvs": [
    {
      "loja_codigo": "0001",
      "pdv_codigo": "caixa-01",
      "pdv_nome": "Caixa 01",
      "status_conexao": "ONLINE",
      "ultima_verificacao": "2026-10-08T20:00:00.000Z"
    }
  ]
}
```

`status_conexao` aceita `ONLINE` ou `OFFLINE`. A importação rejeita códigos de loja que não estejam no inventário. O painel atualiza a consulta automaticamente a cada 60 segundos. Um PDV fica verde enquanto seu último heartbeat tiver menos de três minutos; heartbeat vencido aparece como offline em vermelho. Sem nenhum registro do terminal, a loja exibe “Aguardando telemetria” e não presume que haja um PDV offline.

O endpoint e formato de leitura da API do Milvus não estão definidos no projeto atual. O coletor precisa mapear a resposta real do Milvus para esse contrato; a rota legada `/api/milvus/check` gera estados aleatórios e não deve ser usada como fonte operacional.
