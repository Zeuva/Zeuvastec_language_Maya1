
(function () {
  const soundBtn = document.getElementById('sound-toggle');
  const micBtn = document.getElementById('mic-button');
  
  function unlockAudio(){
    if(typeof soundOn !== 'undefined' && !soundOn) return;
    if(!window.speechSynthesis) return;
    console.log('[AUDIO] Desbloqueando áudio');
    // Se a Maya já está falando (ou tem fala na fila), o toque do aluno NÃO
    // pode cancelar nem misturar o teste quase mudo de desbloqueio na fala
    // (2026-09-19: "um toque em qualquer área da tela interrompe a fala").
    const jaFalando = window.speechSynthesis.speaking || window.speechSynthesis.pending;
    if (!jaFalando) window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    // iOS audio context unlock
    try{
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if(AudioContext){
        const ctx = new AudioContext();
        if(ctx.state==='suspended') ctx.resume();
        const buffer = ctx.createBuffer(1,1,22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    }catch(e){}
    
    if (jaFalando) return; // só destrava o contexto de áudio; sem teste de voz
    setTimeout(() => {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return; // a Maya começou a falar nesse meio tempo
      const test = new SpeechSynthesisUtterance('Audio is ready. Let us learn English.');
      test.lang = 'en-US';
      test.rate = 0.9;
      test.volume = 0.01; // quase silencioso para desbloqueio
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((item) => /^en(-|_)/i.test(item.lang));
      if (voice) test.voice = voice;
      window.speechSynthesis.speak(test);
      setTimeout(()=> { if (window.speechSynthesis.speaking && window.speechSynthesis.pending === false) { /* só cancela o teste dele mesmo */ } window.speechSynthesis.cancel(); }, 200);
    }, 100);
  }

  if(soundBtn){
    soundBtn.addEventListener('click', unlockAudio);
  }
  
  // Desbloqueia também no primeiro toque no body (iPhone precisa)
  let unlocked = false;
  function unlockOnce(){
    if(unlocked) return;
    unlocked = true;
    unlockAudio();
    document.removeEventListener('touchstart', unlockOnce);
    document.removeEventListener('click', unlockOnce);
  }
  document.addEventListener('touchstart', unlockOnce, {once:true, passive:true});
  document.addEventListener('click', unlockOnce, {once:true});

  // Desbloqueia ao tocar no mic também
  if(micBtn){
    micBtn.addEventListener('touchstart', unlockAudio, {once:true, passive:true});
  }
})();
