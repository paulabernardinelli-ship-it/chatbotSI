const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const MAIN_TOKEN = '8939546326:AAFlKtd9tKL5LAZKdJIqZNQZeUUry7IFNuc';
const AGENT_TOKEN = '8747273381:AAGZPgp091yMSwf0UQhGbhh_cQOxK7anBoE';
const GROUP_ID = '-5233303235';
const WHATSAPP = 'https://wa.me/5511981716393';
const MAIN_API = `https://api.telegram.org/bot${MAIN_TOKEN}`;
const AGENT_API = `https://api.telegram.org/bot${AGENT_TOKEN}`;

// Estado dos usuários
const sessions = {};
const codigos = {};    // codigo curto -> userId
const userCodigos = {}; // userId -> codigo curto

function gerarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let cod;
  do { cod = Array.from({length: 4}, () => letras[Math.floor(Math.random() * letras.length)]).join(''); }
  while (codigos[cod]);
  return cod;
}

function getSession(userId) {
  if (!sessions[userId]) {
    sessions[userId] = { step: 'menu', carrinho: [], total: 0, aguardandoAtendente: false };
  }
  return sessions[userId];
}

function getCodigo(userId) {
  if (!userCodigos[userId]) {
    const cod = gerarCodigo();
    userCodigos[userId] = cod;
    codigos[cod] = userId;
  }
  return userCodigos[userId];
}

async function sendMessage(chatId, text, keyboard = null) {
  const payload = { chat_id: chatId, text, parse_mode: 'Markdown' };
  if (keyboard) payload.reply_markup = { keyboard, resize_keyboard: true, one_time_keyboard: true };
  await axios.post(`${MAIN_API}/sendMessage`, payload);
}

async function sendMenu(chatId) {
  await sendMessage(chatId, '📋 *Selecione uma opção:*', [
    ['🍺 Ver Cardápio', '📍 Ver Localização'],
    ['🕐 Horário de Funcionamento', '👨‍💼 Falar com Atendente'],
    ['💬 Falar no WhatsApp', '❌ Sair']
  ]);
}

async function sendCardapio(chatId) {
  await sendMessage(chatId, '📦 *Qual categoria te interessa?*', [
    ['🍺 Bebidas alcoólicas'],
    ['🥤 Bebidas não alcoólicas'],
    ['🍿 Salgadinhos e petiscos'],
    ['🔙 Voltar ao Menu']
  ]);
}

async function sendBebidasAlcoolicas(chatId) {
  await sendMessage(chatId,
    '🍺 *Bebidas Alcoólicas*\n\nDigite o nome ou número do produto:\n\n' +
    '1. Cerveja Brahma 269ml – R$ 5,00\n' +
    '2. Cerveja Império 269ml – R$ 5,00\n' +
    '3. Cerveja Eisenbahn 269ml – R$ 6,00\n' +
    '4. Cerveja Budweiser 269ml – R$ 6,00\n' +
    '5. Caixa Original 8x269ml – R$ 28,00\n' +
    '6. Caixa Original 15x269ml – R$ 42,00\n' +
    '7. Caixa Heineken 8x269ml – R$ 32,00\n' +
    '8. Caixa Amstel 8x269ml – R$ 29,00\n' +
    '9. Caixa Spaten 8x269ml – R$ 29,00\n' +
    '10. Caixa Itaipava 12x269ml – R$ 32,00\n' +
    '11. Caixa Skol Pilsen 15un – R$ 42,00\n' +
    '12. Caixa Skol Malte 15un – R$ 46,00\n' +
    '13. Caixa Skol Beats 8un – R$ 48,00\n' +
    '14. Caixa Skol LN 6un – R$ 46,00\n' +
    '15. Caixa Skol Pilsen 12un – R$ 40,00\n' +
    '16. Smirnoff Ice 275ml – R$ 8,00\n' +
    '17. Skol Beats 269ml – R$ 9,00\n' +
    '18. 51 Ice 275ml – R$ 7,00\n' +
    '19. Cabaré Ice 275ml – R$ 7,00\n' +
    '20. Leev Ice 275ml – R$ 7,00\n' +
    '21. Caracu 350ml – R$ 6,00\n' +
    '22. Pitú 1L – R$ 28,00\n' +
    '23. Pitú 350ml – R$ 6,00\n' +
    '24. Pitú com Limão 350ml – R$ 6,00\n' +
    '25. 51 Original 1L – R$ 16,00\n' +
    '26. Velho Barreiro 1L – R$ 20,00\n' +
    '27. Cabaré 1L – R$ 25,00\n' +
    '28. Ypióca 1L – R$ 20,00',
    [['🛒 Ver Carrinho', '🔙 Voltar ao Menu']]
  );
}

async function sendNaoAlcoolicas(chatId) {
  await sendMessage(chatId,
    '🥤 *Bebidas Não Alcoólicas*\n\nDigite o nome ou número do produto:\n\n' +
    '1. Coca-cola 2L – R$ 12,00\n' +
    '2. Coca-cola 1L – R$ 10,00\n' +
    '3. Coca-cola 350ml – R$ 6,00\n' +
    '4. Pepsi 2L – R$ 10,00\n' +
    '5. Pepsi 350ml – R$ 5,00\n' +
    '6. Dolly Guaraná 2L – R$ 7,00\n' +
    '7. Guaraná Antártica 2L – R$ 9,00\n' +
    '8. Guaraná Antártica 350ml – R$ 5,00\n' +
    '9. Fanta Laranja 2L – R$ 10,00\n' +
    '10. Fanta Laranja 350ml – R$ 6,00\n' +
    '11. Fanta Uva 350ml – R$ 5,00\n' +
    '12. Schweppes Citrus 1,5L – R$ 9,00',
    [['🛒 Ver Carrinho', '🔙 Voltar ao Menu']]
  );
}

async function sendSalgadinhos(chatId) {
  await sendMessage(chatId,
    '🍿 *Salgadinhos e Petiscos*\n\nDigite o nome ou número do produto:\n\n' +
    '1. Amendoim Hitnuts 90g – R$ 6,00\n' +
    '2. Torcida Pimenta 90g – R$ 6,00\n' +
    '3. Torcida Cebola 90g – R$ 6,00\n' +
    '4. Lays Clássica – R$ 8,00\n' +
    '5. Ruffles Original 68g – R$ 7,00\n' +
    '6. Fofura Cebola – R$ 3,50\n' +
    '7. Chettos sabores – R$ 5,00\n' +
    '8. Kitkat ao Leite – R$ 6,00\n' +
    '9. Kitkat Branco – R$ 6,00\n' +
    '10. Trento sabores – R$ 6,00',
    [['🛒 Ver Carrinho', '🔙 Voltar ao Menu']]
  );
}

function parsePreco(texto) {
  const match = texto.match(/R\$\s*([\d,]+)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(',', '.'));
}

const produtosAlcoolicos = [
  'Cerveja Brahma 269ml – R$ 5,00', 'Cerveja Império 269ml – R$ 5,00',
  'Cerveja Eisenbahn 269ml – R$ 6,00', 'Cerveja Budweiser 269ml – R$ 6,00',
  'Caixa Original 8x269ml – R$ 28,00', 'Caixa Original 15x269ml – R$ 42,00',
  'Caixa Heineken 8x269ml – R$ 32,00', 'Caixa Amstel 8x269ml – R$ 29,00',
  'Caixa Spaten 8x269ml – R$ 29,00', 'Caixa Itaipava 12x269ml – R$ 32,00',
  'Caixa Skol Pilsen 15un – R$ 42,00', 'Caixa Skol Malte 15un – R$ 46,00',
  'Caixa Skol Beats 8un – R$ 48,00', 'Caixa Skol LN 6un – R$ 46,00',
  'Caixa Skol Pilsen 12un – R$ 40,00', 'Smirnoff Ice 275ml – R$ 8,00',
  'Skol Beats 269ml – R$ 9,00', '51 Ice 275ml – R$ 7,00',
  'Cabaré Ice 275ml – R$ 7,00', 'Leev Ice 275ml – R$ 7,00',
  'Caracu 350ml – R$ 6,00', 'Pitú 1L – R$ 28,00',
  'Pitú 350ml – R$ 6,00', 'Pitú com Limão 350ml – R$ 6,00',
  '51 Original 1L – R$ 16,00', 'Velho Barreiro 1L – R$ 20,00',
  'Cabaré 1L – R$ 25,00', 'Ypióca 1L – R$ 20,00'
];

const produtosNaoAlcoolicos = [
  'Coca-cola 2L – R$ 12,00', 'Coca-cola 1L – R$ 10,00',
  'Coca-cola 350ml – R$ 6,00', 'Pepsi 2L – R$ 10,00',
  'Pepsi 350ml – R$ 5,00', 'Dolly Guaraná 2L – R$ 7,00',
  'Guaraná Antártica 2L – R$ 9,00', 'Guaraná Antártica 350ml – R$ 5,00',
  'Fanta Laranja 2L – R$ 10,00', 'Fanta Laranja 350ml – R$ 6,00',
  'Fanta Uva 350ml – R$ 5,00', 'Schweppes Citrus 1,5L – R$ 9,00'
];

const produtosSalgadinhos = [
  'Amendoim Hitnuts 90g – R$ 6,00', 'Torcida Pimenta 90g – R$ 6,00',
  'Torcida Cebola 90g – R$ 6,00', 'Lays Clássica – R$ 8,00',
  'Ruffles Original 68g – R$ 7,00', 'Fofura Cebola – R$ 3,50',
  'Chettos sabores – R$ 5,00', 'Kitkat ao Leite – R$ 6,00',
  'Kitkat Branco – R$ 6,00', 'Trento sabores – R$ 6,00'
];

function encontrarProduto(texto, lista) {
  const num = parseInt(texto);
  if (!isNaN(num) && num >= 1 && num <= lista.length) return lista[num - 1];
  const lower = texto.toLowerCase();
  return lista.find(p => p.toLowerCase().includes(lower)) || null;
}

async function processarMensagem(userId, texto, userName) {
  const session = getSession(userId);
  const txt = texto.trim();

  // Se está em atendimento humano
  if (session.aguardandoAtendente) {
    if (txt.toLowerCase() === '/sair') {
      session.aguardandoAtendente = false;
      session.step = 'menu';
      await sendMessage(userId, 'Atendimento encerrado. Obrigado! 😊');
      await sendMenu(userId);
      await axios.post(`${AGENT_API}/sendMessage`, {
        chat_id: GROUP_ID,
        text: `ℹ️ Usuário ${userName} (${userId}) encerrou o atendimento.`
      });
    } else {
      // Repassa mensagem do usuário ao grupo
      await axios.post(`${AGENT_API}/sendMessage`, {
        chat_id: GROUP_ID,
        text: `💬 *${userName}* (${userId}):\n${txt}`,
        parse_mode: 'Markdown'
      });
    }
    return;
  }

  // Comandos globais
  if (txt === '/start' || txt.toLowerCase() === 'oi' || txt.toLowerCase() === 'olá' || txt.toLowerCase() === 'ola') {
    session.step = 'menu';
    session.carrinho = [];
    session.total = 0;
    await sendMessage(userId, '👋 Olá! Bem-vindo à *Adega Desce Outra*. Como posso ajudar?');
    await sendMenu(userId);
    return;
  }

  if (txt === '🔙 Voltar ao Menu' || txt.toLowerCase() === 'menu' || txt.toLowerCase() === 'voltar ao menu principal') {
    session.step = 'menu';
    await sendMenu(userId);
    return;
  }

  if (txt === '🛒 Ver Carrinho' || txt.toLowerCase() === 'carrinho') {
    if (session.carrinho.length === 0) {
      await sendMessage(userId, '🛒 Seu carrinho está vazio.');
      return;
    }
    const resumo = session.carrinho.map((item, i) => `${i + 1}. ${item}`).join('\n');
    const linkWpp = `https://wa.me/5511981716393?text=${encodeURIComponent('Olá! Gostaria de fazer o seguinte pedido:\n\n' + resumo + '\n\nTotal: R$ ' + session.total.toFixed(2))}`;
    await sendMessage(userId,
      `🛒 *Resumo do Pedido:*\n\n${resumo}\n\n💰 *Total: R$ ${session.total.toFixed(2)}*\n\n👆 [Clique aqui para enviar seu pedido pelo WhatsApp](${linkWpp})`,
      [['➕ Adicionar mais itens', '🔙 Voltar ao Menu']]
    );
    return;
  }

  switch (session.step) {
    case 'menu':
      if (txt === '🍺 Ver Cardápio' || txt.toLowerCase().includes('cardápio')) {
        session.step = 'cardapio';
        await sendCardapio(userId);
      } else if (txt === '📍 Ver Localização' || txt.toLowerCase().includes('localização')) {
        await sendMessage(userId, '📍 *Nossa localização:*\n\nR. Caminho de Itapevi, 97 - Vila Nossa Sra. Aparecida\nCarapicuíba - SP, 06390-220\n\n[Abrir no Google Maps](https://maps.google.com/?q=R.+Caminho+de+Itapevi,+97+Carapicuíba)');
        await sendMenu(userId);
      } else if (txt === '🕐 Horário de Funcionamento' || txt.toLowerCase().includes('horário')) {
        await sendMessage(userId, '🕐 *Horário de Atendimento:*\n\n📅 Terça a quinta: 8h às 20h\n📅 Sexta e sábado: 10h às 22h\n📅 Domingo: 10h às 17h');
        await sendMenu(userId);
      } else if (txt === '👨‍💼 Falar com Atendente' || txt.toLowerCase().includes('atendente')) {
        session.step = 'confirmar_atendente';
        await sendMessage(userId, '👨‍💼 Deseja mesmo falar com um atendente?', [['✅ Sim', '❌ Não']]);
      } else if (txt === '💬 Falar no WhatsApp' || txt.toLowerCase().includes('whatsapp')) {
        await sendMessage(userId, `💬 [Clique aqui para falar no WhatsApp](${WHATSAPP})`);
        await sendMenu(userId);
      } else if (txt === '❌ Sair' || txt.toLowerCase() === 'sair') {
        session.step = 'menu';
        session.carrinho = [];
        session.total = 0;
        await sendMessage(userId, '👋 A Adega Desce Outra agradece o contato! Até logo!');
      } else {
        await sendMenu(userId);
      }
      break;

    case 'confirmar_atendente':
      if (txt === '✅ Sim' || txt.toLowerCase() === 'sim') {
        session.aguardandoAtendente = true;
        session.step = 'atendente';
        const cod = getCodigo(userId);
        await sendMessage(userId, '✅ Certo! Nossa equipe foi notificada e vai te responder por aqui.\n\nPode mandar suas dúvidas. Quando quiser encerrar, digite */sair*.');
        await axios.post(`${AGENT_API}/sendMessage`, {
          chat_id: GROUP_ID,
          text: `🔔 *Novo atendimento solicitado*\n\n👤 Nome: ${userName}\n🔑 Código: \`${cod}\`\n\nResponda: /reply ${cod} mensagem\nEncerrar: /encerrar ${cod}`,
          parse_mode: 'Markdown'
        });
      } else {
        session.step = 'menu';
        await sendMenu(userId);
      }
      break;

    case 'cardapio':
      if (txt === '🍺 Bebidas alcoólicas' || txt.toLowerCase().includes('alcoólicas')) {
        session.step = 'verificar_idade';
        await sendMessage(userId, '🔞 Para acessar o cardápio de bebidas alcoólicas, confirme:\n\n*Você tem mais de 18 anos?*', [['✅ Sim, tenho 18+', '❌ Não']]);
      } else if (txt === '🥤 Bebidas não alcoólicas' || txt.toLowerCase().includes('não alcoólicas')) {
        session.step = 'nao_alcoolicas';
        await sendNaoAlcoolicas(userId);
      } else if (txt === '🍿 Salgadinhos e petiscos' || txt.toLowerCase().includes('salgadinhos')) {
        session.step = 'salgadinhos';
        await sendSalgadinhos(userId);
      } else {
        await sendCardapio(userId);
      }
      break;

    case 'verificar_idade':
      if (txt === '✅ Sim, tenho 18+' || txt.toLowerCase() === 'sim') {
        session.step = 'alcoolicas';
        await sendBebidasAlcoolicas(userId);
      } else {
        await sendMessage(userId, '⚠️ Venda de bebidas alcoólicas proibida para menores de 18 anos (Lei 13.106/15)');
        session.step = 'cardapio';
        await sendCardapio(userId);
      }
      break;

    case 'alcoolicas': {
      if (txt === '➕ Adicionar mais itens') { await sendBebidasAlcoolicas(userId); break; }
      const prod = encontrarProduto(txt, produtosAlcoolicos);
      if (prod) {
        session.carrinho.push(prod);
        session.total += parsePreco(prod);
        await sendMessage(userId, `✅ *${prod}* adicionado ao carrinho!\n\n💰 Total atual: R$ ${session.total.toFixed(2)}`, [
          ['➕ Adicionar mais itens', '🛒 Ver Carrinho'],
          ['🔙 Voltar ao Menu']
        ]);
      } else {
        await sendMessage(userId, '❌ Produto não encontrado. Digite o número ou nome do produto.');
      }
      break;
    }

    case 'nao_alcoolicas': {
      if (txt === '➕ Adicionar mais itens') { await sendNaoAlcoolicas(userId); break; }
      const prod = encontrarProduto(txt, produtosNaoAlcoolicos);
      if (prod) {
        session.carrinho.push(prod);
        session.total += parsePreco(prod);
        await sendMessage(userId, `✅ *${prod}* adicionado ao carrinho!\n\n💰 Total atual: R$ ${session.total.toFixed(2)}`, [
          ['➕ Adicionar mais itens', '🛒 Ver Carrinho'],
          ['🔙 Voltar ao Menu']
        ]);
      } else {
        await sendMessage(userId, '❌ Produto não encontrado. Digite o número ou nome do produto.');
      }
      break;
    }

    case 'salgadinhos': {
      if (txt === '➕ Adicionar mais itens') { await sendSalgadinhos(userId); break; }
      const prod = encontrarProduto(txt, produtosSalgadinhos);
      if (prod) {
        session.carrinho.push(prod);
        session.total += parsePreco(prod);
        await sendMessage(userId, `✅ *${prod}* adicionado ao carrinho!\n\n💰 Total atual: R$ ${session.total.toFixed(2)}`, [
          ['➕ Adicionar mais itens', '🛒 Ver Carrinho'],
          ['🔙 Voltar ao Menu']
        ]);
      } else {
        await sendMessage(userId, '❌ Produto não encontrado. Digite o número ou nome do produto.');
      }
      break;
    }

    default:
      session.step = 'menu';
      await sendMenu(userId);
  }
}

// Webhook do bot PRINCIPAL — recebe mensagens dos usuários
app.post('/webhook-main', async (req, res) => {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) return res.sendStatus(200);
    const userId = String(msg.chat.id);
    const userName = msg.from?.first_name || 'Usuário';
    await processarMensagem(userId, msg.text, userName);
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro webhook-main:', err.message);
    res.sendStatus(200);
  }
});

// Webhook do AdegaAtendimento_bot — recebe /reply do atendente no grupo
app.post('/webhook', async (req, res) => {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) return res.sendStatus(200);
    if (String(msg.chat.id) !== String(GROUP_ID)) return res.sendStatus(200);

    // Comando /encerrar ABCD — atendente encerra pelo grupo
    const matchEncerrar = msg.text.match(/^\/encerrar\s+(\S+)/);
    if (matchEncerrar) {
      const cod = matchEncerrar[1].toUpperCase();
      const uid = codigos[cod] || matchEncerrar[1];
      const sess = sessions[uid];
      if (!sess || !sess.aguardandoAtendente) {
        await axios.post(`${AGENT_API}/sendMessage`, {
          chat_id: GROUP_ID,
          text: `❌ Código ${cod} não encontrado ou já encerrado.`
        });
        return res.sendStatus(200);
      }
      sess.aguardandoAtendente = false;
      sess.step = 'menu';
      delete userCodigos[uid];
      delete codigos[cod];
      await axios.post(`${MAIN_API}/sendMessage`, {
        chat_id: uid,
        text: '✅ Atendimento encerrado pelo atendente. Obrigado! 😊'
      });
      await sendMenu(uid);
      await axios.post(`${AGENT_API}/sendMessage`, {
        chat_id: GROUP_ID,
        text: `✅ Atendimento *${cod}* encerrado com sucesso.`,
        parse_mode: 'Markdown'
      });
      return res.sendStatus(200);
    }

    // Comando /reply ABCD mensagem
    const match = msg.text.match(/^\/reply\s+(\S+)\s+([\s\S]+)/);
    if (!match) return res.sendStatus(200);

    const [, codigoOuId, responseText] = match;
    const userId = codigos[codigoOuId.toUpperCase()] || codigoOuId;
    const session = sessions[userId];

    if (!session || !session.aguardandoAtendente) {
      await axios.post(`${AGENT_API}/sendMessage`, {
        chat_id: GROUP_ID,
        text: `❌ Código ${codigoOuId} não encontrado ou atendimento já encerrado.`
      });
      return res.sendStatus(200);
    }

    await axios.post(`${MAIN_API}/sendMessage`, {
      chat_id: userId,
      text: `👨‍💼 *Atendente:* ${responseText}`,
      parse_mode: 'Markdown'
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro webhook:', err.message);
    res.sendStatus(200);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Bot Adega Desce Outra rodando na porta', process.env.PORT || 3000);
});
