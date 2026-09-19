// Avatar 3D da Maya no app Zeuvastec Language (2026-09-17, revisado
// 2026-09-19). Usa o MESMO GLB e as mesmas bibliotecas (TalkingHead +
// corpo-vida + corpo-congelado) do Zeuvastec Assistente de IA (Maya e Igor),
// para que a Maya pareça viva (respiração, piscar, leve balanço) em vez de
// uma imagem parada.
//
// A Maya agora carrega assim que o app abre (não só ao entrar em
// "Conversar"), porque também aparece na tela de Início — e porque ela
// precisa estar visível ANTES de falar a primeira frase (pedido do
// usuário: "antes de falar a primeira frase a Maya GLB deve aparecer").
// Como o carregamento é pesado (GLB de ~50MB), existe só UM elemento
// 3D — ele é MOVIDO (via appendChild, que preserva o canvas/contexto
// WebGL) entre os dois lugares onde a Maya pode aparecer: o cabeçalho do
// Início e a tela de Conversar. Ver moverAvatarParaView().
import { ativarCorpoCongelado } from './corpo-congelado.js';
import { ativarCorpoVida } from './corpo-vida.js';

let head = null;
let carregando = false;
let carregado = false;

// Promessa que resolve quando já se sabe se a Maya 3D vai aparecer ou não
// (sucesso OU falha — nunca fica pendurada pra sempre). Usada pelo
// guided-voice.js pra esperar a Maya aparecer antes de falar a primeira
// frase.
let resolverPronta;
const prontaPromise = new Promise((resolve) => { resolverPronta = resolve; });
window.__mayaAguardarPronta = () => prontaPromise;

async function importarTalkingHead() {
  const urls = [
    './vendor/talkinghead@1.7.0/modules/talkinghead.mjs',
    'https://cdn.jsdelivr.net/npm/@met4citizen/talkinghead@1.7/+esm',
    'https://esm.sh/@met4citizen/talkinghead@1.7'
  ];
  let ultimoErro = null;
  for (const url of urls) {
    try {
      const mod = await import(url);
      const TalkingHead = mod?.TalkingHead || mod?.default?.TalkingHead || mod?.default;
      if (TalkingHead) return TalkingHead;
    } catch (e) {
      ultimoErro = e;
      console.warn('[Maya 3D] Falhou ao carregar', url, e);
    }
  }
  throw ultimoErro || new Error('Não foi possível carregar o TalkingHead');
}

export async function iniciarMaya3D() {
  if (carregado || carregando) return;
  carregando = true;
  const container = document.getElementById('maya-3d-avatar');
  const wrapper = document.getElementById('maya-avatar-big');
  if (!container || !wrapper) { carregando = false; resolverPronta(false); return; }
  try {
    const TalkingHead = await importarTalkingHead();
    head = new TalkingHead(container, {
      ttsEndpoint: 'N/A',
      // Carrega o processador de fala->visema em inglês da própria
      // biblioteca (regras fonéticas reais), em vez de sortear visemas
      // aleatórios — é o que permite a sincronização labial de verdade
      // (ver reproduzirPalavra abaixo, pedido do usuário 2026-09-19:
      // "Melhorar a sincronização labial").
      lipsyncModules: ['en'],
      cameraView: 'upper',
      cameraDistance: 0,
      cameraZoomEnable: false,
      cameraPanEnable: false,
      cameraRotateEnable: false,
      modelFPS: 60,
      modelPixelRatio: 1,
      // Olhar pra câmera quase o tempo todo, como se falasse com o aluno
      // (pedido do usuário 2026-09-20: "olhar disperso o tempo todo"). A
      // cabeça continua se movendo um pouco (não travar o rosto).
      avatarIdleEyeContact: 1,
      avatarSpeakingEyeContact: 1,
      avatarListeningEyeContact: 1,
      avatarIdleHeadMove: 0.35,
      avatarSpeakingHeadMove: 0.55,
      avatarListeningHeadMove: 0.4,
      avatarMood: 'neutral',
      lightAmbientIntensity: 1.0,
      lightDirectIntensity: 1.1,
      lightSpotIntensity: 0.5,
      lightAmbientColor: 0xffffff,
      lightDirectColor: 0xffffff,
      lightSpotColor: 0xffffff
    });
    // O humor de cada estado tem uma animação "mouth" que, a cada 1–5s,
    // sorteia lábios enrolados/esticados e "bico" de até 0,3 (mouthRoll*,
    // mouthStretch*, mouthPucker) — por cima da fala, isso deformava a boca e
    // mostrava dentes "às vezes" (2026-09-20). Removida de todos os humores.
    for (const humor of Object.values(head.animMoods || {})) {
      if (humor && Array.isArray(humor.anims)) humor.anims = humor.anims.filter((a) => a.name !== 'mouth');
    }
    await head.showAvatar({ url: 'avatars/maya.glb', body: 'F', avatarMood: 'neutral', lipsyncLang: 'en' });
    head.animQueue = head.animQueue.filter((x) => x.template?.name !== 'mouth');
    head.setView('upper', { cameraDistance: -1, cameraX: 0, cameraY: 0.02, cameraRotateX: 0, cameraRotateY: 0 });
    // O TalkingHead limita a velocidade padrão de qualquer morph target para
    // um movimento suave de expressões (bom para sobrancelhas, ruim para
    // falar) — sem isso, a boca demora tanto pra abrir que nunca chega a
    // aparecer entre uma troca de visema e outra. Acelera todos os visemas
    // de fala (2026-09-17, ampliado pra todos os 15 visemas em 2026-09-19).
    for (const nome of Object.keys(INTENSIDADE_VISEMA)) {
      // A suavização da biblioteca ULTRAPASSA o alvo quando a velocidade acumulada
      // é alta e o alvo muda de sentido (abrir -> fechar): a boca chegava perto
      // de 1,0 por um frame ("abre exageradamente às vezes", 2026-09-20). Como
      // o suavizador próprio abaixo já cuida da dinâmica, a biblioteca só
      // precisa chegar rápido ao valor pedido — e a velocidade dela é zerada
      // a cada passo (ver tickDaBoca).
      if (head.mtAvatar[nome]) { head.mtAvatar[nome].acc = 0.05; head.mtAvatar[nome].maxv = 0.5; }
    }
    // A biblioteca sorteia "microexpressões" aleatórias em vários morph
    // targets da BOCA (cantos, lábios enrolados/esticados, bochechas), de até
    // ~0,2 cada, o tempo todo — somadas à fala, deformavam a boca e mostravam
    // dentes ("abrindo exageradamente às vezes", 2026-09-20). Deixamos só as
    // sobrancelhas variando, que dão vida ao rosto sem mexer na boca.
    head.mtRandomized = ['browDownLeft', 'browDownRight', 'browOuterUpLeft', 'browOuterUpRight'];
    window.__mayaHeadDebug = head; // ajuda a depurar pelo console; inofensivo em produção
    try { ativarCorpoVida(head); } catch (e) { console.warn('[Maya 3D] corpo-vida falhou:', e); }
    try { ativarCorpoCongelado(head); } catch (e) { console.warn('[Maya 3D] corpo-congelado falhou:', e); }
    wrapper.classList.add('maya-3d-ready');
    carregado = true;
    // Reforça o contato visual: a cada poucos segundos ela volta a olhar
    // pra câmera (o olhar aleatório da biblioteca só dura um instante).
    olharParaCamera(1200);
    window.setInterval(() => { if (!document.hidden) olharParaCamera(3800); }, 3500);
    resolverPronta(true);
  } catch (e) {
    console.warn('[Maya 3D] Não foi possível carregar o avatar 3D, mantendo a foto da Maya:', e);
    // Em celular não dá pra abrir o console: mostra o motivo embaixo da foto
    // pra o problema poder ser diagnosticado (2026-09-19).
    try {
      const aviso = document.createElement('small');
      aviso.className = 'maya-3d-erro';
      aviso.textContent = 'Avatar 3D indisponível neste aparelho (' + String((e && e.message) || e).slice(0, 90) + ')';
      wrapper.insertAdjacentElement('afterend', aviso);
    } catch (_) { /* sem aviso */ }
    resolverPronta(false);
  } finally {
    carregando = false;
  }
}

function olharParaCamera(ms) {
  if (!head || !carregado) return;
  try { head.makeEyeContact(ms); } catch (e) { /* biblioteca sem essa função */ }
}

// Carrega assim que o app abre — não espera mais o clique em "Conversar",
// porque a Maya também precisa aparecer na tela de Início (pedido do
// usuário 2026-09-19).
iniciarMaya3D();

// A Maya só existe uma vez (o GLB é pesado); quando o aluno troca de tela,
// movemos o MESMO elemento (com appendChild, que preserva o canvas e o
// contexto WebGL — não recria nada) para o "encaixe" da tela atual.
const ENCAIXES = { home: 'maya-avatar-slot-home', talk: 'maya-avatar-slot-talk' };
function moverAvatarParaView(view) {
  const destinoId = ENCAIXES[view];
  if (!destinoId) return; // outras telas não têm um encaixe pra Maya
  const destino = document.getElementById(destinoId);
  const avatar = document.getElementById('maya-avatar-big');
  if (!destino || !avatar) return;
  if (avatar.parentElement !== destino) destino.appendChild(avatar);
  avatar.classList.toggle('maya-avatar-big-home', view === 'home');
}
window.addEventListener('maya-view-changed', (ev) => moverAvatarParaView(ev.detail?.view));
// "Início" já é a tela visível ao abrir o app (o HTML já nasce com a Maya
// no encaixe do Início) — mas a classe "mini" (tamanho menor) só é
// aplicada aqui, pra não depender de um clique de navegação que nunca
// acontece nessa primeira tela.
moverAvatarParaView('home');

// A Maya move a boca enquanto fala, do mesmo jeito que no Zeuvastec
// Assistente de IA (2026-09-17). Sincronização labial (2026-09-19, refeita
// em 2026-09-20): a cada frase, o guided-voice.js avisa o texto, o idioma e
// a velocidade ("maya-speaking-start"). Aqui montamos uma LINHA DO TEMPO de
// palavras usando o processador fonético em inglês da própria biblioteca
// (lipsyncWordsToVisemes: regras de letra->som, devolve os visemas de cada
// palavra e a duração relativa de cada um). Cobre os 15 visemas do GLB da
// Maya (PP, FF, aa, kk, DD, nn, TH, SS, E, I, O, U, RR, CH, sil).
//
// Como o tempo real da voz varia (voz, velocidade, navegador):
//  - quando o navegador avisa cada palavra ("boundary" com charIndex), a
//    boca é RESSINCRONIZADA na palavra certa e o ritmo (ms por unidade) é
//    APRENDIDO com a duração real da palavra anterior;
//  - quando o navegador NÃO avisa (ex.: iPhone/Safari), a linha do tempo
//    roda sozinha com o ritmo estimado, incluindo pausas em vírgulas e
//    pontos — bem melhor do que sortear formas de boca aleatórias.
// Português usa as mesmas regras do inglês depois de tirar os acentos (não
// existe módulo em português na biblioteca) — aproximação, mas as vogais e
// consoantes labiais (p, b, m, f, v) batem.
// Intensidades máximas (0..1) de cada visema. Vogais abrem mais; consoantes
// que mostram dentes ou língua (kk, DD, SS, CH, nn, FF, TH, RR) ficam BEM
// baixas — em 2026-09-20 o usuário mandou frames em que os dentes
// "saíam da boca" e a língua aparecia demais: com os valores antigos
// (0.16–0.22) essas formas ficavam exageradas. O visema TH (língua entre
// os dentes) é quase imperceptível de propósito.
const INTENSIDADE_VISEMA = {
  viseme_aa: 0.22, viseme_E: 0.13, viseme_I: 0.10, viseme_O: 0.19, viseme_U: 0.17,
  viseme_PP: 0.07, viseme_FF: 0.05, viseme_TH: 0.03, viseme_DD: 0.05, viseme_kk: 0.05,
  viseme_SS: 0.04, viseme_nn: 0.05, viseme_RR: 0.08, viseme_CH: 0.05
  // viseme_sil (silêncio) não entra aqui — significa boca fechada/neutra.
};
// Limite da SOMA de todos os visemas ao mesmo tempo (2026-09-20): na troca
// de um som para outro, o anterior ainda está diminuindo enquanto o novo
// cresce — as duas formas somadas abriam a boca além do normal. Com o
// suavizador abaixo (controle próprio da boca) a soma nunca passa disso.
const LIMITE_SOMA_VISEMAS = 0.24;
const VISEMAS_ALEATORIOS = Object.keys(INTENSIDADE_VISEMA); // só como rede de segurança
const MS_POR_UNIDADE_BASE = 108; // ms por unidade relativa da biblioteca, em velocidade 1.0

let visemaAtual = null;
let cicloFala = null;
let timersPalavra = [];
let avancoTimer = null;
let graceTimer = null;
let plano = null;
let falandoId = null;
// Trava: sem isso, um "boundary" atrasado depois do fim da fala reabria a
// boca e ela ficava presa aberta (2026-09-18).
let falando = false;

// Suavizador próprio da boca: cada visema tem um ALVO (definido pela linha do
// tempo) e um valor ATUAL que se aproxima dele com uma constante de tempo
// (sobe em ~45ms, desce em ~75ms). A cada ~33ms o valor é aplicado no avatar
// (setFixedValue), já com a soma limitada. Assim as formas de boca se
// misturam de forma contínua em vez de "estalar" entre um som e outro.
const alvoVisema = {};
const valorVisema = {};
const aplicadoVisema = {};
let tickBoca = null;
let ultimoTickBoca = 0;

function tickDaBoca() {
  if (!head) return;
  const agora = performance.now();
  const dt = Math.min(80, ultimoTickBoca ? agora - ultimoTickBoca : 33);
  ultimoTickBoca = agora;
  let soma = 0;
  for (const nome of VISEMAS_ALEATORIOS) {
    const a = valorVisema[nome] || 0;
    const t = alvoVisema[nome] || 0;
    const tau = t > a ? 45 : 75;
    let n = a + (t - a) * (1 - Math.exp(-dt / tau));
    if (t === 0 && n < 0.004) n = 0;
    valorVisema[nome] = n;
    soma += n;
  }
  const escala = soma > LIMITE_SOMA_VISEMAS ? LIMITE_SOMA_VISEMAS / soma : 1;
  let algum = false;
  for (const nome of VISEMAS_ALEATORIOS) {
    const v = (valorVisema[nome] || 0) * escala;
    const morph = head.mtAvatar[nome];
    if (morph) morph.v = 0; // sem velocidade acumulada = sem ultrapassar o alvo
    if (v > 0) {
      head.setFixedValue(nome, v);
      aplicadoVisema[nome] = true;
      algum = true;
    } else if (aplicadoVisema[nome]) {
      head.setFixedValue(nome, null);
      aplicadoVisema[nome] = false;
    }
  }
  if (!algum && !falando) { clearInterval(tickBoca); tickBoca = null; ultimoTickBoca = 0; }
}

function iniciarTickBoca() {
  if (!tickBoca) { ultimoTickBoca = 0; tickBoca = window.setInterval(tickDaBoca, 33); }
}

function definirVisema(nome, intensidade) {
  if (!head || !falando) return;
  for (const v of VISEMAS_ALEATORIOS) alvoVisema[v] = 0;
  visemaAtual = nome;
  if (nome) alvoVisema[nome] = intensidade;
  iniciarTickBoca();
}

function limparTimersPalavra() {
  timersPalavra.forEach((id) => clearTimeout(id));
  timersPalavra = [];
  if (avancoTimer) { clearTimeout(avancoTimer); avancoTimer = null; }
}

function semAcentos(t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

function montarPlano(texto, rate) {
  const palavras = [];
  const re = /[A-Za-zÀ-ÿ']+/g;
  let m;
  while ((m = re.exec(texto))) {
    let seq = null;
    try { seq = head.lipsyncWordsToVisemes(semAcentos(m[0]), 'en'); } catch (e) { seq = null; }
    if (seq && !seq.visemes.length) seq = null;
    const unidades = seq ? seq.durations.reduce((a, b) => a + b, 0) : Math.max(1, m[0].length * 0.8);
    const depois = texto.charAt(m.index + m[0].length);
    const pausa = /[,;:]/.test(depois) ? 180 : /[.!?]/.test(depois) ? 320 : 0;
    palavras.push({ ini: m.index, tam: m[0].length, seq, unidades, pausa });
  }
  const r = rate > 0 ? rate : 1;
  return { palavras, mpu: MS_POR_UNIDADE_BASE / r, viuBoundary: false, ultimoIdx: -1, ultimoTempo: 0 };
}

function tocarPalavra(i) {
  if (!plano || !falando || !head || !carregado) return;
  const p = plano.palavras[i];
  if (!p) { definirVisema(null, 0); return; }
  limparTimersPalavra();
  const dur = p.unidades * plano.mpu;
  if (p.seq) {
    p.seq.visemes.forEach((v, k) => {
      const nome = 'viseme_' + v;
      const atraso = p.seq.times[k] * plano.mpu;
      const durVisema = p.seq.durations[k] * plano.mpu;
      const pico = nome in INTENSIDADE_VISEMA ? INTENSIDADE_VISEMA[nome] * (0.94 + Math.random() * 0.12) : 0;
      timersPalavra.push(window.setTimeout(() => {
        if (pico) definirVisema(nome, pico);
        else definirVisema(null, 0); // "sil"
      }, atraso));
      // articulação natural: passa do pico e relaxa (~65%) na segunda metade
      if (pico && durVisema > 90) {
        timersPalavra.push(window.setTimeout(() => {
          if (visemaAtual === nome) definirVisema(nome, pico * 0.65);
        }, atraso + durVisema * 0.5));
      }
    });
  }
  // boca fecha no fim da palavra (pequeno fechamento natural entre palavras)
  timersPalavra.push(window.setTimeout(() => definirVisema(null, 0), dur + 25));
  // Relógio próprio: segue sozinho pra próxima palavra; se o navegador manda
  // "boundary", ele ressincroniza antes disso (aqui vira só uma vigia).
  const espera = (dur + p.pausa) * (plano.viuBoundary ? 1.4 : 1);
  avancoTimer = window.setTimeout(() => {
    avancoTimer = null;
    plano.ultimoIdx = i;
    plano.ultimoTempo = performance.now();
    tocarPalavra(i + 1);
  }, espera);
}

function fecharBoca() {
  limparTimersPalavra();
  if (graceTimer) { clearTimeout(graceTimer); graceTimer = null; }
  for (const v of VISEMAS_ALEATORIOS) alvoVisema[v] = 0;
  visemaAtual = null;
  if (head) iniciarTickBoca(); // o suavizador fecha a boca e se desliga sozinho
}

// Ciclo aleatório por tempo — só quando não há texto/processador fonético.
function trocarVisemaAleatorio() {
  if (!falando || !head || !carregado) return;
  const escolha = VISEMAS_ALEATORIOS[Math.floor(Math.random() * VISEMAS_ALEATORIOS.length)];
  definirVisema(escolha, INTENSIDADE_VISEMA[escolha] * (0.85 + Math.random() * 0.3));
}

window.addEventListener('maya-speaking-start', (ev) => {
  falando = true;
  olharParaCamera(2500); // começa a falar olhando pro aluno
  falandoId = ev.detail?.id ?? null;
  fecharBoca();
  if (cicloFala) { clearInterval(cicloFala); cicloFala = null; }
  const texto = ev.detail?.text || '';
  const temFonetica = !!(head && head.lipsync && head.lipsync.en);
  plano = temFonetica && texto ? montarPlano(texto, ev.detail?.rate) : null;
  if (plano && plano.palavras.length) {
    // dá ~350ms pro "boundary" real assumir; senão o relógio próprio começa
    graceTimer = window.setTimeout(() => {
      graceTimer = null;
      if (plano && !plano.viuBoundary && falando) tocarPalavra(0);
    }, 350);
  } else {
    plano = null;
    cicloFala = window.setInterval(trocarVisemaAleatorio, 190);
  }
});

window.addEventListener('maya-speaking-boundary', (ev) => {
  if (!plano || !falando) return;
  const ci = ev.detail?.charIndex;
  if (typeof ci !== 'number') return;
  let idx = plano.palavras.findIndex((p) => ci >= p.ini && ci < p.ini + p.tam);
  if (idx < 0) idx = plano.palavras.findIndex((p) => p.ini >= ci);
  if (idx < 0 || (plano.viuBoundary && idx === plano.ultimoIdx)) return; // duplicado
  const agora = performance.now();
  if (plano.viuBoundary && plano.ultimoIdx >= 0 && idx === plano.ultimoIdx + 1) {
    // aprende o ritmo real da voz com a duração da palavra anterior
    const anterior = plano.palavras[plano.ultimoIdx];
    const real = agora - plano.ultimoTempo - anterior.pausa;
    const estimado = real / anterior.unidades;
    if (estimado > 50 && estimado < 260) plano.mpu = plano.mpu * 0.55 + estimado * 0.45;
  }
  plano.viuBoundary = true;
  plano.ultimoIdx = idx;
  plano.ultimoTempo = agora;
  tocarPalavra(idx);
});

window.addEventListener('maya-speaking-end', (ev) => {
  // fim de uma fala antiga não pode fechar a boca de uma fala nova
  const id = ev.detail?.id;
  if (id != null && falandoId != null && id !== falandoId) return;
  falando = false;
  plano = null;
  falandoId = null;
  if (cicloFala) { clearInterval(cicloFala); cicloFala = null; }
  fecharBoca();
});
