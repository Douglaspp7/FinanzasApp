# SinDeudas — Estratégia de Conversão e Vendas (Meta Ads · LATAM ex-Brasil)

> Documento estratégico para transformar o app **SinDeudas** (FinanzasApp) em um
> infoproduto vendável, reusando o motor que já funciona na **DulceVaso**.
> Canal principal: **Meta Ads (Facebook/Instagram)**. Mercado: **Hispanoamérica
> (exceto Brasil)**.

---

## 1. Diagnóstico: o que você já tem e o que faltava

| Ativo | DulceVaso (provado) | SinDeudas (hoje) |
|---|---|---|
| App PWA completo | ✅ | ✅ (dashboard, plano de dívidas, sobres, metas, IA) |
| **Landing de vendas** | ✅ (`index.html`) | ❌ → **criada agora** (`landing.html`) |
| Meta Pixel + eventos | ✅ | ✅ na landing nova |
| Preço geolocalizado LATAM | ✅ | ✅ na landing nova |
| Checkout Hotmart | ✅ | ⚠️ falta criar a oferta |
| Garantia 7 dias | ✅ | ✅ na landing nova |
| UTMfy (atribuição por criativo) | ✅ | ✅ na landing nova |
| Gate de licença no app | ✅ (Firebase + Worker) | ❌ (hoje "modo de prueba") |

**A peça que faltava era a landing.** O app é o produto; a landing é a máquina de
venda do Meta Ads. Sem ela não há funil. Ela já está criada e espelha o funil
campeão da DulceVaso, com copy de dívida/finanças.

---

## 2. Posicionamento (o ângulo que vende)

Não vendemos "um app de finanças" (categoria saturada, baixa urgência). Vendemos
**a saída de um problema doloroso e urgente**: a dívida que sufoca a família.

- **Inimigo:** o cartão de crédito e o juro que "come" o pagamento mínimo.
- **Promessa:** *"Sal de deudas paso a paso y haz que el salario te alcance todo el mes."*
- **Mecanismo único:** Plano Sal de Deudas (bola de neve) + Sistema de Sobres +
  Score de Salud Financiera → um **plano claro**, não mais "anotar gastos".
- **Diferencial de confiança (forte na LATAM):** *"Sin conectar tu banco"*. O medo
  de apps que pedem a senha do banco é real. Vire isso em vantagem.
- **Oferta:** pagamento único, licença vitalícia, low-ticket. Sem mensalidade.

---

## 3. A oferta (preço e ancoragem)

A DulceVaso roda a US$ 5,90. Finanças tem **percepção de valor maior** e dor mais
cara (a pessoa deve milhares). Sugestão de teste:

- **Preço de oferta:** **US$ 9,90** (ancorado em "Antes US$ 97").
- Configurável no topo de `landing.html` (`USD_PRICE`).
- O preço local aparece automático na moeda do país (MXN, COP, PEN, CLP, ARS…).
- **Order bump na Hotmart** (sobe ticket médio sem subir custo de ads): por +US$ 7
  ofereça *"Plantilla de Presupuesto Familiar + 30 días de retos de ahorro"*.
- **Upsell pós-compra:** *"Acompañamiento 90 días + grupo privado"* por US$ 19–27.

> Faça o preço base trabalhar com a garantia de 7 dias para derrubar o risco a zero.

---

## 4. Estrutura de campanha no Meta Ads

### Fase 1 — Aprendizado (validar criativo + oferta)
- **Objetivo:** Vendas (otimizar por **Compra**; se volume baixo no início,
  otimizar por **InitiateCheckout** nos primeiros dias).
- **Estrutura:** 1 campanha **Advantage+** (ASC) OU 1 CBO com 2–3 conjuntos.
- **Público:** **Advantage Audience / aberto** (broad). O algoritmo acha o
  endividado melhor que segmentação manual. Idade 25–55.
- **Países (sem Brasil):** comece pelos de **maior volume e checkout fácil**:
  **México, Colômbia, Peru, Chile, Equador**. Argentina à parte (inflação/câmbio).
- **Orçamento:** US$ 10–20/dia por país-teste. Não mexa por 3–4 dias (fase de
  aprendizagem).
- **Posições:** Advantage+ placements (deixe automático), com foco em Reels/Stories.

### Fase 2 — Escala
- Duplique o que tem **CPA abaixo da meta** e suba orçamento 20%/dia (não dobre).
- **Retargeting** (público quente, eventos do Pixel): quem deu `ViewContent`,
  `Scroll_75`, `InitiateCheckout` mas não comprou → anúncio com depoimento +
  reforço da garantia.
- Abra mais países conforme o CPA permitir.

### Meta de números (referência low-ticket LATAM)
- Ticket US$ 9,90 → mira **CPA ≤ US$ 4–5** para margem saudável.
- Métrica-guia inicial: **custo por InitiateCheckout** e **% checkout→compra**.

---

## 5. Criativos (o que mais pesa na conversão)

Ordem de prioridade de produção (faça 4–6 variações para testar ângulos):

1. **UGC / "fala pra câmera"** (vídeo vertical 9–30s): mulher 30–45 anos, celular na
   mão. *"Pagaba el mínimo de 3 tarjetas y la deuda no bajaba. Hasta que armé un
   plan en esta app…"* → mostra o app baixando a dívida → CTA.
2. **Screen-recording do app** com legenda: registrar gasto → ver "Fecha de
   Libertad" → barra de dívida caindo. Prova de mecanismo.
3. **Antes/Depois**: "Mes 1: debía $48.000 / Mes 6: debía $22.000."
4. **Carrossel "3 pasos"**: replica os 3 passos da landing.
5. **Ângulo dor de casal**: *"Dejamos de pelear por el dinero"* (depoimento).

**Ganchos de copy (primeiras 3 linhas) para testar:**
- *"Si pagas el mínimo de tu tarjeta, esto te interesa."*
- *"No ganas poco. Nadie te enseñó a ordenar el sueldo cuando hay deudas."*
- *"La app que te dice a CUÁL deuda pagar primero (y cuándo serás libre)."*
- *"Sin conectar tu banco. Sin Excel. Sin mensualidades."*

> Regra de ouro: o criativo carrega 80% do resultado. Itere criativo, não público.

---

## 6. Funil técnico (fluxo da venda)

```
Anúncio Meta  →  landing.html (Pixel: PageView/ViewContent/Scroll/InitiateCheckout)
              →  Checkout Hotmart (Pixel: Purchase via integração Hotmart↔Meta)
              →  E-mail de acesso (Hotmart)  →  App SinDeudas (gate de licença)
```

UTMfy já capturando os UTMs e repassando ao checkout → você vê **qual criativo
vendeu**, não só qual gastou.

---

## 7. O que falta para faturar (checklist de go-live)

**Bloqueadores (precisa fazer antes de anunciar):**
- [ ] Criar a **oferta na Hotmart** e colar o link em `CHECKOUT_URL` (topo do `landing.html`).
- [ ] Criar o **Pixel** no Meta Business e colar o ID em `META_PIXEL_ID`.
- [ ] Integrar **Hotmart ↔ Meta Pixel** para disparar o evento `Purchase`.
- [ ] Publicar a landing (Cloudflare Pages, projeto `sindeudas` → URL `sindeudas.pages.dev`,
      já refletida nas tags `og:`/`canonical`).
- [ ] Definir entrega do acesso: e-mail Hotmart com link do app.

**Gate de licença no app (recomendado — hoje está "modo de prueba"):**
- [ ] Replicar o esquema da DulceVaso_app (Firebase Auth + Cloudflare Worker que
      valida a compra na Hotmart) para que só quem comprou use o app.
- [ ] Tela de login por "enlace mágico" (as strings já existem em `i18n.js`:
      `login_*`, inclusive `login_err_not_found` apontando para Hotmart).

**Conversão dentro do app (retenção = menos reembolso = mais LTV):**
- [ ] Garantir o "aha moment" em <2 min: o onboarding já pede sueldo/gastos/dívidas
      e gera a **Fecha de Libertad** — esse é o momento mágico. Reforçá-lo.
- [ ] Notificações/streak já existem (Fase 4) — ótimo para retenção.

---

## 8. Roadmap sugerido (ordem de execução)

1. **Semana 1:** publicar landing + criar oferta Hotmart + Pixel → 4 criativos UGC.
2. **Semana 1–2:** subir campanha teste (MX/CO/PE), US$ 10–20/dia, otimizar criativo.
3. **Semana 2–3:** ligar gate de licença no app + retargeting + order bump.
4. **Semana 3+:** escalar países/orçamento no que bate o CPA; adicionar upsell.

---

## 9. Por que isto deve funcionar

Você não está começando do zero: está **clonando um funil que já vende**
(DulceVaso) para uma dor **mais cara e mais universal** (dívida) num mercado
**enorme e sub-atendido** (famílias endividadas na Hispanoamérica). Mesmo motor,
mesmo Hotmart, mesmo Pixel, mesma mecânica de preço local — só trocou o produto e
o ângulo. O risco de execução é baixo; o trabalho real é **iterar criativo**.
