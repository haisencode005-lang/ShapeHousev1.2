/* =========================================================================
   SHAPEHOUSE — treino.js
   Duas engines nesta página:

   1) TREINO PERSONALIZADO — motor baseado em:
      - padrões de movimento (empurrar/puxar/agachar/hinge/unilateral/core)
      - hierarquia de exercícios (principal / secundário / isolador)
      - orçamento de tempo real (estimateWorkoutTime) por sessão
      - variação de séries/reps/descanso conforme objetivo e prioridade
      - validação final automática (validateWorkout) que corrige o treino
        antes de exibi-lo (sem exercício repetido, sem estourar o tempo,
        sem equipamento inexistente)

   2) TREINO TAF — classifica o desempenho atual e gera um plano
      progressivo de 4 semanas (inalterado).
   ========================================================================= */

/* ---------------------------------------------------------------------
   1) TREINO PERSONALIZADO
--------------------------------------------------------------------- */

/** Padrões de movimento — usados para evitar redundância dentro da sessão. */
const PADRAO = {
  EMP_H: 'emp_h',       // empurrar horizontal (peito)
  EMP_V: 'emp_v',       // empurrar vertical (ombro)
  PUX_V: 'pux_v',       // puxar vertical (costas/dorsal)
  PUX_H: 'pux_h',       // puxar horizontal (costas/remada)
  OMBRO: 'ombro',       // isolador de ombro
  EXT_COT: 'ext_cot',   // extensão de cotovelo (tríceps)
  FLEX_COT: 'flex_cot', // flexão de cotovelo (bíceps)
  AGACH: 'agach',       // agachar
  HINGE: 'hinge',       // hinge de quadril (posterior/glúteo)
  UNI_PERNA: 'uni_perna', // unilateral de perna
  PANT: 'pant',         // panturrilha
  CORE: 'core',         // core / condicionamento
};

/** Hierarquia de exercícios — define prioridade, série e descanso padrão. */
const HIERARQUIA = { PRINCIPAL: 'principal', SECUNDARIO: 'secundario', ISOLADOR: 'isolador' };

/** Banco de exercícios: cada um com padrão de movimento, hierarquia, equipamento
 *  compatível e tempo médio de execução por série (usado na estimativa de tempo). */
const BANCO_EXERCICIOS = [
  // --- empurrar horizontal (peito) ---
  { nome: 'Supino reto com barra', musculo: 'Peito', equip: ['academia', 'barraanilhas'], padrao: PADRAO.EMP_H, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 45 },
  { nome: 'Supino com halteres', musculo: 'Peito', equip: ['halteres'], padrao: PADRAO.EMP_H, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 45 },
  { nome: 'Flexão de braço', musculo: 'Peito', equip: ['corporal'], padrao: PADRAO.EMP_H, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 35 },
  { nome: 'Flexão com mochila (carga extra)', musculo: 'Peito', equip: ['mochila'], padrao: PADRAO.EMP_H, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 35 },
  { nome: 'Supino com halteres no banco', musculo: 'Peito', equip: ['halteres', 'banco'], todosObrigatorios: true, padrao: PADRAO.EMP_H, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 40 },
  { nome: 'Flexão declinada', musculo: 'Peito (superior)', equip: ['corporal'], padrao: PADRAO.EMP_H, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 35 },

  // --- empurrar vertical (ombro) ---
  { nome: 'Desenvolvimento militar com barra', musculo: 'Ombro', equip: ['academia', 'barraanilhas'], padrao: PADRAO.EMP_V, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 40 },
  { nome: 'Desenvolvimento com halteres', musculo: 'Ombro', equip: ['halteres'], padrao: PADRAO.EMP_V, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 40 },
  { nome: 'Desenvolvimento com halteres no banco', musculo: 'Ombro', equip: ['halteres', 'banco'], todosObrigatorios: true, padrao: PADRAO.EMP_V, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 40 },
  { nome: 'Flexão pike (apoio invertido)', musculo: 'Ombro', equip: ['corporal'], padrao: PADRAO.EMP_V, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 35 },

  // --- isolador de ombro ---
  { nome: 'Elevação lateral com halteres', musculo: 'Ombro (lateral)', equip: ['halteres'], padrao: PADRAO.OMBRO, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },
  { nome: 'Elevação lateral com Super Band', musculo: 'Ombro (lateral)', equip: ['elasticos'], padrao: PADRAO.OMBRO, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },

  // --- extensão de cotovelo (tríceps) ---
  { nome: 'Mergulho nas paralelas', musculo: 'Tríceps', equip: ['paralelas'], padrao: PADRAO.EXT_COT, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 35 },
  { nome: 'Tríceps na polia (corda)', musculo: 'Tríceps', equip: ['academia'], padrao: PADRAO.EXT_COT, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },
  { nome: 'Tríceps testa com halteres', musculo: 'Tríceps', equip: ['halteres'], padrao: PADRAO.EXT_COT, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },
  { nome: 'Mergulho no banco (tríceps)', musculo: 'Tríceps', equip: ['banco'], padrao: PADRAO.EXT_COT, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },
  { nome: 'Tríceps com Super Band', musculo: 'Tríceps', equip: ['elasticos'], padrao: PADRAO.EXT_COT, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },

  // --- puxar vertical (dorsal) ---
  { nome: 'Barra fixa (pull-up)', musculo: 'Costas (dorsal)', equip: ['barra'], padrao: PADRAO.PUX_V, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 40 },
  { nome: 'Puxada alta na polia', musculo: 'Costas (dorsal)', equip: ['academia'], padrao: PADRAO.PUX_V, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 40 },

  // --- puxar horizontal (remada) ---
  { nome: 'Remada curvada com barra', musculo: 'Costas', equip: ['academia', 'barraanilhas'], padrao: PADRAO.PUX_H, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 45 },
  { nome: 'Remada unilateral com halteres', musculo: 'Costas', equip: ['halteres'], padrao: PADRAO.PUX_H, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 40 },
  { nome: 'Remada curvada com mochila', musculo: 'Costas', equip: ['mochila'], padrao: PADRAO.PUX_H, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 40 },
  { nome: 'Remada invertida (apoio baixo)', musculo: 'Costas', equip: ['corporal'], padrao: PADRAO.PUX_H, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 35 },
  { nome: 'Remada com Super Band', musculo: 'Costas', equip: ['elasticos'], padrao: PADRAO.PUX_H, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 30 },

  // --- flexão de cotovelo (bíceps) ---
  { nome: 'Rosca direta com barra', musculo: 'Bíceps', equip: ['academia', 'barraanilhas'], padrao: PADRAO.FLEX_COT, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },
  { nome: 'Rosca alternada com halteres', musculo: 'Bíceps', equip: ['halteres'], padrao: PADRAO.FLEX_COT, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },
  { nome: 'Rosca com Super Band', musculo: 'Bíceps', equip: ['elasticos'], padrao: PADRAO.FLEX_COT, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },

  // --- agachar ---
  { nome: 'Agachamento com barra', musculo: 'Quadríceps', equip: ['academia', 'barraanilhas'], padrao: PADRAO.AGACH, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 50 },
  { nome: 'Agachamento livre', musculo: 'Quadríceps', equip: ['corporal'], padrao: PADRAO.AGACH, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 40 },
  { nome: 'Agachamento com halteres', musculo: 'Quadríceps', equip: ['halteres'], padrao: PADRAO.AGACH, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 45 },
  { nome: 'Agachamento com mochila', musculo: 'Quadríceps', equip: ['mochila'], padrao: PADRAO.AGACH, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 40 },
  { nome: 'Agachamento com Super Band', musculo: 'Quadríceps', equip: ['elasticos'], padrao: PADRAO.AGACH, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 35 },

  // --- hinge (posterior/glúteo) ---
  { nome: 'Levantamento terra', musculo: 'Posterior de coxa', equip: ['academia', 'barraanilhas'], padrao: PADRAO.HINGE, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 50 },
  { nome: 'Stiff com halteres', musculo: 'Posterior de coxa', equip: ['halteres'], padrao: PADRAO.HINGE, hierarquia: HIERARQUIA.PRINCIPAL, tempoExecucaoSeg: 45 },
  { nome: 'Ponte de glúteo', musculo: 'Glúteo', equip: ['corporal'], padrao: PADRAO.HINGE, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 30 },
  { nome: 'Elevação pélvica com Super Band', musculo: 'Glúteo', equip: ['elasticos'], padrao: PADRAO.HINGE, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 30 },

  // --- unilateral de perna ---
  { nome: 'Afundo (avanço)', musculo: 'Glúteo / Quadríceps', equip: ['corporal'], padrao: PADRAO.UNI_PERNA, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 40 },
  { nome: 'Afundo com halteres', musculo: 'Glúteo / Quadríceps', equip: ['halteres'], padrao: PADRAO.UNI_PERNA, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 40 },
  { nome: 'Afundo com mochila', musculo: 'Glúteo / Quadríceps', equip: ['mochila'], padrao: PADRAO.UNI_PERNA, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 40 },
  { nome: 'Agachamento búlgaro (apoio no banco)', musculo: 'Glúteo / Quadríceps', equip: ['banco'], padrao: PADRAO.UNI_PERNA, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 40 },
  { nome: 'Step-up no banco', musculo: 'Glúteo / Quadríceps', equip: ['banco'], padrao: PADRAO.UNI_PERNA, hierarquia: HIERARQUIA.SECUNDARIO, tempoExecucaoSeg: 35 },

  // --- panturrilha ---
  { nome: 'Panturrilha em pé', musculo: 'Panturrilha', equip: ['corporal', 'academia'], padrao: PADRAO.PANT, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 25 },
  { nome: 'Panturrilha com halteres', musculo: 'Panturrilha', equip: ['halteres'], padrao: PADRAO.PANT, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 25 },

  // --- core / condicionamento ---
  { nome: 'Prancha abdominal', musculo: 'Core', equip: ['corporal'], padrao: PADRAO.CORE, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 40 },
  { nome: 'Prancha com pés no banco', musculo: 'Core', equip: ['banco'], padrao: PADRAO.CORE, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 40 },
  { nome: 'Abdominal supra', musculo: 'Core', equip: ['corporal'], padrao: PADRAO.CORE, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },
  { nome: 'Elevação de pernas', musculo: 'Core (inferior)', equip: ['corporal', 'barra'], padrao: PADRAO.CORE, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },
  { nome: 'Russian twist', musculo: 'Core (oblíquos)', equip: ['corporal'], padrao: PADRAO.CORE, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },
  { nome: 'Abdominal com Super Band', musculo: 'Core', equip: ['elasticos'], padrao: PADRAO.CORE, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },
  { nome: 'Mountain climber', musculo: 'Core / condicionamento', equip: ['corporal'], padrao: PADRAO.CORE, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 30 },
  { nome: 'Pular corda (condicionamento)', musculo: 'Condicionamento', equip: ['corda'], padrao: PADRAO.CORE, hierarquia: HIERARQUIA.ISOLADOR, tempoExecucaoSeg: 45 },
];

/** Padrões de movimento exigidos por tipo de dia, em ordem de prioridade
 *  (prioridade 1 = essencial; usada primeiro e nunca cortada por tempo). */
const PADROES_POR_DIA = {
  push: [
    { padrao: PADRAO.EMP_H, prioridade: 1 },
    { padrao: PADRAO.EMP_V, prioridade: 2 },
    { padrao: PADRAO.EXT_COT, prioridade: 3 },
    { padrao: PADRAO.OMBRO, prioridade: 4 },
  ],
  pull: [
    { padrao: PADRAO.PUX_V, prioridade: 1 },
    { padrao: PADRAO.PUX_H, prioridade: 2 },
    { padrao: PADRAO.FLEX_COT, prioridade: 3 },
  ],
  legs: [
    { padrao: PADRAO.AGACH, prioridade: 1 },
    { padrao: PADRAO.HINGE, prioridade: 2 },
    { padrao: PADRAO.UNI_PERNA, prioridade: 3 },
    { padrao: PADRAO.PANT, prioridade: 4 },
  ],
  full: [
    { padrao: PADRAO.AGACH, prioridade: 1 },
    { padrao: PADRAO.EMP_H, prioridade: 1 },
    { padrao: PADRAO.PUX_V, prioridade: 1 },
    { padrao: PADRAO.HINGE, prioridade: 2 },
    { padrao: PADRAO.EMP_V, prioridade: 3 },
    { padrao: PADRAO.PUX_H, prioridade: 3 },
    { padrao: PADRAO.UNI_PERNA, prioridade: 4 },
  ],
};

const NOME_DIA_BASE = { push: 'Push (Peito, Ombro, Tríceps)', pull: 'Pull (Costas, Bíceps)', legs: 'Legs (Pernas, Glúteo)', full: 'Full Body' };

/** Configuração de tempo: quantos exercícios cabem, aquecimento e margem de segurança. */
const TEMPO_CONFIG_BASE = {
  30: { minExercicios: 3, maxExercicios: 5, aquecimentoMin: 3, bufferMin: 2 },
  45: { minExercicios: 4, maxExercicios: 7, aquecimentoMin: 5, bufferMin: 3 },
  60: { minExercicios: 5, maxExercicios: 8, aquecimentoMin: 5, bufferMin: 4 },
  90: { minExercicios: 6, maxExercicios: 10, aquecimentoMin: 8, bufferMin: 5 },
};

/** Séries por hierarquia + objetivo. Quando min !== max, alterna entre eles
 *  conforme a posição do exercício na sessão — assim as séries variam de
 *  verdade em vez de todo exercício cair no mesmo número. */
const FAIXA_SERIES = {
  forca:         { principal: [4, 5], secundario: [3, 4], isolador: [2, 3] },
  hipertrofia:   { principal: [3, 5], secundario: [2, 4], isolador: [1, 3] },
  resistencia:   { principal: [2, 3], secundario: [2, 3], isolador: [1, 2] },
  emagrecimento: { principal: [2, 3], secundario: [2, 3], isolador: [1, 2] },
};

const FAIXA_REPS = {
  forca:         { principal: '4-6', secundario: '5-8', isolador: '8-10' },
  hipertrofia:   { principal: '6-10', secundario: '8-12', isolador: '12-15' },
  resistencia:   { principal: '15-20', secundario: '15-20', isolador: '15-20' },
  emagrecimento: { principal: '12-15', secundario: '15-20', isolador: '15-20' },
};

/** Descanso em segundos por hierarquia + objetivo. */
const FAIXA_DESCANSO_SEG = {
  forca:         { principal: 150, secundario: 100, isolador: 60 },
  hipertrofia:   { principal: 90, secundario: 70, isolador: 45 },
  resistencia:   { principal: 45, secundario: 35, isolador: 25 },
  emagrecimento: { principal: 45, secundario: 35, isolador: 25 },
};

const TRANSICAO_SEG = 25; // tempo de troca/preparo entre exercícios

function calcularSeries(hierarquia, objetivo, posicaoNaSessao) {
  const [min, max] = FAIXA_SERIES[objetivo][hierarquia];
  if (min === max) return min;
  return posicaoNaSessao % 2 === 0 ? max : min;
}

function calcularReps(hierarquia, objetivo) {
  return FAIXA_REPS[objetivo][hierarquia];
}

function calcularDescansoSeg(hierarquia, objetivo) {
  return FAIXA_DESCANSO_SEG[objetivo][hierarquia];
}

function formatarDescanso(seg) {
  if (seg < 60) return `${seg}s`;
  const min = Math.floor(seg / 60);
  const resto = seg % 60;
  return resto === 0 ? `${min}min` : `${min}min${resto}s`;
}

/** Config de tempo ajustada pelo nível de experiência (iniciante fica mais
 *  conservador no teto de exercícios; avançado pode ir um pouco além). */
function obterConfigTempo(tempoDisponivel, experiencia) {
  const base = TEMPO_CONFIG_BASE[tempoDisponivel] || TEMPO_CONFIG_BASE[60];
  const ajuste = { iniciante: -1, intermediario: 0, avancado: 1 }[experiencia] || 0;
  const maxExercicios = Math.max(base.minExercicios, base.maxExercicios + ajuste);
  return { tempoDisponivel, minExercicios: base.minExercicios, maxExercicios, aquecimentoMin: base.aquecimentoMin, bufferMin: base.bufferMin };
}

/** Distribuidor cíclico — usado para variar os exercícios de um mesmo padrão
 *  entre sessões da semana (ex: Push A usa Supino, Push B usa Flexão). */
function criarCiclador(itens) {
  let i = 0;
  return () => {
    if (!itens.length) return null;
    const item = itens[i % itens.length];
    i += 1;
    return item;
  };
}

function filtrarPorEquipamento(lista, equip) {
  return lista.filter((ex) => (
    ex.todosObrigatorios ? ex.equip.every((e) => equip.includes(e)) : ex.equip.some((e) => equip.includes(e))
  ));
}

/** Cache de cicladores por padrão de movimento, criado uma vez por geração
 *  de treino e compartilhado entre os dias da semana (garante variedade). */
function obterCiclador(padrao, equip, cache) {
  const chave = `${padrao}::${equip.slice().sort().join(',')}`;
  if (!cache[chave]) {
    cache[chave] = criarCiclador(filtrarPorEquipamento(BANCO_EXERCICIOS.filter((e) => e.padrao === padrao), equip));
  }
  return cache[chave];
}

function estimateWorkoutTime(exercicios, config) {
  const execSeg = exercicios.reduce(
    (acc, ex) => acc + ex.series * (ex.tempoExecucaoSeg + ex.descansoSeg) + TRANSICAO_SEG,
    0
  );
  return Math.round(config.aquecimentoMin + execSeg / 60 + config.bufferMin);
}

/** Monta um dia de treino respeitando padrões de movimento, hierarquia e
 *  orçamento de tempo. Nunca repete o mesmo exercício na sessão. */
function montarDia(tipoDia, equip, config, objetivo, cicladores) {
  const padroesOrdenados = [...PADROES_POR_DIA[tipoDia]].sort((a, b) => a.prioridade - b.prioridade);
  const orcamentoSeg = Math.max((config.tempoDisponivel - config.aquecimentoMin - config.bufferMin) * 60, 0);

  const usadosNoDia = new Set();
  const exercicios = [];
  let tempoAcumuladoSeg = 0;

  function tentarAdicionar(padrao) {
    if (exercicios.length >= config.maxExercicios) return false;
    const ciclador = obterCiclador(padrao, equip, cicladores);
    let ex = null;
    for (let tentativa = 0; tentativa < 6; tentativa += 1) {
      const candidato = ciclador();
      if (!candidato) break;
      if (!usadosNoDia.has(candidato.nome)) { ex = candidato; break; }
    }
    if (!ex) return false;

    const posicao = exercicios.length;
    const series = calcularSeries(ex.hierarquia, objetivo, posicao);
    const reps = calcularReps(ex.hierarquia, objetivo);
    const descansoSeg = calcularDescansoSeg(ex.hierarquia, objetivo);
    const custoSeg = series * (ex.tempoExecucaoSeg + descansoSeg) + TRANSICAO_SEG;

    // só recusa por tempo se já tivermos o mínimo de exercícios do treino
    if (tempoAcumuladoSeg + custoSeg > orcamentoSeg && exercicios.length >= config.minExercicios) return false;

    exercicios.push({ ...ex, series, reps, descansoSeg, descansoLabel: formatarDescanso(descansoSeg) });
    usadosNoDia.add(ex.nome);
    tempoAcumuladoSeg += custoSeg;
    return true;
  }

  // 1ª passada: padrões essenciais (prioridade 1) — nunca ficam de fora
  padroesOrdenados.filter((p) => p.prioridade === 1).forEach((p) => tentarAdicionar(p.padrao));

  // passadas seguintes: acessórios, em ordem de prioridade, conforme o tempo permitir
  [2, 3, 4].forEach((nivel) => {
    padroesOrdenados.filter((p) => p.prioridade === nivel).forEach((p) => tentarAdicionar(p.padrao));
  });

  // fecha a sessão com 1 exercício de core, se equipamento e tempo permitirem
  tentarAdicionar(PADRAO.CORE);

  return exercicios;
}

/** Remove o exercício de menor prioridade (isolador > secundário > principal)
 *  para reduzir o treino quando ele estoura o tempo disponível. */
function corrigirTreino(exercicios) {
  for (const hierarquia of [HIERARQUIA.ISOLADOR, HIERARQUIA.SECUNDARIO]) {
    const idx = exercicios.map((e) => e.hierarquia).lastIndexOf(hierarquia);
    if (idx !== -1) return exercicios.filter((_, i) => i !== idx);
  }
  return exercicios.slice(0, -1);
}

/** Validação final: sem exercício repetido, sem equipamento inexistente,
 *  sem estourar o tempo disponível e sem quantidade excessiva. */
function validateWorkout(exercicios, equip, tempoDisponivel, tempoEstimado, config) {
  const nomes = new Set();
  for (const ex of exercicios) {
    if (nomes.has(ex.nome)) return false;
    nomes.add(ex.nome);
    const equipOk = ex.todosObrigatorios ? ex.equip.every((e) => equip.includes(e)) : ex.equip.some((e) => equip.includes(e));
    if (!equipOk) return false;
  }
  if (exercicios.length === 0) return false;
  if (exercicios.length > config.maxExercicios) return false;
  if (tempoEstimado > tempoDisponivel + 5) return false;
  return true;
}

/** Nomeia os dias considerando repetição do mesmo tipo na semana
 *  (ex: Push A / Push B quando "push" aparece mais de uma vez). */
function nomearDias(split) {
  const totalPorTipo = split.reduce((acc, tipo) => ({ ...acc, [tipo]: (acc[tipo] || 0) + 1 }), {});
  const contagem = {};
  return split.map((tipo) => {
    contagem[tipo] = (contagem[tipo] || 0) + 1;
    const sufixo = totalPorTipo[tipo] > 1 ? ` ${String.fromCharCode(64 + contagem[tipo])}` : '';
    return `${NOME_DIA_BASE[tipo]}${sufixo}`;
  });
}

/** Divisão de dias: prioriza PPL; Full Body para poucas sessões semanais. */
function definirSplit(dias) {
  const splits = {
    2: ['full', 'full'],
    3: ['push', 'pull', 'legs'],
    4: ['push', 'pull', 'legs', 'full'],
    5: ['push', 'pull', 'legs', 'push', 'pull'],
    6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
  };
  if (splits[dias]) return splits[dias];
  const base = ['push', 'pull', 'legs'];
  return Array.from({ length: dias }, (_, i) => base[i % base.length]);
}

function gerarTreino(form) {
  const config = obterConfigTempo(form.tempoDisponivel, form.experiencia);
  const split = definirSplit(form.dias);
  const nomesDias = nomearDias(split);
  const cicladores = {}; // compartilhado entre os dias da semana → variedade real

  const diasPlano = split.map((tipo, index) => {
    let exercicios = montarDia(tipo, form.equipamentos, config, form.objetivo, cicladores);
    let tempoEstimado = estimateWorkoutTime(exercicios, config);

    // validação final automática — corrige o treino até ele passar em todas as regras
    let tentativas = 0;
    while (!validateWorkout(exercicios, form.equipamentos, form.tempoDisponivel, tempoEstimado, config) && exercicios.length > 2 && tentativas < 10) {
      exercicios = corrigirTreino(exercicios);
      tempoEstimado = estimateWorkoutTime(exercicios, config);
      tentativas += 1;
    }

    return {
      titulo: `Treino ${String.fromCharCode(65 + index)} — ${nomesDias[index]}`,
      exercicios,
      tempoEstimado,
    };
  });

  return { diasPlano, config, adaptado: diasPlano.some((d) => d.exercicios.length < config.minExercicios) };
}

function renderizarTreino(resultado, form) {
  const objetivoLabel = { hipertrofia: 'hipertrofia', forca: 'força', emagrecimento: 'emagrecimento', resistencia: 'resistência muscular' }[form.objetivo];

  document.getElementById('tr-titulo-plano').textContent = resultado.adaptado ? 'Seu treino adaptado' : 'Seu treino personalizado';
  document.getElementById('tr-sub-plano').textContent = resultado.adaptado
    ? `Focado em ${objetivoLabel}, ${form.dias}x por semana, sessões de até ${form.tempoDisponivel} minutos. Alguns dias ficaram com menos exercícios porque o equipamento selecionado não cobre todos os movimentos ideais para aquele grupo muscular.`
    : `Focado em ${objetivoLabel}, ${form.dias}x por semana, sessões de até ${form.tempoDisponivel} minutos.`;

  const cont = document.getElementById('dias-treino');
  cont.innerHTML = resultado.diasPlano.map((dia) => `
    <div class="workout-day reveal-up in-view">
      <div class="workout-day-head">
        <h4>${dia.titulo}</h4>
        <span class="badge">${dia.exercicios.length} exercícios · ⏱ tempo estimado: aproximadamente ${dia.tempoEstimado} minutos</span>
      </div>
      <table class="exercise-table">
        <thead>
          <tr><th>Exercício</th><th>Grupo muscular</th><th>Séries</th><th>Reps</th><th>Descanso</th></tr>
        </thead>
        <tbody>
          ${dia.exercicios.map((ex) => `
            <tr>
              <td class="name">${ex.nome}</td>
              <td><span class="muscle-tag">${ex.musculo}</span></td>
              <td>${ex.series}</td>
              <td>${ex.reps}</td>
              <td>${ex.descansoLabel}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');

  const wrap = document.getElementById('resultado-treino');
  wrap.classList.add('show');
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------------------------------------------------------------
   2) TREINO TAF
--------------------------------------------------------------------- */

/** Referências aproximadas de desempenho por nível (usadas como meta de evolução). */
const METAS_TAF = {
  iniciante:     { barras: 4,  metros50: 9.0, distancia12min: 1800, abdominais: 25 },
  intermediario: { barras: 10, metros50: 8.0, distancia12min: 2400, abdominais: 40 },
  avancado:      { barras: 16, metros50: 7.2, distancia12min: 2800, abdominais: 55 },
};

const NOME_NIVEL = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };

/** Gera um plano progressivo de 4 semanas evoluindo em direção à meta do nível. */
function gerarPlanoTaf(nivel, desempenho) {
  const meta = METAS_TAF[nivel];
  const semanas = [1, 2, 3, 4].map((semana) => {
    const progresso = semana / 4;
    const metaBarras = Math.round(desempenho.barras + (meta.barras - desempenho.barras) * progresso * 0.5);
    const metaAbdominais = Math.round(desempenho.abdominais + (meta.abdominais - desempenho.abdominais) * progresso * 0.5);
    const metaDistancia = Math.round(desempenho.distancia12min + (meta.distancia12min - desempenho.distancia12min) * progresso * 0.4);

    return {
      semana,
      objetivo: `Evoluir para ${Math.max(metaBarras, desempenho.barras)} barras, ${Math.max(metaAbdominais, desempenho.abdominais)} abdominais/min e ${Math.max(metaDistancia, desempenho.distancia12min)}m em 12min.`,
      aquecimento: '5-8min de corrida leve + mobilidade de ombro, quadril e tornozelo.',
      principal: [
        `Barra fixa: ${4 + semana} séries até quase a falha, descanso de 90s.`,
        `Corrida de 50m: ${6} tiros com descanso completo entre eles, focando em explosão.`,
        `Corrida contínua: ${20 + semana * 2}min em ritmo moderado a forte.`,
        `Abdominais: ${3 + Math.min(semana, 3)} séries de 1 minuto, descanso de 45s.`,
      ],
      descanso: semana < 4 ? '1 dia completo de descanso ativo (caminhada leve) entre os treinos intensos.' : '2 dias de descanso antes de reavaliar seu desempenho.',
      alongamento: '10min de alongamento de posterior de coxa, panturrilha, peitoral e dorsal ao final de cada sessão.',
    };
  });
  return semanas;
}

function classificarDesempenho(desempenho) {
  const pontuar = (nivel) => {
    const m = METAS_TAF[nivel];
    let pontos = 0;
    if (desempenho.barras >= m.barras) pontos += 1;
    if (desempenho.metros50 <= m.metros50) pontos += 1;
    if (desempenho.distancia12min >= m.distancia12min) pontos += 1;
    if (desempenho.abdominais >= m.abdominais) pontos += 1;
    return pontos;
  };
  const pontos = { iniciante: pontuar('iniciante'), intermediario: pontuar('intermediario'), avancado: pontuar('avancado') };
  if (pontos.avancado >= 3) return 'avancado';
  if (pontos.intermediario >= 2) return 'intermediario';
  return 'iniciante';
}

function renderizarTaf(nivelEscolhido, desempenho) {
  const semanas = gerarPlanoTaf(nivelEscolhido, desempenho);
  const nivelAtual = classificarDesempenho(desempenho);

  document.getElementById('taf-res-nivel').textContent = NOME_NIVEL[nivelEscolhido];
  document.getElementById('taf-res-sub').textContent =
    `Seu desempenho atual está compatível com o nível ${NOME_NIVEL[nivelAtual]}. O plano abaixo evolui progressivamente rumo ao nível ${NOME_NIVEL[nivelEscolhido]}.`;

  const cont = document.getElementById('taf-semanas');
  cont.innerHTML = semanas.map((s) => `
    <div class="taf-week-card reveal-up in-view">
      <h4>Semana ${s.semana}</h4>
      <p class="taf-week-goal">${s.objetivo}</p>
      <div class="taf-phases">
        <div class="taf-phase"><span class="ph-label">Aquecimento</span><p>${s.aquecimento}</p></div>
        <div class="taf-phase"><span class="ph-label">Treino principal</span><p>${s.principal.join(' ')}</p></div>
        <div class="taf-phase"><span class="ph-label">Descanso</span><p>${s.descanso}</p></div>
        <div class="taf-phase"><span class="ph-label">Alongamento</span><p>${s.alongamento}</p></div>
      </div>
    </div>
  `).join('');

  const wrap = document.getElementById('resultado-taf');
  wrap.classList.add('show');
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------------------------------------------------------------
   INICIALIZAÇÃO
--------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // --- Tabs ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = { personalizado: document.getElementById('panel-personalizado'), taf: document.getElementById('panel-taf') };

  function ativarTab(nome) {
    tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.tab === nome));
    Object.entries(panels).forEach(([key, el]) => el.classList.toggle('active', key === nome));
  }
  tabButtons.forEach((btn) => btn.addEventListener('click', () => ativarTab(btn.dataset.tab)));

  if (window.location.hash === '#taf') ativarTab('taf');

  // --- Formulário: Treino Personalizado ---
  const formTreino = document.getElementById('form-treino');
  formTreino.addEventListener('submit', (e) => {
    e.preventDefault();
    const equipamentos = Array.from(formTreino.querySelectorAll('.check-grid input:checked')).map((i) => i.value);

    const erroEl = document.getElementById('erro-equip');
    if (equipamentos.length === 0) {
      erroEl.style.display = 'block';
      return;
    }
    erroEl.style.display = 'none';

    const form = {
      objetivo: document.getElementById('tr-objetivo').value,
      dias: Number(document.getElementById('tr-dias').value),
      tempoDisponivel: Number(document.getElementById('tr-tempo').value),
      experiencia: document.getElementById('tr-experiencia').value,
      equipamentos,
    };
    const resultado = gerarTreino(form);
    renderizarTreino(resultado, form);
  });

  // --- Seleção de nível TAF ---
  const nivelCards = document.querySelectorAll('.taf-level-card');
  const formTaf = document.getElementById('form-taf');
  let nivelSelecionado = null;

  nivelCards.forEach((card) => {
    card.addEventListener('click', () => {
      nivelCards.forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      nivelSelecionado = card.dataset.nivel;
      formTaf.style.display = 'grid';
      formTaf.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  formTaf.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!nivelSelecionado) return;
    const desempenho = {
      barras: Number(document.getElementById('taf-barras').value),
      metros50: Number(document.getElementById('taf-50m').value),
      distancia12min: Number(document.getElementById('taf-12min').value),
      abdominais: Number(document.getElementById('taf-abdominais').value),
    };
    renderizarTaf(nivelSelecionado, desempenho);
  });
});
