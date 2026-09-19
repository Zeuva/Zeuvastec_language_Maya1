// ============================================================================
// "Corpo com vida" (2026-09-14, revisão 3 após 2 rodadas de teste ao vivo) —
// respiração + acompanhamento de ombros + braços com postura mais fechada e
// aberturas esporádicas, na armadura do CORPO de verdade
// (`futuristic space suit 3d model` na Maya, `futuristic armor 3d model` no
// Igor) — uma armadura que o TalkingHead nem sabe que existe (ele só enxerga
// "Armature", a cabeça). Por isso este módulo lê os ossos diretamente de
// `head.scene` (a cena Three.js inteira), não de `head.armature`.
//
// Histórico de revisões:
//   Rev 1: respiração por rotação (2°) — sutil demais, quase imperceptível.
//   Rev 2: respiração por escala (4%) no peito — melhor, mas usuário ainda
//          achou fraca demais em uso real.
//   Rev 3: respiração por escala DOBRADA (8%) + um pouco de inclinação de
//          volta (3°) pra dar mais corpo ao efeito. Braços: bind pose
//          original ficava com os dois braços "sempre abertos" — agora tem
//          uma postura de repouso mais FECHADA (braços um pouco mais perto
//          do corpo) e o movimento esporádico ABRE um pouco a partir dessa
//          postura fechada (geralmente um braço de cada vez, às vezes os
//          dois juntos), em vez de girar pra qualquer lado a partir do bind
//          pose original. Eixo de abrir/fechar era Y (errado, balançava
//          frente/trás) — corrigido pra Z (lateral de verdade), confirmado
//          visualmente no Blender.
//   Rev 4: virada esporádica do TRONCO (Spine02) pra esquerda/direita, só pra
//          não ficar parado feito estátua — puxa preferencialmente pro mesmo
//          lado que a cabeça já está olhando (yaw suavizado do
//          acompanhamento), e só sorteia lado aleatório se a cabeça estiver
//          praticamente centralizada.
//   Rev 5: a virada/acompanhamento de Spine02 usava Euler('ZXY') com o "yaw"
//          no eixo LOCAL Z — só que Z, nesse osso, INCLINA/CURVA o tronco
//          (frente/trás ou lateral, dependendo do ângulo), não gira como uma
//          pessoa torcendo a cintura. Em ângulos pequenos (só o
//          acompanhamento, ≤5°) quase não dava pra notar; com a virada
//          esporádica (até 12°) ficou óbvio — o tronco "curvava" e aparecia
//          pele/gola se separando. Confirmado visualmente no Blender: o eixo
//          LOCAL Y (o eixo ao longo da própria coluna) é o que gira o tronco
//          de lado sem curvar. Corrigido: yaw agora usa Y local; pitch (nod)
//          continua em X local; as duas rotações são combinadas
//          separadamente em vez de um Euler composto.
//   Rev 6: removida a virada esporádica/aleatória do tronco (Rev 4) —
//          o usuário pediu algo mais direto: o corpo só vira QUANDO a cabeça
//          vira, e sempre PRO MESMO LADO, proporcional (não um evento
//          aleatório independente). O acompanhamento (ponto 3) já fazia
//          exatamente isso, então virou o único mecanismo de virada do
//          tronco — só aumentei a fração/teto (15%→35%, 5°→12°) pra ficar
//          bem perceptível quando a Maya virar a cabeça de verdade.
//   Rev 7: usuário reportou respiração ainda "quase imperceptível" mesmo
//          depois de 3 aumentos de amplitude (2°→4%→8%+3°). Investigado com
//          um script de pesos de vértice no Blender: a área do peito/logo
//          VISÍVEL (de frente, onde o olho realmente repara) fica sobretudo
//          entre z≈1.25-1.32 — e essa faixa é dominada pelo osso `Spine02`,
//          exatamente o osso que a respiração NUNCA podia tocar (protegido
//          100% pra não abrir a gola). Ou seja: a respiração de Spine01 só
//          mexia numa faixa estreita perto da cintura/cinto (z≈1.09-1.13),
//          quase fora de vista — por isso nenhum aumento de amplitude ali
//          resolvia. Corrigido: `Spine02` passou a inflar também, com a
//          escala nova CANCELADA antes de chegar nos filhos dele (gola e
//          ombros), do mesmo jeito que a respiração de Spine01 já era
//          cancelada antes de chegar em Spine02.
//   Rev 8 (esta): 2 correções do usuário testando ao vivo:
//     (a) "não pode aumentar o corpo dos lados, tem que ser pra frente" — a
//         Rev 7 inflava Spine01/Spine02 nos eixos locais X E Z; testado no
//         Blender (visto de cima e de perfil): o eixo LOCAL X desse osso é
//         LATERAL (escalar X alarga ombro pra ombro, visível de frente) e o
//         eixo LOCAL Z é PROFUNDIDADE (escalar Z projeta o peito pra frente,
//         invisível de frente, só aparece de perfil). Corrigido: respiração
//         agora escala SÓ o eixo Z (nunca mais X).
//     (b) "só o peito" — a respiração no abdômen (Spine01) mal aparecia (é a
//         motivação original da Rev 7) e é redundante agora que o peito
//         (Spine02) já carrega o efeito visível; removida por completo —
//         Spine01 fica sempre parado, só `Spine02` respira.
//
// Estratégia:
//   1. Respiração: só `Spine02` (peito, onde fica o logo ZEUVASTEC — a área
//      realmente visível, confirmado por análise de peso de vértice no
//      Blender) infla no eixo LOCAL Z (profundidade/frente — confirmado no
//      Blender; X seria lateral/ombro, errado, Y esticaria a coluna).
//   2. Proteção da gola e dos ombros: a escala de respiração de `Spine02` é
//      cancelada exatamente antes de chegar nos filhos diretos dele —
//      `NeckTwist01` (sobe até a gola/base do pescoço), `L_Clavicle` e
//      `R_Clavicle` (ombros, de onde pendem os braços) — usando uma divisão
//      componente-a-componente exata (não aproximada) da posição/escala de
//      repouso. Só a ESCALA é cancelada; a ROTAÇÃO (giro de acompanhar a
//      cabeça, item 3) passa normalmente pra esses filhos.
//   3. Acompanhamento: `Spine02` (e portanto ombros/braços, que são filhos
//      dele) gira uma fração suavizada da rotação atual da cabeça — o corpo
//      só vira QUANDO a cabeça vira, sempre pro mesmo lado (proporcional).
//   4. Braços: postura de repouso mais fechada + aberturas esporádicas e
//      independentes por braço, com chance ocasional de abrir os dois juntos.
// ============================================================================

import * as THREE from 'three';

const _qInv = new THREE.Quaternion();
const _qDelta = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _qYawTwist = new THREE.Quaternion();
const _qArm = new THREE.Quaternion();
const AXIS_Y = new THREE.Vector3(0, 1, 0); // torce o tronco pro lado (ao longo da coluna) — testado no Blender
// Eixo mundial pra abrir/fechar o braço PRA LATERAL (não frente/trás): testado
// visualmente no Blender (girar em torno de X balança frente/trás, Y levanta o
// braço na diagonal, Z é o que abre/fecha de verdade pro lado) — 2026-09-14.
const WORLD_ARM_AXIS = new THREE.Vector3(0, 0, 1);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function randRange(a, b) { return a + Math.random() * (b - a); }

/**
 * Converte um eixo em espaço MUNDIAL para o espaço LOCAL de um osso, usando
 * a orientação de REPOUSO do osso (aproximação válida mesmo com o pai se
 * movendo um pouco depois, já que os movimentos do pai aqui são pequenos).
 */
function worldAxisToLocal(bone, worldAxis) {
  const worldQuat = bone.getWorldQuaternion(new THREE.Quaternion());
  const invWorldQuat = worldQuat.clone().invert();
  return worldAxis.clone().applyQuaternion(invWorldQuat).normalize();
}

/**
 * Um braço com postura de repouso "fechada" (mais perto do corpo do que o
 * bind pose original) que, esporadicamente, ABRE um pouco, segura, e volta
 * a fechar. `sign` é +1 ou -1 pra espelhar o lado (esquerdo/direito).
 */
function makeArm(bone, sign, opts) {
  const { closedOffsetDeg, openMinDeg, openMaxDeg, moveMs, holdMs } = opts;
  const restQuat = bone.quaternion.clone();
  const localAxis = worldAxisToLocal(bone, WORLD_ARM_AXIS);

  // Postura de repouso fechada = bind pose original + um giro pra dentro.
  const qClosedOffset = new THREE.Quaternion().setFromAxisAngle(localAxis, sign * THREE.MathUtils.degToRad(-closedOffsetDeg));
  const restClosedQuat = restQuat.clone().multiply(qClosedOffset);

  let state = 'idle';
  let stateStart = performance.now();
  let nextTriggerAt = stateStart + randRange(opts.minIntervalMs, opts.maxIntervalMs);
  let targetOpenDeg = 0;
  let moveDur = moveMs, holdDur = holdMs, returnDur = moveMs;

  function trigger(now) {
    if (state !== 'idle') return false;
    targetOpenDeg = randRange(openMinDeg, openMaxDeg);
    moveDur = randRange(moveMs * 0.7, moveMs * 1.3);
    holdDur = randRange(holdMs * 0.6, holdMs * 1.4);
    returnDur = randRange(moveMs * 0.7, moveMs * 1.3);
    state = 'opening'; stateStart = now;
    return true;
  }

  function update(now) {
    let openDeg;
    if (state === 'idle') {
      openDeg = 0;
      if (now >= nextTriggerAt) trigger(now);
      openDeg = 0;
    } else if (state === 'opening') {
      const t = Math.min(1, (now - stateStart) / moveDur);
      openDeg = targetOpenDeg * easeInOutCubic(t);
      if (t >= 1) { state = 'holding'; stateStart = now; }
    } else if (state === 'holding') {
      openDeg = targetOpenDeg;
      if (now - stateStart >= holdDur) { state = 'closing'; stateStart = now; }
    } else { // closing
      const t = Math.min(1, (now - stateStart) / returnDur);
      openDeg = targetOpenDeg * (1 - easeInOutCubic(t));
      if (t >= 1) {
        state = 'idle'; openDeg = 0;
        nextTriggerAt = now + randRange(opts.minIntervalMs, opts.maxIntervalMs);
      }
    }
    _qArm.setFromAxisAngle(localAxis, sign * THREE.MathUtils.degToRad(openDeg));
    bone.quaternion.copy(restClosedQuat).multiply(_qArm);
  }

  return { update, trigger, isIdle: () => state === 'idle' };
}

/**
 * Ativa respiração + acompanhamento de ombros + braços (postura fechada +
 * aberturas esporádicas) no CORPO (não na cabeça). Chame depois de
 * `ativarCorpoCongelado(head)`.
 */
export function ativarCorpoVida(head, opts = {}) {
  const {
    breathAmplitudePctChest = 0.12,
    breathPeriodSec = 4.2,
    followFraction = 0.25,
    followSmoothing = 0.08,
    followMaxDeg = 5,
    arm: armOptsIn = {},
  } = opts;

  const bSpine02 = head.scene.getObjectByName('Spine02');
  if (!bSpine02) {
    console.warn('[corpo-vida] Spine02 do corpo não encontrado — regra NÃO aplicada.');
    return null;
  }
  // Filhos diretos de Spine02, confirmado na hierarquia real do rig:
  // `NeckTwist01` (sobe em direção à gola/base do pescoço) e `L_Clavicle`/
  // `R_Clavicle` (ombros, de onde pendem os braços). Todos precisam ser
  // protegidos da NOVA respiração do peito (escala em Spine02) — a gola não
  // pode se mexer, e os ombros/braços não podem deslocar de posição por
  // causa da respiração (só o giro de acompanhar a cabeça, esse sim, deve
  // passar normalmente pra eles).
  const bNeckTwist01 = head.scene.getObjectByName('NeckTwist01');
  const bLClavicle = head.scene.getObjectByName('L_Clavicle');
  const bRClavicle = head.scene.getObjectByName('R_Clavicle');
  if (!bNeckTwist01) {
    console.warn('[corpo-vida] NeckTwist01 não encontrado — respiração do peito (Spine02) desativada por segurança.');
  }

  const restSpine02 = { pos: bSpine02.position.clone(), quat: bSpine02.quaternion.clone(), scale: bSpine02.scale.clone() };

  function captureRest(bone) {
    return bone ? { pos: bone.position.clone(), scale: bone.scale.clone() } : null;
  }
  const restNeckTwist01 = captureRest(bNeckTwist01);
  const restLClavicle = captureRest(bLClavicle);
  const restRClavicle = captureRest(bRClavicle);

  // Cancela EXATAMENTE o efeito da escala de `parentScale` (a escala atual
  // de Spine02) sobre um filho direto — sem passar por decompose/matrizes:
  // é uma divisão componente-a-componente da posição e da escala de repouso.
  // Isso é uma identidade exata (S*T(v) = T(S·v)*S para escala diagonal),
  // não uma aproximação — o filho fica exatamente na posição/tamanho de
  // repouso, custe o que custar a escala de Spine02 naquele frame. A
  // ROTAÇÃO do filho não é tocada aqui: ela continua herdando normalmente a
  // rotação de Spine02 (incluindo o giro de acompanhar a cabeça), do mesmo
  // jeito que já acontecia antes desta correção existir.
  function protectFromParentScale(bone, rest, parentScale) {
    if (!bone) return;
    bone.position.set(rest.pos.x / parentScale.x, rest.pos.y / parentScale.y, rest.pos.z / parentScale.z);
    bone.scale.set(rest.scale.x / parentScale.x, rest.scale.y / parentScale.y, rest.scale.z / parentScale.z);
  }

  const objHead = head.objectHead;
  const restHeadQuat = objHead ? objHead.quaternion.clone() : null;

  const bLUp = head.scene.getObjectByName('L_Upperarm');
  const bRUp = head.scene.getObjectByName('R_Upperarm');
  const ARM_DEFAULTS = {
    closedOffsetDeg: 6,          // quanto mais fechado que o bind pose original
    openMinDeg: 4, openMaxDeg: 10,  // quanto abre na rajada esporádica
    minIntervalMs: 6000, maxIntervalMs: 14000,
    moveMs: 900, holdMs: 1300,
    bothArmsChance: 0.3,         // chance de puxar o outro braço junto ao disparar um
  };
  const armCfg = { ...ARM_DEFAULTS, ...armOptsIn };
  const leftArm = bLUp ? makeArm(bLUp, +1, armCfg) : null;
  const rightArm = bRUp ? makeArm(bRUp, -1, armCfg) : null;

  const startTime = performance.now();
  let smoothYaw = 0;

  function beforeRender() {
    const now = performance.now();
    const t = (now - startTime) / 1000;

    // 1) Respiração — só Spine02 (peito) infla, só no eixo LOCAL Z
    // (profundidade/frente — confirmado no Blender). Spine01 nunca se mexe.
    const phase = Math.sin(2 * Math.PI * t / breathPeriodSec) * 0.5 + 0.5; // 0..1
    const sChest = 1 + breathAmplitudePctChest * phase;
    bSpine02.position.copy(restSpine02.pos);
    bSpine02.quaternion.copy(restSpine02.quat);
    bSpine02.scale.set(restSpine02.scale.x, restSpine02.scale.y, restSpine02.scale.z * sChest);

    // 2) Acompanhamento de ombros: fração pequena e suavizada do GIRO
    // LATERAL (yaw) atual de Head (lida com ~1 frame de atraso, já corrigida
    // pelo corpo-congelado — atraso imperceptível). NUNCA acompanha o PITCH
    // (balançar a cabeça pra frente/trás) — removido 2026-09-15: comparado
    // com uma build paralela do mesmo projeto ("111 Codex", fornecida pelo
    // usuário como referência) a pedido do usuário, cujo corpo-vida.js já
    // fazia exatamente isso (só yaw, tronco nunca inclina no pitch); adotados
    // também os mesmos números (25% de fração, teto 5°, em vez dos 35%/12°
    // que este arquivo usava). Relacionado à investigação da mancha de pele
    // no ombro (parte 23 da memória do projeto): a mancha já foi confirmada
    // como puramente geométrica (a gola rígida não acompanha a ROTAÇÃO do
    // pescoço) e reproduzida sem nenhum movimento de corpo-vida envolvido —
    // esta mudança não elimina a mancha, só evita que o tronco também
    // incline no pitch (mantendo o corpo mais parado/previsível, como no
    // Codex), a pedido explícito do usuário.
    if (objHead && restHeadQuat) {
      _qInv.copy(restHeadQuat).invert();
      _qDelta.copy(_qInv).multiply(objHead.quaternion);
      _euler.setFromQuaternion(_qDelta, 'ZXY');
      smoothYaw += (_euler.z - smoothYaw) * followSmoothing;
    }
    // O corpo só vira quando (e pro mesmo lado que) a cabeça vira — nada de
    // gatilho independente/aleatório aqui, é 100% proporcional ao yaw atual
    // da cabeça (suavizado). Se a cabeça está centralizada, fYaw fica ~0 e o
    // tronco volta sozinho ao centro.
    const maxRad = THREE.MathUtils.degToRad(followMaxDeg);
    const fYaw = THREE.MathUtils.clamp(smoothYaw * followFraction, -maxRad, maxRad);
    // "Torcer o tronco pro lado" (yaw) gira em torno do eixo LOCAL Y do osso
    // (o eixo ao longo da própria coluna) — confirmado visualmente no
    // Blender (Z inclina/curva o tronco, não torce).
    _qYawTwist.setFromAxisAngle(AXIS_Y, fYaw);
    bSpine02.quaternion.premultiply(_qYawTwist);

    // 3) Protege a gola E os ombros: cancela exatamente a escala de
    // respiração de Spine02 (passo 1) antes que ela chegue nos 3 filhos
    // diretos — gola (`NeckTwist01`) e ombros (`L_Clavicle`/`R_Clavicle`)
    // ficam exatamente na posição/tamanho de repouso; só a rotação de
    // acompanhar a cabeça (já aplicada em Spine02, acima) passa pra eles.
    protectFromParentScale(bNeckTwist01, restNeckTwist01, bSpine02.scale);
    protectFromParentScale(bLClavicle, restLClavicle, bSpine02.scale);
    protectFromParentScale(bRClavicle, restRClavicle, bSpine02.scale);

    // 4) Braços: postura fechada + aberturas esporádicas. Quando um braço
    // dispara sozinho, existe uma chance de puxar o outro junto.
    const leftWasIdle = leftArm ? leftArm.isIdle() : true;
    const rightWasIdle = rightArm ? rightArm.isIdle() : true;
    if (leftArm) leftArm.update(now);
    if (rightArm) rightArm.update(now);
    if (leftArm && rightArm) {
      if (leftWasIdle && !leftArm.isIdle() && rightWasIdle && Math.random() < armCfg.bothArmsChance) {
        rightArm.trigger(now);
      } else if (rightWasIdle && !rightArm.isIdle() && leftWasIdle && Math.random() < armCfg.bothArmsChance) {
        leftArm.trigger(now);
      }
    }
  }

  const originalRender = head.renderer.render.bind(head.renderer);
  head.renderer.render = function (scene, camera) {
    beforeRender();
    return originalRender(scene, camera);
  };

  console.log(`[corpo-vida] Respiração só no peito (Spine02, ${Math.round(breathAmplitudePctChest*100)}%, ` +
    `só pra frente — eixo Z local, protegida até gola/ombros) + ` +
    `tronco virando SÓ no giro lateral, quando e PRO MESMO LADO que a cabeça vira (${Math.round(followFraction*100)}% até ±${followMaxDeg}°, nunca no pitch) + ` +
    'braços com postura fechada e aberturas esporádicas ativados.');

  return { beforeRender };
}
