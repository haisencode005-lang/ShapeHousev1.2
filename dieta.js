/* =========================================================================
   SHAPEHOUSE — dieta.js
   Calcula TMB (Mifflin-St Jeor), GET, macros por objetivo e monta um
   cardápio REALISTA e tipicamente brasileiro, usando apenas os alimentos
   que o usuário selecionou. Nunca inventa ingredientes nem combinações
   estranhas (ex: arroz no café da manhã).
   ========================================================================= */

/** Base nutricional aproximada por 100g (kcal, proteína, carboidrato, gordura). */
const BANCO_ALIMENTOS = {
  // proteínas
  frango:   { nome: 'Frango grelhado',        grupo: 'proteinas', kcal: 165, p: 31,   c: 0,    g: 3.6, unidade: 'g', porcao: 120 },
  carne:    { nome: 'Carne bovina magra',      grupo: 'proteinas', kcal: 155, p: 26,   c: 0,    g: 5,   unidade: 'g', porcao: 120 },
  ovos:     { nome: 'Ovos cozidos',            grupo: 'proteinas', kcal: 155, p: 13,   c: 1.1,  g: 11,  unidade: 'g', porcao: 100 },
  peixe:    { nome: 'Peixe grelhado',          grupo: 'proteinas', kcal: 128, p: 26,   c: 0,    g: 2.7, unidade: 'g', porcao: 130 },
  atum:     { nome: 'Atum em água',            grupo: 'proteinas', kcal: 116, p: 25.5, c: 0,    g: 1,   unidade: 'g', porcao: 100 },
  queijo:   { nome: 'Queijo minas',            grupo: 'proteinas', kcal: 264, p: 17.4, c: 3,    g: 20,  unidade: 'g', porcao: 40  },
  // carboidratos
  arroz:    { nome: 'Arroz branco cozido',     grupo: 'carboidratos', kcal: 130, p: 2.7, c: 28, g: 0.3, unidade: 'g', porcao: 130 },
  feijao:   { nome: 'Feijão cozido',           grupo: 'carboidratos', kcal: 127, p: 8.7, c: 22.8, g: 0.5, unidade: 'g', porcao: 100 },
  macarrao: { nome: 'Macarrão cozido',         grupo: 'carboidratos', kcal: 158, p: 5.8, c: 31, g: 0.9, unidade: 'g', porcao: 120 },
  batata:   { nome: 'Batata-doce cozida',      grupo: 'carboidratos', kcal: 86,  p: 1.6, c: 20, g: 0.1, unidade: 'g', porcao: 150 },
  mandioca: { nome: 'Mandioca cozida',         grupo: 'carboidratos', kcal: 125, p: 0.6, c: 30, g: 0.3, unidade: 'g', porcao: 130 },
  aveia:    { nome: 'Aveia em flocos',         grupo: 'carboidratos', kcal: 389, p: 16.9, c: 66, g: 6.9, unidade: 'g', porcao: 40  },
  pao:      { nome: 'Pão francês',             grupo: 'carboidratos', kcal: 300, p: 8,   c: 58, g: 3,   unidade: 'g', porcao: 50  },
  cuscuz:   { nome: 'Cuscuz cozido',           grupo: 'carboidratos', kcal: 112, p: 2.1, c: 23, g: 0.6, unidade: 'g', porcao: 130 },
  // frutas
  banana:   { nome: 'Banana',                  grupo: 'frutas', kcal: 89, p: 1.1, c: 22.8, g: 0.3, unidade: 'g', porcao: 100 },
  maca:     { nome: 'Maçã',                    grupo: 'frutas', kcal: 52, p: 0.3, c: 13.8, g: 0.2, unidade: 'g', porcao: 130 },
  mamao:    { nome: 'Mamão',                   grupo: 'frutas', kcal: 43, p: 0.5, c: 11,   g: 0.3, unidade: 'g', porcao: 150 },
  laranja:  { nome: 'Laranja',                 grupo: 'frutas', kcal: 47, p: 0.9, c: 11.8, g: 0.1, unidade: 'g', porcao: 150 },
  melancia: { nome: 'Melancia',                grupo: 'frutas', kcal: 30, p: 0.6, c: 7.6,  g: 0.2, unidade: 'g', porcao: 200 },
  // laticínios
  leite:    { nome: 'Leite',                   grupo: 'laticinios', kcal: 61, p: 3.2, c: 4.8, g: 3.3, unidade: 'ml', porcao: 200 },
  iogurte:  { nome: 'Iogurte natural',         grupo: 'laticinios', kcal: 61, p: 3.5, c: 4.7, g: 3.3, unidade: 'g', porcao: 150 },
};

/** "Salada" é sempre oferecida no almoço/jantar, à vontade — não entra na seleção do usuário. */
const ITEM_SALADA = { nome: 'Salada de folhas e legumes', quantidade: 'à vontade', unidade: '' };

/** Combinações reais de café da manhã / lanche / ceia (pares de alimentos que fazem sentido juntos). */
const COMBOS_LEVES = [
  ['pao', 'ovos'],
  ['pao', 'queijo'],
  ['aveia', 'leite'],
  ['aveia', 'banana'],
  ['cuscuz', 'ovos'],
  ['iogurte', 'banana'],
  ['iogurte', 'maca'],
  ['iogurte', 'mamao'],
  ['iogurte', 'laranja'],
  ['iogurte', 'melancia'],
];

/** Carboidratos aceitos como prato principal (almoço/jantar). Aveia e pão ficam de fora — não são pratos de almoço. */
const CARBOS_PRINCIPAIS = ['arroz', 'macarrao', 'batata', 'mandioca', 'cuscuz'];

/** Estrutura fixa de refeições: sempre café, almoço, lanche e jantar; ceia só se houver bastante variedade. */
function estruturaRefeicoes(totalAlimentos) {
  const refeicoes = [
    { nome: 'Café da manhã', hora: '07:00', tipo: 'leve' },
    { nome: 'Almoço',        hora: '12:30', tipo: 'principal' },
    { nome: 'Lanche da tarde', hora: '16:00', tipo: 'leve' },
    { nome: 'Jantar',        hora: '19:30', tipo: 'principal' },
  ];
  if (totalAlimentos >= 6) {
    refeicoes.push({ nome: 'Ceia', hora: '21:30', tipo: 'leve' });
  }
  return refeicoes;
}

/** Aplica a preferência alimentar removendo alimentos incompatíveis da seleção. */
function aplicarPreferencia(selecionados, preferencia) {
  const bloqueios = {
    'vegetariano': ['frango', 'carne', 'peixe', 'atum'],
    'sem-carne-vermelha': ['carne'],
    'sem-lactose': ['leite', 'iogurte', 'queijo'],
    'sem-restricao': [],
  };
  const bloqueados = bloqueios[preferencia] || [];
  return selecionados.filter((id) => !bloqueados.includes(id));
}

/** Distribuidor cíclico: a cada chamada devolve o próximo item de uma lista, repetindo se preciso. */
function criarCiclador(itens) {
  let i = 0;
  return () => {
    if (!itens.length) return null;
    const item = itens[i % itens.length];
    i += 1;
    return item;
  };
}

function paraItemRefeicao(id) {
  const base = BANCO_ALIMENTOS[id];
  return { nome: base.nome, quantidade: base.porcao, unidade: base.unidade };
}

/**
 * Monta uma refeição "leve" (café / lanche / ceia) usando apenas combinações
 * reais entre os alimentos selecionados. Se nenhuma combinação bater,
 * cai para um único alimento disponível (carboidrato leve, fruta ou
 * laticínio) — nunca inventa nada fora da seleção do usuário.
 */
function montarRefeicaoLeve(selecionadosSet, ciclador) {
  const combo = ciclador();
  if (combo) return combo.map(paraItemRefeicao);

  // fallback: usa qualquer item leve isolado que o usuário tenha selecionado
  const leves = ['aveia', 'pao', 'cuscuz', 'iogurte', 'leite', 'banana', 'maca', 'mamao', 'laranja', 'melancia'];
  const disponiveis = leves.filter((id) => selecionadosSet.has(id));
  if (!disponiveis.length) return [];
  return [paraItemRefeicao(disponiveis[0])];
}

/**
 * Monta uma refeição "principal" (almoço / jantar): proteína + carboidrato
 * de prato + feijão (somente se selecionado) + salada (sempre).
 */
function montarRefeicaoPrincipal(cicladorProteina, cicladorCarbo, temFeijao) {
  const itens = [];
  const proteina = cicladorProteina();
  const carbo = cicladorCarbo();
  if (proteina) itens.push(paraItemRefeicao(proteina));
  if (carbo) itens.push(paraItemRefeicao(carbo));
  if (temFeijao) itens.push(paraItemRefeicao('feijao'));
  itens.push(ITEM_SALADA);
  return itens;
}

function calcularDieta(dados) {
  const { sexo, idade, peso, altura, objetivo, atividade, preferencia, alimentos } = dados;

  // 1) TMB — Mifflin-St Jeor
  let tmb = 10 * peso + 6.25 * altura - 5 * idade;
  tmb += sexo === 'masculino' ? 5 : -161;

  // 2) GET
  const get = tmb * atividade;

  // 3) Meta calórica por objetivo
  let meta = get;
  if (objetivo === 'emagrecer') meta = get - 500;
  if (objetivo === 'ganhar') meta = get + 400;
  meta = Math.max(meta, 1200);

  // 4) Macros (g/kg de peso corporal)
  const fatoresProteina = { emagrecer: 2.2, manter: 1.8, ganhar: 2.0 };
  const fatoresGordura  = { emagrecer: 0.8, manter: 1.0, ganhar: 1.0 };

  const proteinaG = fatoresProteina[objetivo] * peso;
  const gorduraG = fatoresGordura[objetivo] * peso;
  const kcalProteina = proteinaG * 4;
  const kcalGordura = gorduraG * 9;
  const kcalCarbo = Math.max(meta - kcalProteina - kcalGordura, 0);
  const carboG = kcalCarbo / 4;

  // 5) Alimentos válidos após preferência
  const alimentosValidos = aplicarPreferencia(alimentos, preferencia);
  const selecionadosSet = new Set(alimentosValidos);

  const proteinasSelecionadas = alimentosValidos.filter((id) => BANCO_ALIMENTOS[id].grupo === 'proteinas');
  const carbosPrincipaisSelecionados = alimentosValidos.filter((id) => CARBOS_PRINCIPAIS.includes(id));
  const temFeijao = selecionadosSet.has('feijao');

  // combos de refeição leve válidos: só entram os pares em que AMBOS os itens foram selecionados
  const combosValidos = COMBOS_LEVES.filter(([a, b]) => selecionadosSet.has(a) && selecionadosSet.has(b));

  const cicladorCombos = criarCiclador(combosValidos);
  const cicladorProteina = criarCiclador(proteinasSelecionadas);
  const cicladorCarbo = criarCiclador(carbosPrincipaisSelecionados);

  // 6) Monta cada refeição conforme seu tipo
  const refeicoesBase = estruturaRefeicoes(alimentosValidos.length);
  const refeicoes = refeicoesBase
    .map((refeicao) => {
      const itens = refeicao.tipo === 'principal'
        ? montarRefeicaoPrincipal(cicladorProteina, cicladorCarbo, temFeijao)
        : montarRefeicaoLeve(selecionadosSet, cicladorCombos);
      return { ...refeicao, itens };
    })
    .filter((r) => r.itens.length > 0);

  return {
    tmb: Math.round(tmb),
    get: Math.round(get),
    meta: Math.round(meta),
    proteinaG: Math.round(proteinaG),
    carboG: Math.round(carboG),
    gorduraG: Math.round(gorduraG),
    agua: Math.round(peso * 35),
    refeicoes,
  };
}

function renderizarResultado(nome, resultado) {
  document.getElementById('res-nome').textContent = nome || 'você';
  document.getElementById('res-tmb').textContent = resultado.tmb;
  document.getElementById('res-get').textContent = resultado.get;
  document.getElementById('res-meta').textContent = resultado.meta;
  document.getElementById('res-prot').textContent = resultado.proteinaG;
  document.getElementById('res-carb').textContent = resultado.carboG;
  document.getElementById('res-gord').textContent = resultado.gorduraG;
  document.getElementById('res-refeicoes').textContent = resultado.refeicoes.length;
  document.getElementById('res-agua').textContent = resultado.agua;

  const lista = document.getElementById('lista-refeicoes');
  lista.innerHTML = resultado.refeicoes.map((refeicao) => `
    <div class="meal-card reveal-up in-view">
      <h4>${refeicao.nome}</h4>
      <span class="meal-time">${refeicao.hora}</span>
      <div class="meal-items">
        ${refeicao.itens.map((item) => `
          <div class="meal-item">
            <span>${item.nome}</span>
            <span class="qty">${item.quantidade}${item.unidade}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  const wrap = document.getElementById('resultado');
  wrap.classList.add('show');
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-dieta');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const alimentosSelecionados = Array.from(
      form.querySelectorAll('.check-grid input[type="checkbox"]:checked')
    ).map((input) => input.value);

    const erroEl = document.getElementById('erro-alimentos');
    if (alimentosSelecionados.length === 0) {
      erroEl.style.display = 'block';
      return;
    }
    erroEl.style.display = 'none';

    const dados = {
      nome: form.nome.value.trim(),
      sexo: form.sexo.value,
      idade: Number(form.idade.value),
      peso: Number(form.peso.value),
      altura: Number(form.altura.value),
      objetivo: form.objetivo.value,
      atividade: Number(form.atividade.value),
      preferencia: form.preferencia.value,
      alimentos: alimentosSelecionados,
    };

    const resultado = calcularDieta(dados);
    renderizarResultado(dados.nome, resultado);
  });
});
