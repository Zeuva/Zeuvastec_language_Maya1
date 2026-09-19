
// VOICE FIX - EN vs PT separado, mantendo microfone funcionando
// A Maya é a única personagem do app — a voz precisa ser sempre feminina.
// A Web Speech API não expõe o gênero da voz diretamente, então usamos o
// nome da voz (nomes conhecidos de vozes masculinas comuns em Windows,
// Chrome, macOS/iOS) para NUNCA escolher uma delas quando existir alguma
// alternativa feminina disponível no navegador (2026-09-17).
const NOMES_VOZ_MASCULINA=['david','guy','daniel','alex','mark','george','ryan','fred','tom','oliver','arthur','eric','thiago','antonio','felipe','ricardo','daniel'];
function pareceVozMasculina(v){ const n=(v.name||'').toLowerCase(); return NOMES_VOZ_MASCULINA.some(m=>n.includes(m)); }
let voiceCacheFix={en:[],pt:[]}; let vReady=false;
function refreshVFix(){ try{ const all=speechSynthesis.getVoices(); if(!all.length) return; vReady=true; voiceCacheFix.en=all.filter(v=>v.lang.toLowerCase().startsWith('en')); voiceCacheFix.pt=all.filter(v=>v.lang.toLowerCase().startsWith('pt')); voiceCacheFix.en.sort((a,b)=>{ const aS=(a.lang==='en-US'?10:0)+(a.name.includes('Google')?5:0)+(pareceVozMasculina(a)?-100:0); const bS=(b.lang==='en-US'?10:0)+(b.name.includes('Google')?5:0)+(pareceVozMasculina(b)?-100:0); return bS-aS; }); voiceCacheFix.pt.sort((a,b)=>{ const aS=(a.lang==='pt-BR'?10:0)+(a.name.includes('Google')?5:0)+(pareceVozMasculina(a)?-100:0); const bS=(b.lang==='pt-BR'?10:0)+(b.name.includes('Google')?5:0)+(pareceVozMasculina(b)?-100:0); return bS-aS; }); }catch(e){} }
refreshVFix(); if(speechSynthesis.onvoiceschanged!==undefined){ speechSynthesis.onvoiceschanged=refreshVFix; setTimeout(refreshVFix,500); setTimeout(refreshVFix,1500); }
function getENFix(){ if(!vReady) refreshVFix(); return voiceCacheFix.en.find(v=>v.lang==='en-US')||voiceCacheFix.en[0]||null; }
function getPTFix(){ if(!vReady) refreshVFix(); return voiceCacheFix.pt.find(v=>v.lang==='pt-BR')||voiceCacheFix.pt[0]||null; }
// A Maya deve mexer a boca enquanto fala, igual no Zeuvastec Assistente de
// IA (2026-09-17). O navegador não dá os fonemas exatos do áudio, mas o
// evento "boundary" da própria fala marca cada palavra em tempo real —
// usamos isso para alternar formatos de boca (visemas) no avatar 3D via
// eventos globais, que o maya-3d.js escuta (sem acoplar os dois arquivos).
let contadorFalas=0;
function anexarEventosDeFala(u){
  // Cada fala tem um id: o fim de uma fala antiga (cancelada) não pode
  // fechar a boca de uma fala nova (ver maya-3d.js). O início leva o texto,
  // o idioma e a velocidade pra o avatar montar a linha do tempo labial.
  const id=++contadorFalas;
  window.dispatchEvent(new CustomEvent('maya-speaking-start',{detail:{id, text:u.text||'', lang:u.lang||'', rate:u.rate||1}}));
  u.onboundary=(ev)=>{
    // charIndex = onde a palavra começa no texto; o avatar ressincroniza a
    // boca nessa palavra e aprende o ritmo real da voz.
    window.dispatchEvent(new CustomEvent('maya-speaking-boundary',{detail:{charIndex: typeof ev?.charIndex==='number' ? ev.charIndex : null}}));
  };
  let jaTerminou=false;
  function terminar(){
    if (jaTerminou) return;
    jaTerminou=true;
    if (seguranca) clearTimeout(seguranca);
    window.dispatchEvent(new CustomEvent('maya-speaking-end',{detail:{id}}));
  }
  // Rede de segurança (2026-09-18): em alguns navegadores/celulares (relatado
  // no iPhone) o "onend" da fala às vezes nunca dispara — a Maya nem chega a
  // falar de verdade (sem áudio), mas a boca fica se mexendo pra sempre
  // porque o evento de "parou de falar" nunca chega. Um tempo máximo,
  // calculado pelo tamanho do texto (bem folgado), garante que a boca sempre
  // feche, mesmo se o navegador nunca avisar que a fala terminou.
  const tempoMaximoMs=Math.min(20000, Math.max(4000, (u.text||'').length*150));
  const seguranca=setTimeout(terminar, tempoMaximoMs);
  const onendOriginal=u.onend;
  u.onend=(...args)=>{ terminar(); if(onendOriginal) onendOriginal(...args); };
  const onerrorOriginal=u.onerror;
  u.onerror=(...args)=>{ terminar(); if(onerrorOriginal) onerrorOriginal(...args); };
}
function speakENFix(t,r=0.9,o){ if(!t) return; if(typeof soundOn!=='undefined' && !soundOn) return; speechSynthesis.cancel(); setTimeout(()=>{ const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=r; const v=getENFix(); if(v) u.voice=v; if(o) u.onend=o; anexarEventosDeFala(u); speechSynthesis.speak(u); },80); }
function speakPTFix(t,r=1,o){ if(!t) return; if(typeof soundOn!=='undefined' && !soundOn) return; const isPureEN=/^[A-Za-z0-9 .,!?'"-]+$/.test(t) && !/[áàâãéêíóôõúç]/.test(t) && /\b(hello|my name|I am|would like|coffee|please|thank you|good morning|how are you|welcome to the café|what would you like)\b/i.test(t); if(isPureEN){ speakENFix(t,r,o); return; } speechSynthesis.cancel(); setTimeout(()=>{ const u=new SpeechSynthesisUtterance(t); u.lang='pt-BR'; u.rate=r; const v=getPTFix(); if(v) u.voice=v; if(o) u.onend=o; anexarEventosDeFala(u); speechSynthesis.speak(u); },80); }
window.speakEnglish=speakENFix; window.speakPortuguese=speakPTFix; window.speakBilingual=(en,pt)=>{ speakENFix(en,0.9,()=>{ setTimeout(()=> speakPTFix(pt,1.0),600); }); }; function speakSlowFix(t){ speakENFix(t,0.55); } window.speakSlow=speakSlowFix;

/* Guided speaking exercise: several conversation scenarios per level, checks a spoken answer, corrects it, and moves ahead. */
(function () {
  const dialogue = document.getElementById('dialogue');
  const mic = document.getElementById('mic-button');
  const status = document.getElementById('voice-status');
  const help = document.getElementById('mic-help');
  if (!dialogue || !mic) return;

  const levelNames = { basic: 'Básico', intermediate: 'Intermediário', advanced: 'Avançado' };
  const scenarioNames = {
    basic: { cafe: 'Café', apresentacoes: 'Apresentações', rotina: 'Rotina diária' },
    intermediate: { fimDeSemana: 'Fim de semana', trabalho: 'Trabalho', viagens: 'Viagens' },
    advanced: { sociedade: 'Sociedade', lideranca: 'Liderança', tecnologia: 'Tecnologia' }
  };

  const courses = {
    basic: {
      cafe: [
        { question: 'Hi! Welcome to the café. What would you like to drink?', example: 'I would like a coffee, please.', check: (t) => /\b(coffee|tea|water|juice|soda)\b/.test(t) },
        { question: 'Would you like something to eat too?', example: 'Yes, I would like a sandwich.', check: (t) => /\b(yes|no|sandwich|cake|cookie|toast)\b/.test(t) },
        { question: 'For here or to go?', example: 'For here, please.', check: (t) => /\b(for here|to go|here|go)\b/.test(t) },
        { question: 'That will be five dollars. How would you like to pay?', example: 'I will pay with card.', check: (t) => /\b(card|cash|pay)\b/.test(t) },
        { question: 'Here you go! Enjoy your coffee.', example: 'Thank you very much!', check: (t) => /\b(thank you|thanks)\b/.test(t) },
        { question: 'Would you like a receipt?', example: 'No, that is fine, thank you.', check: (t) => /\b(yes|no|receipt|fine)\b/.test(t) },
        { question: 'Do you need anything else?', example: 'No, that is all for now.', check: (t) => /\b(yes|no|that is all|else|nothing)\b/.test(t) },
        { question: 'Have a great day! Come back soon.', example: 'I will, thank you! Goodbye.', check: (t) => /\b(thank you|goodbye|bye|will)\b/.test(t) }
      ],
      apresentacoes: [
        { question: 'Hello! What is your name?', example: 'My name is Elise.', check: (t) => /\b(my name is|i am|i'm)\b/.test(t) },
        { question: 'Nice to meet you! Where are you from?', example: 'I am from Brazil.', check: (t) => /\b(i am from|i'm from|from)\b/.test(t) },
        { question: 'How old are you?', example: 'I am twenty years old.', check: (t) => /\b(i am|i'm)\b.*\b(years old|year old)\b/.test(t) },
        { question: 'What do you do? Do you work or study?', example: 'I work as a teacher.', check: (t) => /\b(i work|i study|teacher|student)\b/.test(t) },
        { question: 'It was great talking to you! Can you say goodbye?', example: 'Goodbye! See you soon.', check: (t) => /\b(goodbye|bye|see you)\b/.test(t) },
        { question: 'Do you have any brothers or sisters?', example: 'Yes, I have one sister.', check: (t) => /\b(yes|no|brother|sister)\b/.test(t) },
        { question: 'What do you like to do in your free time?', example: 'I like to read books.', check: (t) => /\b(i like|i enjoy|free time)\b/.test(t) },
        { question: 'It was a pleasure talking with you today!', example: 'The pleasure was mine!', check: (t) => /\b(pleasure|thank you|nice)\b/.test(t) }
      ],
      rotina: [
        { question: 'What time do you wake up every day?', example: 'I wake up at seven o\'clock.', check: (t) => /\b(i wake up|wake up|o'clock|seven|eight)\b/.test(t) },
        { question: 'What do you do every morning?', example: 'I have breakfast and go to work.', check: (t) => /\b(i |i'm).*(breakfast|work|school|study|wake up)\b/.test(t) },
        { question: 'Do you like learning English?', example: 'Yes, I do. I like learning English.', check: (t) => /\b(yes|i like|i love)\b/.test(t) },
        { question: 'What is your favorite food?', example: 'My favorite food is pizza.', check: (t) => /\b(my favorite|pizza|rice|pasta|food is)\b/.test(t) },
        { question: 'What do you usually do on weekends?', example: 'I usually relax and watch movies.', check: (t) => /\b(i usually|weekend|relax|watch)\b/.test(t) },
        { question: 'What do you usually have for lunch?', example: 'I usually have rice and chicken.', check: (t) => /\b(i usually|lunch|rice|chicken|food)\b/.test(t) },
        { question: 'What time do you go to bed?', example: 'I go to bed at ten o\'clock.', check: (t) => /\b(i go to bed|bed|o'clock|ten|eleven)\b/.test(t) },
        { question: 'Thanks for sharing your routine with me!', example: 'You are welcome, it was fun!', check: (t) => /\b(you are welcome|welcome|fun|thank)\b/.test(t) }
      ]
    },
    intermediate: {
      fimDeSemana: [
        { question: 'What did you do last weekend?', example: 'I went to the beach with my friends.', check: (t) => /\b(i went|i visited|i watched|i stayed|i had)\b/.test(t) },
        { question: 'Why did you enjoy it?', example: 'Because the weather was beautiful.', check: (t) => /\b(because|it was|i really)\b/.test(t) },
        { question: 'What are you going to do next weekend?', example: 'I am going to visit my family.', check: (t) => /\b(going to|i will|i'm planning)\b/.test(t) },
        { question: 'Tell me about a movie you enjoyed recently.', example: 'I watched a movie that was very funny.', check: (t) => /\b(i watched|movie|film|i enjoyed)\b/.test(t) },
        { question: 'Describe your hometown in one sentence.', example: 'My hometown is small but very welcoming.', check: (t) => /\b(my hometown|my city|it is)\b/.test(t) },
        { question: 'Who did you spend the weekend with?', example: 'I spent it with my close friends.', check: (t) => /\b(i spent|with my|friends|family|alone)\b/.test(t) },
        { question: 'Did anything unexpected happen?', example: 'Yes, it started raining during our picnic.', check: (t) => /\b(yes|no|happened|unexpected)\b/.test(t) },
        { question: 'What would make your next weekend even better?', example: 'Spending more time outdoors would be great.', check: (t) => /\b(would|better|more time|outdoors)\b/.test(t) }
      ],
      trabalho: [
        { question: 'What do you do for work?', example: 'I work as a project manager.', check: (t) => /\b(i work|i'm a|manager|teacher|engineer|designer)\b/.test(t) },
        { question: 'What is the most challenging part of your job?', example: 'The most challenging part is managing deadlines.', check: (t) => /\b(challenging|difficult|deadline|hard)\b/.test(t) },
        { question: 'How do you balance work and personal life?', example: 'I try to plan my time carefully.', check: (t) => /\b(i try|i plan|balance|time)\b/.test(t) },
        { question: 'What skill would you like to improve at work?', example: 'I would like to improve my English pronunciation.', check: (t) => /\b(i would like|i want|improve)\b/.test(t) },
        { question: 'What is important for a good friendship at work?', example: 'A good friendship needs trust and honesty.', check: (t) => /\b(trust|honesty|friendship|important)\b/.test(t) },
        { question: 'How do you usually start your workday?', example: 'I usually check my emails first.', check: (t) => /\b(i usually|check|start|first)\b/.test(t) },
        { question: 'What motivates you at work?', example: 'Learning new things motivates me the most.', check: (t) => /\b(motivat|learning|challenge)\b/.test(t) },
        { question: 'Where do you see yourself in five years?', example: 'I see myself leading a bigger team.', check: (t) => /\b(i see myself|in five years|future|leading)\b/.test(t) }
      ],
      viagens: [
        { question: 'What is your favorite place to travel?', example: 'My favorite place is Portugal.', check: (t) => /\b(my favorite|i like|i love|portugal|place)\b/.test(t) },
        { question: 'What would you do if you had a free day to travel?', example: 'I would travel and spend time with my family.', check: (t) => /\b(i would|i'd)\b/.test(t) },
        { question: 'What do you usually pack for a trip?', example: 'I usually pack clothes, a camera, and my passport.', check: (t) => /\b(i pack|clothes|passport|camera|bag)\b/.test(t) },
        { question: 'Have you experienced a different culture while traveling?', example: 'Yes, I tried new food and learned new customs.', check: (t) => /\b(yes|no|culture|food|custom)\b/.test(t) },
        { question: 'What skill would help you travel more confidently?', example: 'Speaking English fluently would help a lot.', check: (t) => /\b(speaking|english|help|confiden)\b/.test(t) },
        { question: 'What is the best meal you have had while traveling?', example: 'The best meal was fresh seafood in Portugal.', check: (t) => /\b(best meal|food|ate|seafood)\b/.test(t) },
        { question: 'Do you prefer traveling alone or with others?', example: 'I prefer traveling with close friends.', check: (t) => /\b(prefer|alone|with|friends|family)\b/.test(t) },
        { question: 'What is the next place on your travel list?', example: 'Japan is the next place on my list.', check: (t) => /\b(next|travel list|place|japan|country)\b/.test(t) }
      ]
    },
    advanced: {
      sociedade: [
        { question: 'What is one change that would improve your city?', example: 'I believe better public transportation would reduce traffic.', check: (t) => /\b(i believe|in my opinion|would|should)\b/.test(t) },
        { question: 'Can you explain why this change matters?', example: 'It would make commuting safer and more efficient.', check: (t) => /\b(because|would|therefore|this means)\b/.test(t) },
        { question: 'How could the city make this idea happen?', example: 'The city could invest in reliable buses and train lines.', check: (t) => /\b(could|should|by |invest|create)\b/.test(t) },
        { question: 'Do you think citizens should be more involved in local decisions?', example: 'Yes, citizen participation leads to better decisions.', check: (t) => /\b(yes|no|citizen|participation|involve)\b/.test(t) },
        { question: 'What is a policy you would like to see in your country?', example: 'I would like to see more investment in public education.', check: (t) => /\b(i would like|policy|investment|education)\b/.test(t) },
        { question: 'What role does technology play in solving urban problems?', example: 'Technology can make services more efficient and accessible.', check: (t) => /\b(technology|efficient|access|role)\b/.test(t) },
        { question: 'How can inequality be reduced in your community?', example: 'Better access to education would help reduce inequality.', check: (t) => /\b(inequality|education|reduce|access)\b/.test(t) },
        { question: 'What long-term impact would this change bring?', example: 'It would create a more sustainable and fair society.', check: (t) => /\b(long-term|impact|sustainable|society)\b/.test(t) }
      ],
      lideranca: [
        { question: 'How do you handle a disagreement at work?', example: 'I listen carefully and try to find common ground.', check: (t) => /\b(i listen|i try|common ground|disagreement)\b/.test(t) },
        { question: 'What makes a leader effective?', example: 'An effective leader communicates clearly and empowers the team.', check: (t) => /\b(leader|communicat|team|effective)\b/.test(t) },
        { question: 'How would you defend an important decision?', example: 'I would present evidence and explain the expected results.', check: (t) => /\b(i would|evidence|because|explain)\b/.test(t) },
        { question: 'How do you motivate a team that is losing focus?', example: 'I would set clear goals and celebrate small wins.', check: (t) => /\b(i would|motivate|goal|celebrate)\b/.test(t) },
        { question: 'How do you usually respond to feedback?', example: 'I try to stay open-minded and learn from it.', check: (t) => /\b(i try|feedback|open|learn)\b/.test(t) },
        { question: 'How do you build trust within a team?', example: 'I build trust through consistency and honesty.', check: (t) => /\b(trust|consisten|honest|build)\b/.test(t) },
        { question: 'How do you handle failure as a leader?', example: 'I try to learn from it and adjust quickly.', check: (t) => /\b(failure|learn|adjust|mistake)\b/.test(t) },
        { question: 'What legacy do you want to leave as a leader?', example: 'I want to leave a culture of growth and respect.', check: (t) => /\b(legacy|culture|growth|respect)\b/.test(t) }
      ],
      tecnologia: [
        { question: 'What are the benefits and risks of technology?', example: 'Technology improves access to information, but it can affect privacy.', check: (t) => /\b(technology|benefit|risk|but|however)\b/.test(t) },
        { question: 'How do you think artificial intelligence will change jobs?', example: 'It will automate routine tasks but create new opportunities.', check: (t) => /\b(automat|job|opportunit|artificial|change)\b/.test(t) },
        { question: 'Are you concerned about online privacy?', example: 'Yes, I try to protect my personal information carefully.', check: (t) => /\b(yes|no|privacy|protect|information)\b/.test(t) },
        { question: 'What is a goal you have for the future?', example: 'My long-term goal is to become fluent in English.', check: (t) => /\b(my goal|i want|i plan|future|long-term)\b/.test(t) },
        { question: 'Why is lifelong learning important today?', example: 'Because technology changes quickly and skills need updating.', check: (t) => /\b(because|important|learning|skill|change)\b/.test(t) },
        { question: 'How do you stay updated with new technology?', example: 'I read articles and take online courses regularly.', check: (t) => /\b(read|course|updated|regularly)\b/.test(t) },
        { question: 'What technology could you not live without?', example: 'I could not live without my smartphone.', check: (t) => /\b(could not|can't live without|smartphone|technology)\b/.test(t) },
        { question: 'What is your prediction for technology in ten years?', example: 'I predict artificial intelligence will be part of daily life.', check: (t) => /\b(predict|ten years|future|artificial intelligence)\b/.test(t) }
      ]
    }
  };

  const translations = {
    basic: {
      cafe: [
        ['Oi! Bem-vindo(a) ao café. O que você gostaria de beber?', 'Eu gostaria de um café, por favor.'],
        ['Você gostaria de comer algo também?', 'Sim, eu gostaria de um sanduíche.'],
        ['Para consumir aqui ou para levar?', 'Para consumir aqui, por favor.'],
        ['Serão cinco dólares. Como você gostaria de pagar?', 'Eu vou pagar com cartão.'],
        ['Aqui está! Aproveite o seu café.', 'Muito obrigado(a)!'],
        ['Você gostaria do recibo?', 'Não, tudo bem, obrigado(a).'],
        ['Precisa de mais alguma coisa?', 'Não, é só isso por agora.'],
        ['Tenha um ótimo dia! Volte logo.', 'Vou sim, obrigado(a)! Tchau.']
      ],
      apresentacoes: [
        ['Olá! Qual é o seu nome?', 'Meu nome é Elise.'],
        ['Prazer em conhecer você! De onde você é?', 'Eu sou do Brasil.'],
        ['Quantos anos você tem?', 'Eu tenho vinte anos.'],
        ['O que você faz? Você trabalha ou estuda?', 'Eu trabalho como professor(a).'],
        ['Foi ótimo falar com você! Você pode se despedir?', 'Tchau! Até logo.'],
        ['Você tem irmãos ou irmãs?', 'Sim, eu tenho uma irmã.'],
        ['O que você gosta de fazer no tempo livre?', 'Eu gosto de ler livros.'],
        ['Foi um prazer conversar com você hoje!', 'O prazer foi todo meu!']
      ],
      rotina: [
        ['A que horas você acorda todos os dias?', 'Eu acordo às sete horas.'],
        ['O que você faz todas as manhãs?', 'Eu tomo café da manhã e vou trabalhar.'],
        ['Você gosta de aprender inglês?', 'Sim, gosto. Eu gosto de aprender inglês.'],
        ['Qual é a sua comida favorita?', 'Minha comida favorita é pizza.'],
        ['O que você costuma fazer nos fins de semana?', 'Eu costumo relaxar e assistir a filmes.'],
        ['O que você costuma almoçar?', 'Eu costumo comer arroz e frango.'],
        ['A que horas você vai dormir?', 'Eu vou dormir às dez horas.'],
        ['Obrigado por compartilhar sua rotina comigo!', 'De nada, foi divertido!']
      ]
    },
    intermediate: {
      fimDeSemana: [
        ['O que você fez no último fim de semana?', 'Eu fui à praia com meus amigos.'],
        ['Por que você gostou?', 'Porque o tempo estava bonito.'],
        ['O que você vai fazer no próximo fim de semana?', 'Eu vou visitar a minha família.'],
        ['Conte sobre um filme de que gostou recentemente.', 'Assisti a um filme que era muito engraçado.'],
        ['Descreva sua cidade natal em uma frase.', 'Minha cidade natal é pequena, mas muito acolhedora.'],
        ['Com quem você passou o fim de semana?', 'Eu passei com meus amigos próximos.'],
        ['Aconteceu algo inesperado?', 'Sim, começou a chover durante o nosso piquenique.'],
        ['O que tornaria o próximo fim de semana ainda melhor?', 'Passar mais tempo ao ar livre seria ótimo.']
      ],
      trabalho: [
        ['O que você faz no trabalho?', 'Eu trabalho como gerente de projetos.'],
        ['Qual é a parte mais desafiadora do seu trabalho?', 'A parte mais desafiadora é administrar prazos.'],
        ['Como você equilibra trabalho e vida pessoal?', 'Eu tento planejar meu tempo com cuidado.'],
        ['Que habilidade você gostaria de melhorar no trabalho?', 'Eu gostaria de melhorar minha pronúncia em inglês.'],
        ['O que é importante para uma boa amizade no trabalho?', 'Uma boa amizade precisa de confiança e honestidade.'],
        ['Como você costuma começar seu dia de trabalho?', 'Eu costumo checar meus e-mails primeiro.'],
        ['O que te motiva no trabalho?', 'Aprender coisas novas é o que mais me motiva.'],
        ['Onde você se vê daqui a cinco anos?', 'Eu me vejo liderando uma equipe maior.']
      ],
      viagens: [
        ['Qual é o seu lugar favorito para viajar?', 'Meu lugar favorito é Portugal.'],
        ['O que você faria se tivesse um dia livre para viajar?', 'Eu viajaria e passaria tempo com minha família.'],
        ['O que você costuma levar em uma viagem?', 'Eu costumo levar roupas, uma câmera e meu passaporte.'],
        ['Você já vivenciou uma cultura diferente ao viajar?', 'Sim, eu experimentei comidas novas e aprendi costumes novos.'],
        ['Que habilidade ajudaria você a viajar com mais confiança?', 'Falar inglês fluentemente ajudaria muito.'],
        ['Qual foi a melhor refeição que você já teve viajando?', 'A melhor refeição foi um frutos do mar fresco em Portugal.'],
        ['Você prefere viajar sozinho(a) ou acompanhado(a)?', 'Eu prefiro viajar com amigos próximos.'],
        ['Qual é o próximo lugar na sua lista de viagens?', 'O Japão é o próximo lugar da minha lista.']
      ]
    },
    advanced: {
      sociedade: [
        ['Qual mudança melhoraria a sua cidade?', 'Eu acredito que um transporte público melhor reduziria o trânsito.'],
        ['Você pode explicar por que essa mudança importa?', 'Ela tornaria o deslocamento mais seguro e eficiente.'],
        ['Como a cidade poderia tornar essa ideia realidade?', 'A cidade poderia investir em ônibus e linhas de trem confiáveis.'],
        ['Você acha que os cidadãos deveriam se envolver mais nas decisões locais?', 'Sim, a participação dos cidadãos leva a decisões melhores.'],
        ['Que política você gostaria de ver em seu país?', 'Eu gostaria de ver mais investimento na educação pública.'],
        ['Qual é o papel da tecnologia na solução de problemas urbanos?', 'A tecnologia pode tornar os serviços mais eficientes e acessíveis.'],
        ['Como a desigualdade pode ser reduzida na sua comunidade?', 'Um melhor acesso à educação ajudaria a reduzir a desigualdade.'],
        ['Que impacto de longo prazo essa mudança traria?', 'Ela criaria uma sociedade mais sustentável e justa.']
      ],
      lideranca: [
        ['Como você lida com uma discordância no trabalho?', 'Eu escuto com atenção e tento encontrar um ponto em comum.'],
        ['O que torna um líder eficaz?', 'Um líder eficaz se comunica com clareza e fortalece a equipe.'],
        ['Como você defenderia uma decisão importante?', 'Eu apresentaria evidências e explicaria os resultados esperados.'],
        ['Como você motivaria uma equipe que está perdendo o foco?', 'Eu definiria metas claras e celebraria pequenas conquistas.'],
        ['Como você costuma reagir a um feedback?', 'Eu tento manter a mente aberta e aprender com isso.'],
        ['Como você constrói confiança dentro de uma equipe?', 'Eu construo confiança através de consistência e honestidade.'],
        ['Como você lida com o fracasso como líder?', 'Eu tento aprender com isso e me ajustar rapidamente.'],
        ['Que legado você quer deixar como líder?', 'Eu quero deixar uma cultura de crescimento e respeito.']
      ],
      tecnologia: [
        ['Quais são os benefícios e riscos da tecnologia?', 'A tecnologia melhora o acesso à informação, mas pode afetar a privacidade.'],
        ['Como você acha que a inteligência artificial vai mudar os empregos?', 'Ela vai automatizar tarefas rotineiras, mas criar novas oportunidades.'],
        ['Você se preocupa com a privacidade online?', 'Sim, eu tento proteger minhas informações pessoais com cuidado.'],
        ['Qual é uma meta que você tem para o futuro?', 'Minha meta de longo prazo é ser fluente em inglês.'],
        ['Por que aprender ao longo da vida é importante hoje?', 'Porque a tecnologia muda rapidamente e as habilidades precisam ser atualizadas.'],
        ['Como você se mantém atualizado com novas tecnologias?', 'Eu leio artigos e faço cursos on-line regularmente.'],
        ['Sem qual tecnologia você não conseguiria viver?', 'Eu não conseguiria viver sem o meu smartphone.'],
        ['Qual é a sua previsão para a tecnologia daqui a dez anos?', 'Eu prevejo que a inteligência artificial fará parte do dia a dia.']
      ]
    }
  };

  // O elogio fica no final da frase para não parecer que o tutor
  // está avaliando antes de terminar o comentário.
  const praises = [
    'That was very clear. Excellent!',
    'That was a great sentence. Perfect!',
    'Your English sounds natural. Nice job!',
    'Let\'s keep going. Well done!',
    'You are improving fast. Great answer!',
    'That sounded very natural. Awesome!'
  ];
  const correctionOpeners = [
    'Almost! Try saying:',
    'Close! You could say:',
    'Good try! A natural way to say it:',
    'Nice effort! Here is another way:'
  ];
  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  const positiveReactions = ['That sounds great!', 'Nice, I like that!', 'Wonderful, thanks for sharing!', 'That is lovely to hear!'];
  const negativeReactions = ['I understand.', 'Thanks for being honest.', 'That makes sense.', 'I hear you.'];
  const neutralReactions = ['Interesting!', 'Got it, thank you!', 'I see, thanks for sharing that.', 'Good to know!'];
  function reactToAnswer(text) {
    const t = text.toLowerCase();
    if (/\b(yes|i do|i love|i like|great|happy|excited|amazing|wonderful|good)\b/.test(t)) return pickRandom(positiveReactions);
    if (/\b(no|not|don't|never|difficult|hard|tired|sad|worried|bad)\b/.test(t)) return pickRandom(negativeReactions);
    return pickRandom(neutralReactions);
  }

  let activeLevel = 'basic';
  let activeScenario = 'cafe';
  let steps = courses.basic.cafe;
  let currentStep = 0;
  let attemptsThisQuestion = 0;
  let sessionStats = { firstTryCorrect: 0, reviewPhrases: [] };
  let aiChatActive = false;
  let aiHistory = [];
  // Controla se a conversa deve continuar falando/ouvindo. Vira false ao sair
  // da tela "Conversar" (pedido do usuário: a Maya não pode continuar
  // falando sozinha depois que o aluno já foi pra outra tela) e volta a true
  // só quando o aluno entra em "Conversar" de novo.
  let conversaAtiva = true;

  // --- Integração opcional com IA (backend próprio) ---
  // Por segurança, a chave de API nunca pode ficar no código do app (client-side).
  // Se você tiver um backend/proxy seu que encaminhe para uma IA (ex: Anthropic API),
  // configure a URL dele aqui e o tutor passa a responder livremente após cada cenário:
  //   window.ZEUVASTEC_AI_ENDPOINT = 'https://SEU-BACKEND.com/tutor-chat';
  // O endpoint recebe { level, scenario, history, message } e deve responder { reply: '...' }.
  // Sem essa configuração, o app funciona normalmente com as conversas roteirizadas.
  async function aiRespond(userText) {
    try {
      const res = await fetch(window.ZEUVASTEC_AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: activeLevel,
          scenario: scenarioNames[activeLevel][activeScenario],
          history: aiHistory,
          message: userText
        })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data && data.reply ? data.reply : null;
    } catch (error) {
      return null;
    }
  }

  async function assessWithAI(transcript) {
    message(transcript, 'user');
    aiHistory.push({ role: 'user', text: transcript });
    status.textContent = 'Pensando…';
    const reply = await aiRespond(transcript);
    if (!reply) {
      const fallback = 'Sorry, I could not reach the AI tutor right now. Let us continue practicing another scenario!';
      message(fallback, 'tutor');
      say(fallback);
      status.textContent = 'IA indisponível';
      aiChatActive = false;
      return;
    }
    aiHistory.push({ role: 'tutor', text: reply });
    message(reply, 'tutor');
    say(reply, () => maybeAutoListen(400));
    status.textContent = 'Modo IA ✦ conversa livre';
    help.textContent = 'Continue a conversa livremente, o tutor com IA vai responder ao que você disser.';
  }

  const scenarioBtn = document.getElementById('scenario-button');

  function scenarioKeys(level) { return Object.keys(scenarioNames[level]); }

  function updateScenarioButton() {
    if (scenarioBtn) scenarioBtn.textContent = `Cenário: ${scenarioNames[activeLevel][activeScenario]} ▾`;
  }
  updateScenarioButton();

  function loadScenario(level, scenario, announce) {
    activeLevel = level;
    activeScenario = scenario;
    steps = courses[level][scenario];
    currentStep = 0;
    attemptsThisQuestion = 0;
    sessionStats = { firstTryCorrect: 0, reviewPhrases: [] };
    aiChatActive = false;
    aiHistory = [];
    dialogue.innerHTML = '';
    updateScenarioButton();
    status.textContent = `🔵 ADQUIRIR · ${levelNames[level]} · ${scenarioNames[level][scenario]}`;
    if (announce) runAcquirePhase(level, scenario);
  }

  // Fase 1 do ciclo ADQUIRIR → PRATICAR → AJUSTAR: uma prévia bilíngue
  // de 3 frases-chave antes de começar a prática, como "input" antes do "output".
  function runAcquirePhase(level, scenario) {
    const intro = `${levelNames[level]}, ${scenarioNames[level][scenario]}. Let's start by acquiring a few key phrases.`;
    message(intro, 'tutor');
    help.textContent = 'Fase 1 de 3 — ADQUIRIR: ouça e associe estas frases-chave antes de praticar.';
    const previewSteps = courses[level][scenario].slice(0, 3);
    const previewTranslations = translations[level][scenario].slice(0, 3);
    say(intro, () => {
      let i = 0;
      function showNext() {
        if (i >= previewSteps.length) {
          window.setTimeout(() => startPractice(level, scenario), 400);
          return;
        }
        const phrase = previewSteps[i].example;
        const pt = previewTranslations[i][1];
        message(`${phrase} — ${pt}`, 'tutor');
        say(phrase, () => window.setTimeout(showNext, 700));
        i += 1;
      }
      showNext();
    });
  }

  function startPractice(level, scenario) {
    status.textContent = `🟢 PRATICAR · ${scenarioNames[level][scenario]} · pergunta 1 de ${steps.length}`;
    const bridge = "Great! Now let's practice. I'll ask you questions, just answer naturally.";
    message(bridge, 'tutor');
    say(bridge, askNext);
  }

  document.querySelectorAll('.level-choice').forEach((button) => {
    button.addEventListener('click', () => {
      const level = button.dataset.level;
      document.querySelectorAll('.level-choice').forEach((item) => item.classList.toggle('active', item === button));
      loadScenario(level, scenarioKeys(level)[0], true);
    });
  });

  if (scenarioBtn) {
    scenarioBtn.addEventListener('click', () => {
      const keys = scenarioKeys(activeLevel);
      const idx = keys.indexOf(activeScenario);
      const next = keys[(idx + 1) % keys.length];
      loadScenario(activeLevel, next, true);
    });
  }

  // A Maya precisa parecer que está realmente falando, não uma foto parada:
  // um aro pulsa ao redor do avatar grande enquanto o áudio toca.
  const mayaAvatarBig = document.getElementById('maya-avatar-big');
  function setMayaSpeaking(falando) {
    if (mayaAvatarBig) mayaAvatarBig.classList.toggle('speaking', !!falando);
  }
  function say(text, afterSpeaking) {
    if (!conversaAtiva) return;
    setMayaSpeaking(true);
    speakENFix(text, 0.9, () => { setMayaSpeaking(false); if (afterSpeaking && conversaAtiva) afterSpeaking(); });
  }

  // Mostra a frase que a Maya está dizendo, bem grande, logo abaixo do
  // avatar — em inglês e português juntos, como pedido pelo usuário.
  const mayaSpeechEn = document.getElementById('maya-speech-en');
  const mayaSpeechPt = document.getElementById('maya-speech-pt');
  function mostrarFraseDaMaya(textoIngles, textoPortugues) {
    if (mayaSpeechEn) mayaSpeechEn.textContent = textoIngles || '';
    if (mayaSpeechPt) mayaSpeechPt.textContent = textoPortugues || '';
  }

  function message(text, who) {
    const item = document.createElement('article');
    item.className = `message ${who}`;
    const name = who === 'tutor' ? 'MAYA' : 'VOCÊ';
    const badge = who === 'tutor' ? '<img src="maya.png" alt="Maya">' : 'EU';
    item.innerHTML = `<span class="speaker">${badge}</span><div><small>${name}</small><p></p></div>`;
    item.querySelector('p').textContent = text;
    dialogue.appendChild(item);
    dialogue.scrollTop = dialogue.scrollHeight;
    if (who === 'tutor') {
      // Só mostramos tradução quando ela vem junto com a frase no formato
      // "frase em inglês — tradução" (ver runAcquirePhase), que é a única
      // forma garantida de a tradução ser exatamente da frase certa. Tentar
      // adivinhar a tradução pelo passo atual do cenário se mostrou
      // arriscado (os arrays de perguntas e traduções nem sempre alinham
      // pelo mesmo índice) — melhor mostrar só o inglês do que uma
      // tradução errada para quem está aprendendo.
      const partes = text.split(' — ');
      if (partes.length === 2) {
        mostrarFraseDaMaya(partes[0], partes[1]);
      } else {
        mostrarFraseDaMaya(text, '');
      }
    }
  }

  function askNext() {
    if (currentStep >= steps.length) {
      runAdjustPhase();
      return;
    }
    attemptsThisQuestion = 0;
    const step = steps[currentStep];
    const translation = translations[activeLevel][activeScenario][currentStep];
    const tipExample = document.getElementById('voice-tip-example');
    const tipTranslation = document.getElementById('voice-tip-translation');
    tipExample.textContent = `“${step.example}”`;
    tipExample.dataset.say = step.example;
    tipTranslation.textContent = `Tradução: “${translation[1]}”`;
    message(step.question, 'tutor');
    say(step.question, () => {
      maybeAutoListen(350);
    });
    status.textContent = `🟢 PRATICAR · ${scenarioNames[activeLevel][activeScenario]} · pergunta ${currentStep + 1} de ${steps.length}`;
    help.textContent = `Fase 2 de 3 — PRATICAR: “${translation[0]}”  |  Resposta sugerida: “${step.example}” (${translation[1]})`;
  }

  // Fase 3 do ciclo: AJUSTAR. Mostra um relatório rápido (acertos de primeira
  // tentativa + frases para revisar) antes de encerrar ou seguir para o modo IA.
  function runAdjustPhase() {
    const total = steps.length;
    const correct = sessionStats.firstTryCorrect;
    const pct = Math.round((correct / total) * 100);
    status.textContent = '🟡 AJUSTAR · relatório da conversa';
    help.textContent = `Fase 3 de 3 — AJUSTAR: ${correct}/${total} corretas de primeira (${pct}%).${sessionStats.reviewPhrases.length ? ' Reveja: ' + sessionStats.reviewPhrases.join(' · ') : ''}`;
    const reportIntro = `Nice work! You got ${correct} out of ${total} right on the first try, that's ${pct} percent.`;
    message(reportIntro, 'tutor');
    say(reportIntro, () => {
      if (sessionStats.reviewPhrases.length) {
        const toReview = sessionStats.reviewPhrases.slice(0, 3).join('. ');
        const reviewMsg = `Let's review these phrases: ${toReview}`;
        message(reviewMsg, 'tutor');
        say(reviewMsg, finishOrInviteAI);
      } else {
        const perfect = 'Perfect score! You are ready for the next conversation.';
        message(perfect, 'tutor');
        say(perfect, finishOrInviteAI);
      }
    });
  }

  function finishOrInviteAI() {
    const keys = scenarioKeys(activeLevel);
    const hasMore = keys.length > 1;
    if (window.ZEUVASTEC_AI_ENDPOINT) {
      const invite = 'Want to keep chatting freely? I am listening.';
      message(invite, 'tutor');
      aiHistory = [];
      say(invite, () => {
        aiChatActive = true;
        maybeAutoListen(350);
      });
      status.textContent = 'Modo IA ✦ conversa livre';
      help.textContent = 'Fale à vontade! O tutor com IA vai continuar a conversa com você.';
      return;
    }
    status.textContent = 'Conversa concluída ✦';
    help.textContent = hasMore ? 'Muito bem! Toque em "Cenário" para praticar outra conversa neste nível.' : 'Muito bem! Você concluiu a prática de hoje.';
  }

  function assess(transcript) {
    const answer = transcript.toLowerCase().replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ');
    const step = steps[currentStep];
    message(transcript, 'user');
    if (step.check(answer)) {
      if (attemptsThisQuestion === 0) sessionStats.firstTryCorrect += 1;
      const combined = `${pickRandom(praises)} ${reactToAnswer(transcript)}`;
      message(combined, 'tutor');
      say(combined, () => window.setTimeout(askNext, 350));
      currentStep += 1;
      help.textContent = 'Resposta correta! A próxima pergunta será iniciada automaticamente…';
    } else {
      attemptsThisQuestion += 1;
      if (!sessionStats.reviewPhrases.includes(step.example)) sessionStats.reviewPhrases.push(step.example);
      const correction = `${pickRandom(correctionOpeners)} ${step.example}`;
      message(correction, 'tutor');
      say(correction, () => {
        maybeAutoListen(450);
      });
      status.textContent = '🟢 PRATICAR · vamos tentar novamente';
      const translation = translations[activeLevel][activeScenario][currentStep];
      help.textContent = `Forma correta: “${step.example}” — ${translation[1]}`;
    }
  }

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    mic.onclick = () => {
      if (aiChatActive) {
        const typed = window.prompt('Continue a conversa (em inglês):');
        if (typed) assessWithAI(typed);
        return;
      }
      const typed = window.prompt(`Escreva sua resposta em inglês:\n${steps[currentStep]?.question || ''}`);
      if (typed) assess(typed);
    };
    help.textContent = 'Este navegador não reconhece voz. Toque no microfone para escrever sua resposta.';
    return;
  }

  const guidedRecognition = new Recognition();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let microphoneStream = null;
  let microphonePermissionChecked = false;
  let isListening = false;
  let autoListenArmed = false;
  let recognitionGotResult = false;
  let recognitionRestartTimer = null;
  let recognitionRestartCount = 0;
  guidedRecognition.lang = 'en-US';
  guidedRecognition.continuous = false;
  guidedRecognition.interimResults = false;
  guidedRecognition.maxAlternatives = 1;
  guidedRecognition.onstart = () => {
    isListening = true;
    recognitionGotResult = false;
    recognitionRestartCount = 0;
    if (recognitionRestartTimer) {
      clearTimeout(recognitionRestartTimer);
      recognitionRestartTimer = null;
    }
    mic.classList.add('listening');
    status.textContent = 'Ouvindo sua resposta…';
    help.textContent = 'Fale a frase em inglês.';
  };
  guidedRecognition.onresult = (event) => {
    recognitionGotResult = true;
    const transcript = event.results[0][0].transcript;
    if (aiChatActive) assessWithAI(transcript);
    else assess(transcript);
  };
  guidedRecognition.onerror = (event) => {
    isListening = false;
    mic.classList.remove('listening');
    status.textContent = 'Não consegui ouvir';
    if (isIOS) {
      help.textContent = `O reconhecimento de voz do iPhone/iPad é instável (erro: ${event.error || 'desconhecido'}). Verifique Ajustes > Safari > Microfone, ou toque no microfone para tentar de novo.`;
    } else {
      help.textContent = `Verifique a permissão do microfone e tente outra vez. (erro: ${event.error || 'desconhecido'})`;
    }
  };
  guidedRecognition.onend = () => {
    isListening = false;

    // Alguns navegadores encerram o reconhecimento quando o usuário fica
    // alguns segundos em silêncio. Nesse caso, não desligamos o microfone
    // visualmente: reiniciamos a escuta automaticamente e mantemos o botão
    // vermelho até que exista uma resposta ou ocorra um erro real.
    const canKeepListening = conversaAtiva
      && !recognitionGotResult
      && !aiChatActive
      && currentStep < steps.length
      && !isIOS
      && microphoneStream;

    if (canKeepListening && recognitionRestartCount < 8) {
      recognitionRestartCount += 1;
      mic.classList.add('listening');
      status.textContent = 'Ouvindo sua resposta…';
      help.textContent = 'Continue falando em inglês.';
      recognitionRestartTimer = window.setTimeout(() => {
        recognitionRestartTimer = null;
        startListening();
      }, 250);
      return;
    }

    mic.classList.remove('listening');
    recognitionRestartCount = 0;
  };

  // No iOS/iPadOS, pedir getUserMedia e depois iniciar o SpeechRecognition
  // separadamente é um padrão conhecido por travar o reconhecimento no Safari.
  // Por isso, no iOS, deixamos o próprio SpeechRecognition pedir a permissão.
  // Também evitamos reiniciar a escuta sozinha (setTimeout) no iOS, porque o
  // Safari exige um toque direto do usuário para cada início de escuta.
  function maybeAutoListen(delay) {
    // No iPhone/iPad, o Safari exige uma interação do usuário para iniciar
    // o reconhecimento. O primeiro toque arma a sessão; depois disso,
    // cada nova pergunta tenta iniciar o microfone automaticamente.
    if (isIOS) {
      if (!autoListenArmed) {
        mic.classList.add('pulse');
        help.textContent = 'Toque no microfone uma vez para ativar a conversa automática.';
        return;
      }
      mic.classList.remove('pulse');
      window.setTimeout(startListening, delay);
      return;
    }
    if (microphoneStream) window.setTimeout(startListening, delay);
  }

  async function startListening() {
    if (!conversaAtiva || (currentStep >= steps.length && !aiChatActive) || isListening) return;
    mic.classList.remove('pulse');
    if (!isIOS && !microphonePermissionChecked && navigator.mediaDevices?.getUserMedia) {
      microphonePermissionChecked = true;
      try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneStream.getTracks().forEach((track) => track.stop());
        microphoneStream = { authorized: true };
        status.textContent = 'Microfone ativado para esta prática';
      } catch (error) {
        status.textContent = 'Permissão de microfone necessária';
        help.textContent = 'Permita o microfone uma vez nas configurações do navegador para continuar.';
        return;
      }
    }
    if (isIOS) microphoneStream = { authorized: true };
    try {
      guidedRecognition.start();
      // Depois que o usuário autorizou/iniciou o microfone uma vez,
      // a prática passa a tentar iniciar automaticamente a cada pergunta.
      if (isIOS) autoListenArmed = true;
    } catch (error) {
      isListening = false;
    }
  }
  mic.onclick = () => {
    startListening();
  };

  // Pede a permissão do microfone cedo (usando o clique em "Conversar" como
  // o gesto do usuário que o navegador exige), mas SEM começar a ouvir de
  // verdade ainda — só guarda a permissão pra quando a Maya realmente
  // precisar dela, depois de falar (ver iniciarConversaAoEntrar).
  async function primeMicPermission() {
    if (isIOS || microphonePermissionChecked || !navigator.mediaDevices?.getUserMedia) return;
    microphonePermissionChecked = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      microphoneStream = { authorized: true };
    } catch (error) {
      microphonePermissionChecked = false;
    }
  }

  // A ordem certa da conversa é: a Maya fala a pergunta primeiro, o aluno
  // responde depois — nunca o contrário (pedido do usuário, 2026-09-18: "a
  // Maya inicia calada, só depois que o aluno responde é que ela continua
  // falando"). Por isso, ao entrar em "Conversar", em vez de já ligar o
  // microfone, pedimos pra Maya falar a pergunta atual — é o próprio
  // askNext() que liga o microfone (maybeAutoListen) só depois que ela
  // termina de falar.
  async function iniciarConversaAoEntrar() {
    primeMicPermission();
    // A Maya 3D precisa estar visível ANTES de falar a primeira frase
    // (pedido do usuário, 2026-09-19) — espera ela terminar de carregar,
    // com um teto de 6s pra não deixar o aluno esperando calado demais se
    // o avatar 3D falhar (nesse caso a foto de fallback já aparece).
    if (window.__mayaAguardarPronta) {
      await Promise.race([window.__mayaAguardarPronta(), new Promise((r) => setTimeout(r, 6000))]);
    }
    if (!conversaAtiva) return; // o aluno pode ter saído enquanto esperava
    if (!aiChatActive && currentStep < steps.length) {
      askNext();
    }
  }

  // Encerra a conversa de verdade quando o aluno sai da tela "Conversar"
  // (pedido do usuário, 2026-09-18: a Maya continuava falando/ouvindo depois
  // de já ter voltado pro Início). Cancela a fala em andamento, para o
  // reconhecimento de voz e impede que qualquer callback pendente (próxima
  // pergunta, próxima frase da fase ADQUIRIR, resposta da IA) reative a fala
  // ou o microfone sozinha enquanto o aluno estiver em outra tela.
  function pararConversa() {
    conversaAtiva = false;
    try { speechSynthesis.cancel(); } catch (e) {}
    setMayaSpeaking(false);
    window.dispatchEvent(new CustomEvent('maya-speaking-end'));
    if (recognitionRestartTimer) { clearTimeout(recognitionRestartTimer); recognitionRestartTimer = null; }
    try { guidedRecognition.abort(); } catch (e) {}
    isListening = false;
    mic.classList.remove('listening');
    mic.classList.remove('pulse');
  }
  window.addEventListener('maya-stop-conversa', pararConversa);

  // O botão de microfone foi escondido da interface (pedido do usuário) —
  // a escuta liga sozinha assim que a pessoa entra na aba "Conversar",
  // usando o próprio clique no menu como o "gesto do usuário" que o
  // navegador exige para autorizar o microfone da primeira vez.
  document.querySelectorAll('[data-view="talk"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      conversaAtiva = true;
      window.setTimeout(iniciarConversaAoEntrar, 300);
    });
  });
}());
