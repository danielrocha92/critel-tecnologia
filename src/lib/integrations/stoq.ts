export async function loginStoq(usuarioLogin: string, senhaDescriptografada: string): Promise<{ success: boolean; sessionCookie?: string; error?: string }> {
  try {
    // A URL informada pelo usuário para o Stoq:
    // https://ajuda.stoq.com.br/auth/v3/signin
    const response = await fetch('https://ajuda.stoq.com.br/auth/v3/signin?brand_id=33673546920603&locale=pt-br', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        user: {
          email: usuarioLogin,
          password: senhaDescriptografada
        }
      }),
    });

    if (!response.ok) {
      console.error(`Falha no login Stoq: ${response.status} ${response.statusText}`);
      return { success: false, error: 'Credenciais inválidas ou bloqueio de segurança do Stoq' };
    }

    const setCookieHeader = response.headers.get('set-cookie');
    
    return { 
      success: true, 
      sessionCookie: setCookieHeader || undefined
    };
  } catch (error: any) {
    console.error('Erro na integração com Stoq:', error);
    return { success: false, error: 'Erro de conexão com o Stoq' };
  }
}
