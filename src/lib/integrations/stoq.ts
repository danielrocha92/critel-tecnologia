export async function loginStoq(
  usuarioLogin: string,
  senhaDescriptografada: string,
): Promise<{ success: boolean; sessionCookie?: string; error?: string }> {
  try {
    // TODO: integrar corretamente com a autenticação do STOQ.
    // Enquanto a integração real não estiver implementada, retornamos um status explícito
    // para que a rota SSO continue funcionando sem quebrar a compilação.
    return {
      success: false,
      error: 'Integração STOQ ainda não implementada.',
    };
  } catch (error: any) {
    console.error('Erro na integração com STOQ:', error);
    return {
      success: false,
      error: 'Erro de conexão com o STOQ',
    };
  }
}
