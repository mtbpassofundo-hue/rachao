/**
 * Freio simples por IP, em memória.
 *
 * Cada instância da função na Vercel tem o seu próprio contador, então isso não
 * é uma defesa forte — serve para cortar o caso comum (alguém segurando o
 * botão, um script bobo) sem depender de nenhum serviço externo. O que protege
 * de verdade contra duplicata é a unicidade do CPF na tabela.
 */
type Janela = { contagem: number; reinicioEm: number };

const janelas = new Map<string, Janela>();

export function dentroDoLimite(
  chave: string,
  maximo: number,
  janelaMs: number,
): boolean {
  const agora = Date.now();

  if (janelas.size > 500) {
    for (const [k, j] of janelas) {
      if (j.reinicioEm <= agora) janelas.delete(k);
    }
  }

  const atual = janelas.get(chave);
  if (!atual || atual.reinicioEm <= agora) {
    janelas.set(chave, { contagem: 1, reinicioEm: agora + janelaMs });
    return true;
  }

  atual.contagem += 1;
  return atual.contagem <= maximo;
}
