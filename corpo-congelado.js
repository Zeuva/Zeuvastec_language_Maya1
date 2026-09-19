// ============================================================================
// REGRA ABSOLUTA (teste "corpo congelado" — 2026-09-14, Maya e depois Igor,
// mesma arquitetura de avatar/rig nos dois):
//   O corpo deve permanecer 100% imóvel. O TalkingHead 1.7 nunca deve mover o
//   osso `Neck`, nem qualquer osso de tronco/ombro/braço da própria armadura
//   da cabeça (Hips/Spine/Spine1/Spine2/LeftShoulder/RightShoulder/LeftArm/
//   RightArm). Toda rotação de cabeça deve vir SOMENTE do osso `Head`,
//   limitada a ±HEAD_MAX_DEG.
//
//   Este arquivo NÃO edita a lógica interna do TalkingHead. Ele se conecta
//   por fora, interceptando `head.renderer.render` (chamado uma vez por
//   frame, depois que o TalkingHead já calculou toda a pose daquele frame e
//   antes de desenhar). A cada frame, ANTES do desenho:
//     1. Lê a rotação que o TalkingHead tentou aplicar em `Neck` naquele
//        frame (pode vir de idle/fala/gestos/olhar internos da lib).
//     2. Redireciona essa rotação para `Head` (soma na rotação que `Head`
//        já ia receber), preservando o "espírito" do pequeno movimento.
//     3. Devolve `Neck` exatamente à pose de repouso — rotação, ESCALA e
//        posição (o TalkingHead tem uma respiração própria que ESCALA Neck;
//        sem travar a escala também, a cabeça inteira parecia "respirar",
//        crescendo/encolhendo — bug real encontrado e corrigido aqui).
//     4. Limita a rotação total de `Head` (em relação ao repouso) a
//        HEAD_MAX_DEG graus, e trava a escala/posição de `Head` também.
//     5. Devolve Hips/Spine/Spine1/Spine2/LeftShoulder/RightShoulder/
//        LeftArm/RightArm (+ o esqueleto vestigial enxertado) exatamente à
//        pose de repouso (posição, rotação e escala) — nenhum desses ossos
//        da armadura da cabeça se move.
//
//   O corpo real do Zeuvastec (traje/uniforme) é um mesh e uma armadura
//   COMPLETAMENTE separados no GLB (`futuristic space suit 3d model` na Maya,
//   `futuristic armor 3d model` no Igor), sem nenhum peso de vértice ligado a
//   Neck/Jaw/Head desta armadura da cabeça — o TalkingHead nem enxerga essa
//   armadura (ele só olha para o nó chamado "Armature", que é só a cabeça).
//   Ver RELATORIO_TESTE_ZEUVASTEC.md.
//   Este arquivo cobre o caso, ainda mais raro, de a própria armadura da
//   cabeça carregar rotação em ossos de tronco/ombro/braço herdados do rig
//   original.
// ============================================================================

import * as THREE from 'three';

const HEAD_MAX_DEG = 20; // limite duro absoluto pedido pelo usuário (alvo normal: ~15°)
const HEAD_MAX_RAD = HEAD_MAX_DEG * Math.PI / 180;
// Lista ampliada 2026-09-14: além dos 8 ossos de tronco/ombro/braço originais
// (herdados do rig da própria cabeça), inclui agora TODO o esqueleto humanoide
// "de esqueleto" (pernas/pés/dedos/mãos/braços completos) que foi enxertado no
// Igor só pra satisfazer a checagem interna do TalkingHead 1.7 (ele exige um
// esqueleto completo tipo Mixamo mesmo numa armadura só-de-cabeça — ver
// memória do projeto, "part 13"). Esses ossos não têm NENHUM peso de vértice
// em nenhuma malha (são só placeholders invisíveis) — mas o TalkingHead ainda
// assim tenta aplicar uma pose de corpo inteiro neles, o que é inofensivo em
// si (nada visível pra deformar) mas foi incluído aqui por precaução.
const FROZEN_BONE_NAMES = [
  'Hips','Spine','Spine1','Spine2','LeftShoulder','RightShoulder','LeftArm','RightArm',
  'LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase',
  'LeftForeArm','LeftHand','LeftHandIndex1','LeftHandIndex2','LeftHandIndex3',
  'LeftHandMiddle1','LeftHandMiddle2','LeftHandMiddle3','LeftHandPinky1','LeftHandPinky2','LeftHandPinky3',
  'LeftHandRing1','LeftHandRing2','LeftHandRing3','LeftHandThumb1','LeftHandThumb2','LeftHandThumb3',
  'RightForeArm','RightHand','RightHandIndex1','RightHandIndex2','RightHandIndex3',
  'RightHandMiddle1','RightHandMiddle2','RightHandMiddle3','RightHandPinky1','RightHandPinky2','RightHandPinky3',
  'RightHandRing1','RightHandRing2','RightHandRing3','RightHandThumb1','RightHandThumb2','RightHandThumb3',
];
// BUG ENCONTRADO 2026-09-14 (investigado via CDP/DevTools remoto direto no
// processo real do Electron, com o app "sem cabeça" reproduzido ao vivo): o
// sistema de expressão/lipsync do TalkingHead 1.7 ocasionalmente calcula uma
// rotação ABSURDA — perto de 180°, o padrão clássico de um slerp/interpolação
// de quaternion pegando o "caminho longo" em vez do curto — em vários ossos
// ao mesmo tempo: Jaw (medido 138°), LeftEye/RightEye (~137°),
// LeftOrbicularisTop/Bottom e RightOrbicularisTop/Bottom (~162-174°, músculos
// ao redor dos olhos), PonytailRoot (~172°) e até LeftShoulder/RightShoulder
// (~125-133°, ossos vestigiais da própria armadura da cabeça, sem peso de
// vértice). Nenhum erro aparece no console em nenhum caso.
//
// HISTÓRICO DE TENTATIVAS SÓ NA JAW (todas rejeitadas, uma por uma):
//   - teto de 40°: mandíbula "travada sem queixo" quase toda a fala (o valor
//     de origem é um erro GRANDE e praticamente CONSTANTE, medido 717 frames
//     sempre exatamente no mesmo ângulo — clampar o tamanho só reloca pra
//     outro ângulo igualmente fixo, nunca acompanha a fala de verdade).
//   - travar pra identidade (0°): a cabeça nunca mais sumia, mas o usuário
//     reportou "com a trava o rosto fica anormal, aparência nada realista" —
//     mais forte que uma marquinha cosmética: a pose de repouso "identidade"
//     do osso Jaw NÃO é, sozinha, um queixo com aparência normal neste rig
//     (provavelmente o bind pose local do osso já carrega alguma rotação
//     própria da autoria do esqueleto — forçar identidade "achata" o queixo).
//   - sintetizar a rotação a partir do morph `jawOpen` (0° em repouso, até
//     22° falando): ainda ficava sem queixo a maior parte do tempo, porque
//     no repouso (jawOpen≈0) ainda cai em identidade — mesmo problema do
//     item anterior, só que menos frequente.
//
// SOLUÇÃO ATUAL (2026-09-15) — adotada por comparação direta com uma versão
// paralela do mesmo projeto (build "111 Codex", fornecida pelo usuário como
// referência): PARAR DE CORRIGIR A ROTAÇÃO DA JAW (e de LeftEye/RightEye/
// Orbicularis*/PonytailRoot) OU DE TENTAR ADIVINHAR SUA "POSE DE REPOUSO
// CORRETA" — a rotação "errada" de ~130-174° que o TalkingHead calcula É,
// por coincidência (já documentado nos testes de 2026-09-14), a que dá a
// aparência fechada/normal para esses ossos; qualquer trava (0°, 22°, 40°)
// piora a aparência porque IMPÕE um ângulo constante onde a fala de verdade
// precisa variar. A causa raiz do "sumiço" da cabeça (ver histórico acima)
// nunca foi, tecnicamente, "o ângulo é grande" — foi um valor genuinamente
// INVÁLIDO (NaN/Infinity/quaternion de comprimento ~0) escapando pra dentro
// do skinning. Este arquivo agora só entra em ação nesse caso raro: cada
// osso da armadura tem seu último valor VÁLIDO guardado (capturado o mais
// cedo possível, ver `ativarCorpoCongelado` sendo chamado logo após
// `showAvatar`, antes de qualquer espera de rede/áudio, em renderer.js) e,
// a cada frame, se o valor atual for inválido, ele é recuperado — do
// contrário, o TalkingHead controla Jaw/olhos/músculos livremente, com o
// visual "estranho mas correto" já validado nos testes anteriores.
const _qInv = new THREE.Quaternion();
const _qDelta = new THREE.Quaternion();
const _qScaledDelta = new THREE.Quaternion();
const _qIdentity = new THREE.Quaternion();

function clampQuatAroundRest(currentQuat, restQuat, maxRad) {
  _qInv.copy(restQuat).invert();
  _qDelta.copy(_qInv).multiply(currentQuat); // delta = rest^-1 * current
  const w = Math.min(1, Math.max(-1, Math.abs(_qDelta.w)));
  const angle = 2 * Math.acos(w);
  if (angle > maxRad && angle > 1e-6) {
    const t = maxRad / angle;
    _qScaledDelta.copy(_qIdentity).slerp(_qDelta, t);
    currentQuat.copy(restQuat).multiply(_qScaledDelta);
  }
}

function isFiniteQuat(q) {
  return Number.isFinite(q.x) && Number.isFinite(q.y) && Number.isFinite(q.z) && Number.isFinite(q.w);
}

/**
 * Ativa a regra de "corpo congelado" numa instância já carregada do TalkingHead.
 * Chame IMEDIATAMENTE depois de `await head.showAvatar(...)` resolver, ANTES
 * de qualquer outra espera (ex.: carregamento de áudio) — quanto mais cedo
 * este código capturar os valores de referência, menor a chance de já
 * capturar um osso que o TalkingHead tenha corrompido no meio tempo.
 */
export function ativarCorpoCongelado(head) {
  if (!head || !head.armature) {
    console.warn('[corpo-congelado] head/armature ausente — regra NÃO aplicada.');
    return null;
  }
  const objHead = head.objectHead;
  const objNeck = head.objectNeck;
  if (!objHead || !objNeck) {
    console.warn('[corpo-congelado] Head/Neck não encontrados na armadura — regra NÃO aplicada.');
    return null;
  }
  const restHeadQuat = objHead.quaternion.clone();
  const restHeadScale = objHead.scale.clone();
  const restHeadPos = objHead.position.clone();
  const restNeckQuat = objNeck.quaternion.clone();
  const restNeckScale = objNeck.scale.clone();
  const restNeckPos = objNeck.position.clone();

  // Rede de segurança genérica contra valores INVÁLIDOS (não contra valores
  // "grandes mas válidos" — ver nota grande acima): guarda o último estado
  // válido de TODOS os ossos da armadura (Jaw/olhos/músculos incluídos), pra
  // poder recuperar só se o TalkingHead produzir NaN/Infinity/quaternion
  // degenerado. Fora isso, esses ossos ficam livres — é o que dá a aparência
  // correta de queixo/olhos/fala.
  const validBones = [];
  head.armature.traverse(obj => {
    if (obj.isBone) {
      validBones.push({ obj, pos: obj.position.clone(), quat: obj.quaternion.clone(), scale: obj.scale.clone() });
    }
  });

  // MESMO PROBLEMA do bloco de cima: a referência de rotação "congelada" não
  // pode ser "o valor atual quando este código roda" — LeftShoulder/RightShoulder
  // (que este congelamento já deveria proteger desde o início) foram flagrados
  // recebendo ~125-133° do mesmo jeito que Jaw/olhos, e como o congelamento os
  // travava no valor JÁ CORROMPIDO capturado aqui, na prática eles nunca
  // ficavam protegidos de verdade. Rotação usa identidade fixa; posição/escala
  // continuam usando o valor capturado (não há evidência de que esses dois
  // sejam afetados pelo mesmo bug — só a rotação mostrou valores absurdos).
  const _qFrozenIdentity = new THREE.Quaternion();
  const frozen = FROZEN_BONE_NAMES.map(name => {
    const obj = head.armature.getObjectByName(name);
    if (!obj) return null;
    return {
      name, obj,
      quat: _qFrozenIdentity,
      scale: obj.scale.clone(),
      pos: obj.position.clone(),
    };
  }).filter(Boolean);

  let neckInterceptCount = 0;
  let lastLogAt = 0;

  function beforeRender() {
    // Recuperação de valores inválidos em QUALQUER osso da armadura (Jaw,
    // olhos, músculos faciais incluídos) — só entra em ação em NaN/Infinity/
    // quaternion degenerado, nunca em valores grandes-mas-válidos.
    for (const f of validBones) {
      if (![f.obj.position.x, f.obj.position.y, f.obj.position.z].every(Number.isFinite)) {
        f.obj.position.copy(f.pos);
      }
      if (![f.obj.scale.x, f.obj.scale.y, f.obj.scale.z].every(v => Number.isFinite(v) && v > 0)) {
        f.obj.scale.copy(f.scale);
      }
      if (!isFiniteQuat(f.obj.quaternion) || f.obj.quaternion.lengthSq() < 1e-12) {
        f.obj.quaternion.copy(f.quat);
      }
    }

    // Rede de segurança contra NaN/Infinity: se o TalkingHead (por qualquer
    // motivo interno, ex.: divisão degenerada no "nod" por volume) produzir
    // uma rotação inválida em Neck ou Head, não deixe isso se propagar —
    // volta os dois para a pose de repouso neste frame em vez de arriscar
    // um estado indefinido.
    if (!isFiniteQuat(objNeck.quaternion)) objNeck.quaternion.copy(restNeckQuat);
    if (!isFiniteQuat(objHead.quaternion)) objHead.quaternion.copy(restHeadQuat);

    // 1-2-3: o que o TalkingHead calculou para Neck neste frame vira um
    // "delta" (rotação em relação ao repouso de Neck); esse delta é
    // transferido para Head; Neck volta exatamente ao repouso.
    _qInv.copy(restNeckQuat).invert();
    _qDelta.copy(_qInv).multiply(objNeck.quaternion); // delta que o TalkingHead tentou dar ao Neck
    const neckAngle = 2 * Math.acos(Math.min(1, Math.max(-1, Math.abs(_qDelta.w))));
    if (neckAngle > 1e-4) {
      neckInterceptCount++;
      objHead.quaternion.premultiply(_qDelta); // redireciona para Head
      const now = performance.now();
      if (now - lastLogAt > 5000) { // log discreto, no máx. a cada 5s
        console.log(`[corpo-congelado] Neck tentou girar ${(neckAngle*180/Math.PI).toFixed(2)}° — redirecionado para Head. (interceptado ${neckInterceptCount}x até agora)`);
        lastLogAt = now;
      }
    }
    objNeck.quaternion.copy(restNeckQuat);
    if (!isFiniteQuat(objHead.quaternion)) objHead.quaternion.copy(restHeadQuat); // pós-redirect

    // 4: limita a rotação total de Head (própria + redirecionada de Neck) a ±HEAD_MAX_DEG
    clampQuatAroundRest(objHead.quaternion, restHeadQuat, HEAD_MAX_RAD);
    if (!isFiniteQuat(objHead.quaternion)) objHead.quaternion.copy(restHeadQuat); // pós-clamp

    // BUG CORRIGIDO (2026-09-14): o TalkingHead 1.7 tem uma respiração própria
    // embutida ("chestInhale") que aplica uma ESCALA em Neck (compensando uma
    // escala que ele mesmo dá em Spine1) — como só travávamos a ROTAÇÃO de
    // Neck, essa escala passava direto e fazia a cabeça inteira (filha de
    // Neck) crescer/encolher a cada respiração do TalkingHead. Trava também
    // escala e posição de Neck e Head, sempre no valor de repouso — só a
    // rotação de Head (já tratada acima) pode variar.
    objNeck.scale.copy(restNeckScale);
    objNeck.position.copy(restNeckPos);
    objHead.scale.copy(restHeadScale);
    objHead.position.copy(restHeadPos);

    // 5: tronco/ombros/braços/pernas/mãos vestigiais da armadura da cabeça
    // voltam sempre ao repouso (rotação fixa em identidade — ver nota acima).
    for (const f of frozen) {
      f.obj.quaternion.copy(f.quat);
      f.obj.scale.copy(f.scale);
      f.obj.position.copy(f.pos);
    }

    // Jaw, olhos e músculos faciais (LeftEye/RightEye/Orbicularis*/PonytailRoot)
    // NÃO são tocados aqui de propósito — ficam livres para o TalkingHead
    // animar (ver nota grande no topo do arquivo). Já foram recuperados acima
    // caso tivessem virado NaN/Infinity/degenerados neste frame.
  }

  const originalRender = head.renderer.render.bind(head.renderer);
  head.renderer.render = function (scene, camera) {
    beforeRender();
    return originalRender(scene, camera);
  };

  console.log('[corpo-congelado] Regra ativada: Neck sempre parado (redirecionado p/ Head), ' +
    `Head limitado a ±${HEAD_MAX_DEG}°, Jaw/olhos/músculos faciais livres (só recuperados se ` +
    `ficarem NaN/inválidos), ${frozen.length} ossos de tronco/ombro/braço/perna/mão da armadura ` +
    `da cabeça congelados.`);

  return {
    getInterceptCount: () => neckInterceptCount,
    restHeadQuat, restNeckQuat, frozen,
  };
}
