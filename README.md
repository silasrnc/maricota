# Maricota — gestão da confeitaria

Painel privado e responsivo para organizar produtos e receitas, custo e preço sugerido, estoque, vendas com pagamentos parciais e despesas.

## Tecnologias

- Next.js App Router e TypeScript
- Supabase Auth e PostgreSQL
- Vercel para hospedagem

## Rodar localmente

1. Crie um projeto Supabase e escolha a região São Paulo (`South America (São Paulo)`).
2. No SQL Editor do Supabase, execute o conteúdo de [`supabase/migrations/202609290001_initial_schema.sql`](supabase/migrations/202609290001_initial_schema.sql).
3. Em **Authentication → Users**, crie o usuário da proprietária. Em **Authentication → Settings**, desative o cadastro público de usuários; o painel foi pensado para acesso privado.
4. Copie `.env.example` para `.env.local` e preencha a URL do projeto e a chave **Publishable** em **Project Settings → API Keys**:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
   ```

5. Instale dependências e inicie o servidor:

   ```bash
   npm install
   npm run dev
   ```

6. Abra [http://localhost:3000](http://localhost:3000) e entre com o usuário criado no Supabase.

Não coloque uma `service_role` ou secret key em variáveis `NEXT_PUBLIC_*`. O app usa a chave publishable no navegador; a proteção dos dados fica nas políticas RLS da migração.

## Publicar na Vercel

1. Envie o projeto para um repositório Git e importe-o na Vercel.
2. Cadastre `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` nas variáveis de ambiente da Vercel para Preview e Production.
3. Faça o deploy e configure a URL de produção em **Supabase → Authentication → URL Configuration**. Inclua também a URL de preview se for usar autenticação nela.

O plano [Vercel Hobby](https://vercel.com/docs/plans/hobby) é para uso pessoal e não comercial; para operar o negócio, use um plano que permita uso comercial ou outro host. No plano Free do [Supabase](https://supabase.com/docs/guides/platform/free-project-pausing), projetos com pouca atividade podem pausar após sete dias e não há backups automáticos. Para dados reais de vendas, planeje um plano com backups e uma rotina de cópia de segurança.

## Regras do sistema

- Uma venda confirmada baixa os ingredientes e materiais da receita em uma transação; entradas parciais ficam registradas como pagamentos e o restante aparece em **A receber**.
- A composição da receita é cadastrada por formato de venda. Informe as quantidades usando a mesma unidade configurada no estoque (g, kg, ml, l ou un).
- O custo considera o custo médio ponderado do estoque mais o custo adicional por formato. São sugeridos preços por markup e por margem-alvo.
- Cadastre compras de ingredientes, embalagens e tecidos como movimentações de estoque e inclua esses itens nas receitas. Compras com custo informado também aparecem em **Despesas**, mas não reduzem o resultado estimado naquele mês; o custo é reconhecido conforme os produtos são vendidos. Lance em **Despesas** os demais custos operacionais.
- Produtos podem ter ocasião e período de disponibilidade; formatos podem representar unidade, caixa ou outra quantidade específica.
- A aplicação e os indicadores usam português brasileiro, reais e datas no fuso de São Paulo.
