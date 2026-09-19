/* Mantém o leitor de voz ativo em navegadores móveis e PWAs Android. */
(() => {
  if (!('speechSynthesis' in window)) return;
  const speech = window.speechSynthesis;
  let voices = [];
  const refresh = () => { voices = speech.getVoices(); };
  refresh();
  speech.addEventListener?.('voiceschanged', refresh);
  window.addEventListener('pageshow', () => { refresh(); speech.resume(); });

  function unlock() {
    try { speech.cancel(); speech.resume(); } catch (_) {}
  }
  document.addEventListener('pointerdown', unlock, { passive: true, capture: true });
  document.addEventListener('touchstart', unlock, { passive: true, capture: true });

  function say(text, lang) {
    if (!text) return;
    if (typeof soundOn !== 'undefined' && !soundOn) return;
    unlock();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || 'en-US';
    utterance.rate = 0.9;
    utterance.volume = 1;
    const prefix = utterance.lang.slice(0, 2).toLowerCase();
    const voice = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
    if (voice) utterance.voice = voice;
    speech.cancel();
    speech.speak(utterance);
  }

  /* Fallback para todos os botões de áudio criados dinamicamente pelas lições. */
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-say], [data-say-en], [data-say-pt], .mini-listen');
    if (!button) return;
    const text = button.dataset.sayEn || button.dataset.sayPt || button.dataset.say;
    if (!text) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    say(text, button.dataset.sayPt ? 'pt-BR' : 'en-US');
  }, true);

  /* Evita a pausa automática do sintetizador em sessões longas no Android. */
  setInterval(() => { if (speech.paused) speech.resume(); }, 5000);
})();
