/*
 * AJUSTES SOLICITADOS — sem alterar a paleta, o design ou as funcionalidades existentes.
 * 1) "Dias seguidos" agora representa dias consecutivos de prática/uso significativo.
 * 2) Corrige o catálogo de lições em telas estreitas/landscape.
 * 3) Mantém o card Hero com altura adaptável ao conteúdo.
 * 4) Garante que o botão de som respeite o estado ligado/desligado.
 */
(function () {
  'use strict';

  // ------------------------------------------------------------
  // 1. Sequência real de dias de prática
  // ------------------------------------------------------------
  const ACTIVITY_KEY = 'zeuvastec-activity-days';

  function localDayKey(date) {
    const d = date || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function loadActivityDays() {
    try {
      const value = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function saveActivityDays(days) {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(days.slice(-366)));
  }

  function calculateStreak(days) {
    const set = new Set(days);
    let cursor = new Date();
    let streak = 0;

    while (set.has(localDayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function updateStreak() {
    const el = document.getElementById('streak');
    if (el) el.textContent = String(calculateStreak(loadActivityDays()));
  }

  function registerPracticeActivity() {
    const days = loadActivityDays();
    const today = localDayKey();
    if (!days.includes(today)) {
      days.push(today);
      saveActivityDays(days);
    }
    updateStreak();
  }

  // Disponibiliza para os outros módulos sem mudar a API existente.
  window.registerPracticeActivity = registerPracticeActivity;
  window.updateZeuvastecStreak = updateStreak;
  updateStreak();

  // A atividade só é registrada por conclusões de lição ou revisão de palavra,
  // nunca por simplesmente abrir uma lição. Isso evita aumentar a sequência
  // antes de o aluno realmente estudar.

  // O botão geral de som é tratado no app.js; os leitores de voz também
  // respeitam soundOn nos módulos de áudio.

  // ------------------------------------------------------------
  // 3. Ao girar o aparelho, não deixa o catálogo ficar aninhado
  //    em duas grades e encolher os cartões.
  // ------------------------------------------------------------
  function fixLessonCatalog() {
    const catalog = document.getElementById('lesson-catalog');
    if (catalog) catalog.style.display = 'block';
  }
  fixLessonCatalog();
  window.addEventListener('resize', fixLessonCatalog);
  window.addEventListener('orientationchange', function () {
    setTimeout(fixLessonCatalog, 50);
  });

  // Reaplica depois de renderizações do catálogo.
  const observer = new MutationObserver(fixLessonCatalog);
  const catalogRoot = document.getElementById('lesson-catalog');
  if (catalogRoot) observer.observe(catalogRoot, { childList: true });
})();
