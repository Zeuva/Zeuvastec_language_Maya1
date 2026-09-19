// === BANCO DE CONTEÚDO DO SIMULADOR ===
// Vocabulário curado, sem repetições, organizado por nível (básico → avançado).
// Cada item: [inglês, português, frase de exemplo em inglês]
window.simuladorBank = {
  basico: [
    ['Hello', 'Olá', 'Hello! How are you today?'],
    ['Good morning', 'Bom dia', 'Good morning, everyone!'],
    ['Good afternoon', 'Boa tarde', 'Good afternoon, welcome in.'],
    ['Good evening', 'Boa noite (chegada)', 'Good evening, please come in.'],
    ['Good night', 'Boa noite (saída)', 'Good night, sleep well.'],
    ['Goodbye', 'Tchau', 'Goodbye, see you tomorrow.'],
    ['See you soon', 'Até logo', 'See you soon, take care.'],
    ['Nice to meet you', 'Prazer em conhecer você', 'Nice to meet you, I am Ana.'],
    ['How are you?', 'Como você está?', 'How are you? I am fine.'],
    ["I'm fine, thank you", 'Estou bem, obrigado(a)', "I'm fine, thank you, and you?"],
    ['Mother', 'Mãe', 'My mother works at a school.'],
    ['Father', 'Pai', 'My father likes to cook.'],
    ['Brother', 'Irmão', 'My brother is younger than me.'],
    ['Sister', 'Irmã', 'My sister lives in another city.'],
    ['Friend', 'Amigo(a)', 'She is my best friend.'],
    ['One', 'Um', 'I have one brother.'],
    ['Two', 'Dois', 'I need two more minutes.'],
    ['Three', 'Três', 'We waited three hours.'],
    ['Today', 'Hoje', 'Today is a beautiful day.'],
    ['Tomorrow', 'Amanhã', 'I will call you tomorrow.'],
    ['Yesterday', 'Ontem', 'I studied English yesterday.'],
    ['Week', 'Semana', 'I go to the gym every week.'],
    ['Water', 'Água', 'Can I have a glass of water?'],
    ['Coffee', 'Café', 'I drink coffee every morning.'],
    ['Bread', 'Pão', 'We bought fresh bread today.'],
    ['Breakfast', 'Café da manhã', 'I eat breakfast at seven.'],
    ['Lunch', 'Almoço', 'Let us have lunch together.'],
    ['Dinner', 'Jantar', 'Dinner is ready!'],
    ['House', 'Casa', 'Their house is very big.'],
    ['School', 'Escola', 'My children walk to school.'],
    ['Car', 'Carro', 'I need to wash my car.'],
    ['Book', 'Livro', 'This book is very interesting.'],
    ['Phone', 'Telefone', 'My phone battery is low.'],
    ['I want', 'Eu quero', 'I want a cup of tea.'],
    ['I need', 'Eu preciso', 'I need help with this bag.'],
    ['I like', 'Eu gosto', 'I like sunny days.'],
    ['I have', 'Eu tenho', 'I have two brothers.'],
    ['Please', 'Por favor', 'Close the door, please.'],
    ['Sorry', 'Desculpe', "Sorry, I'm late."],
    ['How much is it?', 'Quanto custa?', 'How much is it, please?']
  ],
  intermediario: [
    ['I went', 'Eu fui', 'I went to the market yesterday.'],
    ['I will go', 'Eu irei', 'I will go to the party tonight.'],
    ['I have been', 'Eu tenho estado / já estive', 'I have been to Portugal twice.'],
    ['Although', 'Embora', 'Although it was raining, we went out.'],
    ['However', 'Porém / no entanto', 'The plan was good; however, it failed.'],
    ['Because', 'Porque', 'I stayed home because I was tired.'],
    ['Opinion', 'Opinião', 'In my opinion, this is the best option.'],
    ['I believe', 'Eu acredito', 'I believe things will improve.'],
    ['I think', 'Eu acho', 'I think we should leave now.'],
    ['Experience', 'Experiência', 'It was an unforgettable experience.'],
    ['Decision', 'Decisão', 'That was a difficult decision.'],
    ['Challenge', 'Desafio', 'Learning a language is a real challenge.'],
    ['Deadline', 'Prazo', 'We have to meet the deadline.'],
    ['Meeting', 'Reunião', 'The meeting starts at nine.'],
    ['Colleague', 'Colega de trabalho', 'My colleague helped me finish the report.'],
    ['Project', 'Projeto', 'This project takes three months.'],
    ['Journey', 'Jornada / viagem', 'It was a long journey home.'],
    ['Flight', 'Voo', 'Our flight was delayed by an hour.'],
    ['Passport', 'Passaporte', "Don't forget your passport."],
    ['Luggage', 'Bagagem', 'I lost my luggage at the airport.'],
    ['Destination', 'Destino', 'Our final destination is Lisbon.'],
    ['Weather', 'Clima', 'The weather is lovely today.'],
    ['Traffic', 'Trânsito', 'There was heavy traffic this morning.'],
    ['Environment', 'Meio ambiente', 'We must protect the environment.'],
    ['Health', 'Saúde', 'Health is more important than money.'],
    ['Exercise', 'Exercício', 'I try to exercise every day.'],
    ['Stress', 'Estresse', 'Work has caused a lot of stress.'],
    ['Relax', 'Relaxar', 'I like to relax on weekends.'],
    ['Improve', 'Melhorar', 'She wants to improve her English.'],
    ['Achieve', 'Alcançar', 'He worked hard to achieve his goal.'],
    ['Goal', 'Meta', 'My goal is to speak fluently.'],
    ['Habit', 'Hábito', 'Reading is a good habit.'],
    ['Confidence', 'Confiança', 'Practice builds confidence.'],
    ['Advice', 'Conselho', 'Can you give me some advice?'],
    ['Solution', 'Solução', 'We found a simple solution.'],
    ['Responsibility', 'Responsabilidade', 'It is my responsibility to fix it.'],
    ['Necessary', 'Necessário', 'It is necessary to arrive early.'],
    ['Possible', 'Possível', 'Is it possible to reschedule?'],
    ['Recommend', 'Recomendar', 'I recommend this restaurant.'],
    ['Suggest', 'Sugerir', 'What do you suggest we do?']
  ],
  avancado: [
    ['Nevertheless', 'Contudo / apesar disso', 'Nevertheless, we decided to continue.'],
    ['Consequently', 'Consequentemente', 'He missed the deadline; consequently, the project was delayed.'],
    ['Furthermore', 'Além disso', 'Furthermore, the results were inconclusive.'],
    ['In contrast', 'Em contraste', 'In contrast, the second study showed different results.'],
    ['On the other hand', 'Por outro lado', 'On the other hand, the risk is worth taking.'],
    ['Ambiguous', 'Ambíguo', 'The instructions were somewhat ambiguous.'],
    ['Controversial', 'Controverso', 'It is a controversial topic in politics.'],
    ['Sustainable', 'Sustentável', 'We need a more sustainable energy policy.'],
    ['Innovative', 'Inovador', 'They launched an innovative new product.'],
    ['Efficient', 'Eficiente', 'This process is far more efficient.'],
    ['Strategy', 'Estratégia', 'We need a long-term strategy.'],
    ['Implementation', 'Implementação', 'The implementation took longer than expected.'],
    ['Perspective', 'Perspectiva', 'Try to see it from her perspective.'],
    ['Assumption', 'Suposição', 'That is a dangerous assumption to make.'],
    ['Evidence', 'Evidência', 'There is no evidence to support that claim.'],
    ['Bias', 'Viés', 'The report showed a clear bias.'],
    ['Impact', 'Impacto', 'The decision had a major impact.'],
    ['Outcome', 'Resultado', 'The outcome was better than expected.'],
    ['Negotiate', 'Negociar', 'They managed to negotiate a fair deal.'],
    ['Compromise', 'Compromisso / meio-termo', 'We reached a compromise after long talks.'],
    ['Accountability', 'Responsabilização', 'Leaders must have accountability for their actions.'],
    ['Feasible', 'Viável', 'Is this plan financially feasible?'],
    ['Comprehensive', 'Abrangente', 'They conducted a comprehensive review.'],
    ['Elaborate', 'Elaborar / detalhar', 'Could you elaborate on that point?'],
    ['Reluctant', 'Relutante', 'She was reluctant to accept the offer.'],
    ['Persistent', 'Persistente', 'His persistent effort finally paid off.'],
    ['Resilience', 'Resiliência', 'The team showed great resilience under pressure.'],
    ['Empathy', 'Empatia', 'A good leader shows empathy.'],
    ['Integrity', 'Integridade', 'She is known for her integrity.'],
    ['Diligence', 'Diligência', 'He completed the task with great diligence.'],
    ['Ambition', 'Ambição', 'Her ambition drives her career.'],
    ['Discretion', 'Discrição', 'Please handle this matter with discretion.'],
    ['Skeptical', 'Cético', 'I am skeptical about that claim.'],
    ['Nuance', 'Nuance', 'The translation lost some nuance.'],
    ['Paradox', 'Paradoxo', "It's a paradox that we have less time despite more technology."],
    ['Rhetoric', 'Retórica', 'His speech was full of rhetoric.'],
    ['Insight', 'Percepção / insight', 'This data gives us valuable insight.'],
    ['Breakthrough', 'Avanço / descoberta', 'Scientists made a major breakthrough.'],
    ['Milestone', 'Marco', 'Reaching one million users was a milestone.']
  ]
};

// --- Gerador de perguntas variadas, sem repetição, a partir do banco acima ---
(function(){
  function shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildQuestion(item, bank, template) {
    const [en, pt, example] = item;
    const others = bank.filter((x) => x[0] !== en);
    const distractors = shuffle(others).slice(0, 3);

    if (template === 'fill') {
      const idx = example.toLowerCase().indexOf(en.toLowerCase());
      if (idx !== -1) {
        const blanked = example.slice(0, idx) + '___' + example.slice(idx + en.length);
        const opts = shuffle([en, ...distractors.map((d) => d[0])]);
        return { q: `Complete a frase: "${blanked}"`, opts, ans: opts.indexOf(en), type: 'fill', lessonTitle: 'Simulado', module: 0 };
      }
      template = Math.random() < 0.5 ? 'en-pt' : 'pt-en';
    }
    if (template === 'pt-en') {
      const opts = shuffle([en, ...distractors.map((d) => d[0])]);
      return { q: `Como se diz "${pt}" em inglês?`, opts, ans: opts.indexOf(en), type: 'translation', lessonTitle: 'Simulado', module: 0 };
    }
    const opts = shuffle([pt, ...distractors.map((d) => d[1])]);
    return { q: `O que significa "${en}" em português?`, opts, ans: opts.indexOf(pt), type: 'translation', lessonTitle: 'Simulado', module: 0 };
  }

  function generateTierQuestions(tier, count) {
    const bank = window.simuladorBank[tier] || [];
    if (!bank.length) return [];
    const templates = ['en-pt', 'pt-en', 'fill'];
    const qs = [];
    for (let round = 0; qs.length < count && round < templates.length; round++) {
      const order = shuffle(bank);
      for (let i = 0; i < order.length && qs.length < count; i++) {
        qs.push(buildQuestion(order[i], bank, templates[(i + round) % templates.length]));
      }
    }
    return shuffle(qs).slice(0, count);
  }

  window.generateSimuladoQuestions = function (tiers, count) {
    const list = Array.isArray(tiers) ? tiers : [tiers];
    const per = Math.ceil(count / list.length);
    let all = [];
    list.forEach((tier) => { all = all.concat(generateTierQuestions(tier, per)); });
    return shuffle(all).slice(0, count);
  };
}());
