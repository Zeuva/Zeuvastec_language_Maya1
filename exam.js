
// === SIMULADOS E CERTIFICADOS - Zeuvastec PRO ===
let currentExam = null;
let examTimer = null;

const examTypes = {
  module: {name: 'Simulado do Módulo', desc: '20 perguntas do módulo atual', count: 20},
  quick: {name: 'Simulado Rápido', desc: '24 perguntas variadas, sem repetição', count: 24},
  complete: {name: 'Simulado Completo', desc: '60 perguntas, do básico à fluência', count: 60},
  fluency: {name: 'Prova de Fluência', desc: '36 perguntas avançadas', count: 36}
};

function startExam(type, moduleId=null){
  let pool = [];
  if(type==='module' && moduleId){
    const modLessons = lessons.filter(l=>l.module===moduleId);
    modLessons.forEach(l=> l.quiz.forEach(q=> pool.push({...q, lessonTitle:l.title, module: l.module})));
    pool = pool.sort(()=>0.5-Math.random());
  } else if(window.generateSimuladoQuestions){
    // Banco curado: perguntas sempre variadas, sem repetição, cobrindo básico → avançado.
    const tiers = type==='fluency' ? ['avancado'] : type==='quick' ? ['basico','intermediario'] : ['basico','intermediario','avancado'];
    pool = window.generateSimuladoQuestions(tiers, examTypes[type].count);
  } else if(type==='fluency'){
    const fluLessons = lessons.filter(l=>l.module>=5);
    fluLessons.forEach(l=> l.quiz.forEach(q=> pool.push({...q, lessonTitle:l.title, module:l.module})));
    pool = pool.sort(()=>0.5-Math.random());
  } else {
    lessons.forEach(l=> l.quiz.forEach(q=> pool.push({...q, lessonTitle:l.title, module:l.module})));
    pool = pool.sort(()=>0.5-Math.random());
  }
  const count = examTypes[type].count;
  const questions = pool.slice(0, count);
  
  currentExam = {
    type, moduleId, questions,
    current: 0,
    answers: [],
    score: 0,
    startTime: Date.now()
  };
  
  // Show exam modal
  const modal = document.getElementById('exam-modal');
  if(modal){
    modal.classList.remove('hidden');
    modal.style.display='grid';
    renderExamQuestion();
    startExamTimer();
  }
  // Also update view if needed
  showView('learn');
}

function renderExamQuestion(){
  if(!currentExam) return;
  const q = currentExam.questions[currentExam.current];
  const total = currentExam.questions.length;
  const container = document.getElementById('exam-content');
  if(!container) return;
  
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <span style="font-size:11px;font-weight:700;letter-spacing:.1em;background:#e8f4d1;padding:6px 12px;border-radius:999px">SIMULADO · ${currentExam.type.toUpperCase()} · ${currentExam.current+1}/${total}</span>
      <span id="exam-timer" style="font-size:12px;font-weight:700;color:#dc2626">⏱️ 00:00</span>
    </div>
    <div style="height:6px;background:#e9e5da;border-radius:999px;margin-bottom:16px;overflow:hidden">
      <i style="display:block;height:100%;width:${(currentExam.current/total*100)}%;background:#276246;transition:width 0.3s"></i>
    </div>
    <p style="font-size:10px;color:#718078;margin:0">LIÇÃO: ${q.lessonTitle} · MÓDULO ${q.module}</p>
    <h3 style="font-size:18px;margin:8px 0 16px;font-weight:600">${q.q}</h3>
    <div style="display:grid;gap:10px">
      ${q.opts.map((opt,i)=>`<button class="option exam-option" data-ans="${i}" style="text-align:left;padding:14px;border:1.5px solid #e9e5da;border-radius:12px;background:#fff;cursor:pointer;transition:all 0.2s">${opt}</button>`).join('')}
    </div>
    <div id="exam-feedback" style="margin-top:16px"></div>
    <div style="display:flex;justify-content:space-between;margin-top:20px">
      <button id="exam-prev" class="tab" ${currentExam.current===0?'disabled':''}>← Anterior</button>
      <span style="font-size:12px;color:#718078">${currentExam.current+1} de ${total}</span>
      <button id="exam-next" class="tab" style="background:#276246;color:#fff" ${currentExam.current===total-1?'disabled':''}>Próxima →</button>
    </div>
  `;
  
  container.querySelectorAll('.exam-option').forEach(btn=>{
    btn.onclick = ()=>{
      const ans = parseInt(btn.dataset.ans);
      const correct = ans===q.ans;
      // Mark
      container.querySelectorAll('.exam-option').forEach(b=>{b.style.pointerEvents='none'; b.style.opacity='0.6';});
      btn.style.opacity='1';
      if(correct){
        btn.style.background='#e8f4d1'; btn.style.borderColor='#276246'; btn.style.color='#166534';
        currentExam.score++;
      } else {
        btn.style.background='#ffe4e6'; btn.style.borderColor='#dc2626';
        // Show correct
        const correctBtn = container.querySelector(`[data-ans="${q.ans}"]`);
        if(correctBtn){ correctBtn.style.background='#e8f4d1'; correctBtn.style.borderColor='#276246'; correctBtn.style.opacity='1'; }
      }
      currentExam.answers[currentExam.current]=ans;
      const fb = document.getElementById('exam-feedback');
      if(fb){
        fb.innerHTML = correct ? 
          `<div style="padding:12px;background:#e8f4d1;border-radius:10px;color:#166534"><strong>✅ Correto!</strong> ${q.opts[q.ans]}</div>` :
          `<div style="padding:12px;background:#ffe4e6;border-radius:10px;color:#991b1b"><strong>❌ Incorreto.</strong> Resposta: ${q.opts[q.ans]}<br><small style="color:#718078">Módulo ${q.module} · ${q.lessonTitle}</small></div>`;
      }
      // Auto next after delay
      setTimeout(()=>{
        if(currentExam.current < total-1){
          currentExam.current++;
          renderExamQuestion();
        } else {
          finishExam();
        }
      }, 1200);
    };
  });
  
  const prevBtn = document.getElementById('exam-prev');
  const nextBtn = document.getElementById('exam-next');
  if(prevBtn) prevBtn.onclick=()=>{ if(currentExam.current>0){ currentExam.current--; renderExamQuestion(); }};
  if(nextBtn) nextBtn.onclick=()=>{ if(currentExam.current<total-1){ currentExam.current++; renderExamQuestion(); }};
}

function startExamTimer(){
  if(examTimer) clearInterval(examTimer);
  examTimer = setInterval(()=>{
    if(!currentExam) return;
    const elapsed = Math.floor((Date.now()-currentExam.startTime)/1000);
    const m = String(Math.floor(elapsed/60)).padStart(2,'0');
    const s = String(elapsed%60).padStart(2,'0');
    const el = document.getElementById('exam-timer');
    if(el) el.textContent = `⏱️ ${m}:${s}`;
  },1000);
}

function finishExam(){
  if(examTimer) clearInterval(examTimer);
  const total = currentExam.questions.length;
  const score = currentExam.score;
  const pct = Math.round(score/total*100);
  const time = Math.floor((Date.now()-currentExam.startTime)/1000);
  const timeStr = `${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`;
  const passed = pct>=70;
  
  // Save exam history
  const history = JSON.parse(localStorage.getItem('zeuvastec-exams')||'[]');
  history.push({type: currentExam.type, moduleId: currentExam.moduleId, score, total, pct, time, date: new Date().toISOString()});
  localStorage.setItem('zeuvastec-exams', JSON.stringify(history));
  
  // Update points
  const earnedPoints = score*5 + (passed?50:0);
  points += earnedPoints;
  localStorage.setItem('zeuvastec-points', points.toString());
  const ptsEl = document.getElementById('points');
  if(ptsEl) ptsEl.textContent = points;
  
  const container = document.getElementById('exam-content');
  container.innerHTML = `
    <div style="text-align:center;padding:20px">
      <div style="width:80px;height:80px;border-radius:50%;background:${passed?'#e8f4d1':'#ffe4e6'};display:grid;place-items:center;margin:0 auto 16px;font-size:36px">${passed?'🎉':'📚'}</div>
      <h2 style="font-family:Fraunces;font-size:28px;margin:0">${passed?'Parabéns! Aprovado!':'Continue praticando!'}</h2>
      <p style="color:#718078;margin:8px 0">Simulado ${examTypes[currentExam.type].name}</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0">
        <div style="background:#f8f5ed;padding:16px;border-radius:12px"><strong style="font-size:24px;color:#276246">${score}/${total}</strong><br><small>acertos</small></div>
        <div style="background:#f8f5ed;padding:16px;border-radius:12px"><strong style="font-size:24px;color:${passed?'#276246':'#dc2626'}">${pct}%</strong><br><small>aproveitamento</small></div>
        <div style="background:#f8f5ed;padding:16px;border-radius:12px"><strong style="font-size:24px">${timeStr}</strong><br><small>tempo</small></div>
      </div>
      <div style="background:${passed?'#f5fae5':'#fff7ed'};border:1px solid ${passed?'#daebaf':'#fed7aa'};border-radius:12px;padding:16px;margin:16px 0;text-align:left">
        <strong>${passed?'🏆 Você foi aprovado!': '💪 Quase lá!'}</strong><br>
        <small style="color:#718078">Você acertou ${score} de ${total} perguntas. ${passed ? 'Você dominou este conteúdo!' : 'Precisa de 70% para aprovação. Revise as lições e tente novamente.'}</small><br>
        <small style="color:#276246;font-weight:700">+${earnedPoints} XP ganhos</small>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px">
        ${passed && currentExam.type==='module' ? `<button class="primary" onclick="generateCertificate(${currentExam.moduleId}, ${pct})">📜 Gerar Certificado</button>` : ''}
        <button class="primary" onclick="startExam('${currentExam.type}', ${currentExam.moduleId||'null'})">🔁 Refazer</button>
        <button class="tab" onclick="closeExam()">Fechar</button>
      </div>
    </div>
  `;
  
  if(passed){
    speakBilingual(`Congratulations! You scored ${pct} percent!`, `Parabéns! Você tirou ${pct} por cento!`);
  } else {
    speakPortuguese(`Você tirou ${pct} por cento. Continue praticando para melhorar!`);
  }
}

function closeExam(){
  const modal = document.getElementById('exam-modal');
  if(modal){ modal.classList.add('hidden'); modal.style.display='none'; }
  if(examTimer) clearInterval(examTimer);
  currentExam=null;
  renderLessons();
}

// Certificados
function generateCertificate(moduleId, pct){
  const studentName = localStorage.getItem('zeuvastec-student-name') || 'Aluno Zeuvastec';
  const moduleNames = {1:'Foundations',2:'Everyday Life',3:'Communication',4:'Work & Life',5:'Professional English',6:'Fluency Mastery'};
  const moduleName = moduleNames[moduleId] || `Módulo ${moduleId}`;
  const dateStr = new Date().toLocaleDateString('pt-BR', {day:'numeric', month:'long', year:'numeric'});
  
  // Create canvas certificate
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0,0,1200,800);
  // Border
  ctx.strokeStyle = '#276246';
  ctx.lineWidth = 8;
  ctx.strokeRect(20,20,1160,760);
  ctx.strokeStyle = '#d9f36a';
  ctx.lineWidth = 2;
  ctx.strokeRect(40,40,1120,720);
  // Header
  ctx.fillStyle = '#276246';
  ctx.fillRect(0,0,1200,140);
  ctx.fillStyle = '#d9f36a';
  ctx.font = 'bold 48px Fraunces, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Z', 80, 90);
  ctx.fillStyle = '#fffdf8';
  ctx.font = '700 32px DM Sans, sans-serif';
  ctx.fillText('Zeuvastec Language', 200, 70);
  ctx.font = '400 16px DM Sans, sans-serif';
  ctx.fillText('CERTIFICADO DE CONCLUSÃO', 200, 95);
  // Title
  ctx.fillStyle = '#24322c';
  ctx.font = '700 42px Fraunces, serif';
  ctx.fillText('CERTIFICADO', 600, 220);
  ctx.font = '400 20px DM Sans, sans-serif';
  ctx.fillStyle = '#718078';
  ctx.fillText(`Concedido a ${studentName}`, 600, 260);
  // Student name
  ctx.fillStyle = '#276246';
  ctx.font = '700 48px Fraunces, serif';
  ctx.fillText(studentName, 600, 320);
  // Module
  ctx.fillStyle = '#24322c';
  ctx.font = '600 24px DM Sans, sans-serif';
  ctx.fillText(`Por concluir o ${moduleName} - Módulo ${moduleId}`, 600, 380);
  ctx.font = '400 18px DM Sans, sans-serif';
  ctx.fillStyle = '#718078';
  ctx.fillText(`Com aproveitamento de ${pct}% - ${new Date().toLocaleDateString('pt-BR')}`, 600, 410);
  ctx.fillText(`Total de ${lessons.filter(l=>l.module===moduleId).length*12} perguntas respondidas`, 600, 435);
  // Footer
  ctx.fillStyle = '#276246';
  ctx.font = '700 16px DM Sans, sans-serif';
  ctx.fillText('Zeuvastec Language - Inglês todos os dias', 600, 600);
  ctx.font = '400 12px DM Sans, sans-serif';
  ctx.fillStyle = '#718078';
  ctx.fillText(`Certificado gerado em ${dateStr} · ID: ZEU-${moduleId}-${Date.now().toString().slice(-6)}`, 600, 625);
  // Signature line
  ctx.strokeStyle = '#e9e5da';
  ctx.beginPath(); ctx.moveTo(450, 700); ctx.lineTo(750, 700); ctx.stroke();
  ctx.fillStyle = '#24322c';
  ctx.font = '600 14px DM Sans, sans-serif';
  ctx.fillText('Equipe Zeuvastec Language', 600, 720);
  
  // Show certificate modal
  const certModal = document.getElementById('certificate-modal');
  if(certModal){
    certModal.classList.remove('hidden');
    certModal.style.display='grid';
    const img = document.getElementById('certificate-image');
    if(img) img.src = canvas.toDataURL('image/png');
    const downloadBtn = document.getElementById('download-certificate');
    if(downloadBtn){
      downloadBtn.onclick = ()=>{
        const link = document.createElement('a');
        link.download = `certificado-zeuvastec-modulo-${moduleId}-${studentName.replace(/\s+/g,'-').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
    }
  }
  
  // Save certificate
  const certs = JSON.parse(localStorage.getItem('zeuvastec-certificates')||'[]');
  certs.push({moduleId, moduleName, pct, date: new Date().toISOString(), studentName});
  localStorage.setItem('zeuvastec-certificates', JSON.stringify(certs));
  
  // Speak
  speakBilingual(`Congratulations! You earned a certificate for ${moduleName}!`, `Parabéns! Você ganhou um certificado de ${moduleName}!`);
}

function showCertificates(){
  const certs = JSON.parse(localStorage.getItem('zeuvastec-certificates')||'[]');
  const container = document.getElementById('certificates-list');
  if(!container) return;
  if(certs.length===0){
    container.innerHTML = `<p style="color:#718078;text-align:center;padding:20px">Nenhum certificado ainda. Complete um simulado de módulo com 70% para gerar seu primeiro certificado! 🎓</p>`;
    return;
  }
  container.innerHTML = certs.map(c=>`
    <div style="background:#fffdf8;border:1px solid #e9e5da;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <strong>📜 ${c.moduleName} - Módulo ${c.moduleId}</strong><br>
        <small style="color:#718078">${new Date(c.date).toLocaleDateString('pt-BR')} · ${c.pct}% · ${c.studentName}</small>
      </div>
      <button class="tab" onclick="generateCertificate(${c.moduleId}, ${c.pct})">Ver</button>
    </div>
  `).join('');
}
