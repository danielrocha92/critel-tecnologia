export async function loginMilvus(usuarioLogin: string, senhaDescriptografada: string): Promise<{ success: boolean; sessionCookie?: string; error?: string }> {
  try {
    const response = await fetch('https://app.milvus.com.br/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Supondo o padrão da maioria das APIs. Se a Milvus usar form-data, precisará ser ajustado.
      body: JSON.stringify({
        email: usuarioLogin,
        password: senhaDescriptografada
      }),
    });

    if (!response.ok) {
      console.error(`Falha no login Milvus: ${response.status} ${response.statusText}`);
      return { success: false, error: 'Credenciais inválidas ou bloqueio do Milvus' };
    }

    // Extrair os cookies de sessão da resposta do Milvus para injetar no navegador do usuário
    const setCookieHeader = response.headers.get('set-cookie');
    
    // Como a API pode retornar um Bearer Token em vez de cookies:
    const data = await response.json().catch(() => ({}));

    // Retorna os cookies que o Milvus gerou para que possamos passar para o usuário.
    // Se o Milvus usa token localstorage no frontend deles, a integração de SSO Proxy pode precisar
    // injetar um script que seta o localStorage, ou atuar como proxy reverso em todas as rotas.
    return { 
      success: true, 
      sessionCookie: setCookieHeader || (data.token ? `milvus_token=${data.token}; HttpOnly; Secure; Path=/` : undefined)
    };
  } catch (error: any) {
    console.error('Erro na integração com Milvus:', error);
    return { success: false, error: 'Erro de conexão com o Milvus' };
  }
}
