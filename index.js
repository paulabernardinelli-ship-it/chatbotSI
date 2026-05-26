const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const MAIN_TOKEN = '8939546326:AAFlKtd9tKL5LAZKdJIqZNQZeUUry7IFNuc';
const AGENT_TOKEN = '8747273381:AAGZPgp091yMSwf0UQhGbhh_cQOxK7anBoE';
const AGENT_CHAT_ID = '8231669195';
const WHATSAPP = 'https://wa.me/5511981716393';
const MAIN_API = `https://api.telegram.org/bot${MAIN_TOKEN}`;
const AGENT_API = `https://api.telegram.org/bot${AGENT_TOKEN}`;

// Sessoes dos usuarios
const sessions = {};

// Codigos curtos para atendimento: codigo -> userId e userId -> codigo
const codigos = {};
const userCodigos = {};

function gerarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let cod;
  do {
    cod = Array.from({ length: 4 }, () => letras[Math.floor(Math.random() * letras.length)]).join('');
  } while (codigos[cod]);
  return cod;
}

function getCodigo(userId) {
  if (!userCodigos[userId]) {
    const cod = gerarCodigo();
    userCodigos[userId] = cod;
    codigos[cod] = userId;
  }
  return userCodigos[userId];
}

function liberarCodigo(userId) {
  const cod = userCodigos[userId];
  if (cod) {
    delete codigos[cod];
    delete userCodigos[userId];
  }
}

function getSession(userId) {
  if (!sessions[userId]) {
    sessions[userId] = { step: 'menu', carrinho: [], total: 0, aguardandoAtendente: false, userName: '' };
  }
  return sessions[userId];
}

async function sendMessage(chatId, text, keyboard = null) {
  const payload = { chat_id: chatId, text, parse_mode: 'Markdown' };
  if (keyboard) payload.reply_markup = { keyboard, resize_keyboard: true, one_time_keyboard: true };
  const res = await axios.post(`${MAIN_API}/sendMessage`, payload);
  return res.data.result;
}

async function sendAgentMessage(text, keyboard = null) {
  const payload = { chat_id: AGENT_CHAT_ID, text, parse_mode: 'Markdown' };
  if (keyboard) payload.reply_markup = { keyboard, resize_keyboard: true, one_time_keyboard: true };
  const res = await axios.post(`${AGENT_API}/sendMessage`, payload);
  return res.data.result;
}

async function sendMenu(chatId) {
  await sendMessage(chatId, 'Selecione uma opcao:', [
    ['Ver Cardapio', 'Ver Localizacao'],
    ['Horario de Funcionamento', 'Falar com Atendente'],
    ['Falar no WhatsApp', 'Sair']
  ]);
}

async function sendCardapio(chatId) {
  await sendMessage(chatId, 'Qual categoria te interessa?', [
    ['Bebidas alcoolicas'],
    ['Bebidas nao alcoolicas'],
    ['Salgadinhos e petiscos'],
    ['Voltar ao Menu']
  ]);
}

async function sendBebidasAlcoolicas(chatId) {
  await sendMessage(chatId,
    '*Bebidas Alcoolicas*\n\nDigite o *numero* do produto para adicionar ao carrinho:\n\n' +
    '1. Cerveja Brahma 269ml - R$ 5,00\n' +
    '2. Cerveja Imperio 269ml - R$ 5,00\n' +
    '3. Cerveja Eisenbahn 269ml - R$ 6,00\n' +
    '4. Cerveja Budweiser 269ml - R$ 6,00\n' +
    '5. Caixa Original 8x269ml - R$ 28,00\n' +
    '6. Caixa Original 15x269ml - R$ 42,00\n' +
    '7. Caixa Heineken 8x269ml - R$ 32,00\n' +
    '8. Caixa Amstel 8x269ml - R$ 29,00\n' +
    '9. Caixa Spaten 8x269ml - R$ 29,00\n' +
    '10. Caixa Itaipava 12x269ml - R$ 32,00\n' +
    '11. Caixa Skol Pilsen 15un - R$ 42,00\n' +
    '12. Caixa Skol Malte 15un - R$ 46,00\n' +
    '13. Caixa Skol Beats 8un - R$ 48,00\n' +
    '14. Caixa Skol LN 6un - R$ 46,00\n' +
    '15. Caixa Skol Pilsen 12un - R$ 40,00\n' +
    '16. Smirnoff Ice 275ml - R$ 8,00\n' +
    '17. Skol Beats 269ml - R$ 9,00\n' +
    '18. 51 Ice 275ml - R$ 7,00\n' +
    '19. Cabare Ice 275ml - R$ 7,00\n' +
    '20. Leev Ice 275ml - R$ 7,00\n' +
    '21. Caracu 350ml - R$ 6,00\n' +
    '22. Pitu 1L - R$ 28,00\n' +
    '23. Pitu 350ml - R$ 6,00\n' +
    '24. Pitu com Limao 350ml - R$ 6,00\n' +
    '25. 51 Original 1L - R$ 16,00\n' +
    '26. Velho Barreiro 1L - R$ 20,00\n' +
    '27. Cabare 1L - R$ 25,00\n' +
    '28. Ypioca 1L - R$ 20,00',
    [['Ver Carrinho', 'Voltar ao Menu']]
  );
}

async function sendNaoAlcoolicas(chatId) {
  await sendMessage(chatId,
    '*Bebidas Nao Alcoolicas*\n\nDigite o *numero* do produto para adicionar ao carrinho:\n\n' +
    '1. Coca-cola 2L - R$ 12,00\n' +
    '2. Coca-cola 1L - R$ 10,00\n' +
    '3. Coca-cola 350ml - R$ 6,00\n' +
    '4. Pepsi 2L - R$ 10,00\n' +
    '5. Pepsi 350ml - R$ 5,00\n' +
    '6. Dolly Guarana 2L - R$ 7,00\n' +
    '7. Guarana Antarctica 2L - R$ 9,00\n' +
    '8. Guarana Antarctica 350ml - R$ 5,00\n' +
    '9. Fanta Laranja 2L - R$ 10,00\n' +
    '10. Fanta Laranja 350ml - R$ 6,00\n' +
    '11. Fanta Uva 350ml - R$ 5,00\n' +
    '12. Schweppes Citrus 1,5L - R$ 9,00',
    [['Ver Carrinho', 'Voltar ao Menu']]
  );
}

async function sendSalgadinhos(chatId) {
  await sendMessage(chatId,
    '*Salgadinhos e Petiscos*\n\nDigite o *numero* do produto para adicionar ao carrinho:\n\n' +
    '1. Amendoim Hitnuts 90g - R$ 6,00\n' +
    '2. Torcida Pimenta 90g - R$ 6,00\n' +
    '3. Torcida Cebola 90g - R$ 6,00\n' +
    '4. Lays Classica - R$ 8,00\n' +
    '5. Ruffles Original 68g - R$ 7,00\n' +
    '6. Fofura Cebola - R$ 3,50\n' +
    '7. Chettos sabores - R$ 5,00\n' +
    '8. Kitkat ao Leite - R$ 6,00\n' +
    '9. Kitkat Branco - R$ 6,00\n' +
    '10. Trento sabores - R$ 6,00',
    [['Ver Carrinho', 'Voltar ao Menu']]
  );
}

// Sugestoes por perfil
const sugestoes = {
  suave: {
    titulo: 'Sugestoes para paladar *Suave*',
    descricao: 'Bebidas leves, refrescantes e de baixa amargor. Ideais para quem prefere sabores delicados.',
    itens: [
      'Cerveja Brahma 269ml - R$ 5,00',
      'Cerveja Imperio 269ml - R$ 5,00',
      'Smirnoff Ice 275ml - R$ 8,00',
      '51 Ice 275ml - R$ 7,00',
      'Cabare Ice 275ml - R$ 7,00',
      'Leev Ice 275ml - R$ 7,00',
      'Pitu com Limao 350ml - R$ 6,00',
    ]
  },
  mediana: {
    titulo: 'Sugestoes para paladar *Mediano*',
    descricao: 'Bebidas com corpo equilibrado, nem muito leves nem muito intensas. O melhor dos dois mundos.',
    itens: [
      'Cerveja Budweiser 269ml - R$ 6,00',
      'Cerveja Eisenbahn 269ml - R$ 6,00',
      'Caixa Heineken 8x269ml - R$ 32,00',
      'Caixa Amstel 8x269ml - R$ 29,00',
      'Skol Beats 269ml - R$ 9,00',
      'Caracu 350ml - R$ 6,00',
      '51 Original 1L - R$ 16,00',
    ]
  },
  encorpada: {
    titulo: 'Sugestoes para paladar *Encorpado*',
    descricao: 'Bebidas com sabor intenso, mais amargas ou com maior teor alcoolico. Para os apreciadores.',
    itens: [
      'Caixa Spaten 8x269ml - R$ 29,00',
      'Caixa Skol Malte 15un - R$ 46,00',
      'Caixa Skol Beats 8un - R$ 48,00',
      'Pitu 1L - R$ 28,00',
      'Velho Barreiro 1L - R$ 20,00',
      'Cabare 1L - R$ 25,00',
      'Ypioca 1L - R$ 20,00',
    ]
  }
};

function parsePreco(texto) {
  const match = texto.match(/R\$\s*([\d,]+)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(',', '.'));
}

const produtosAlcoolicos = [
  'Cerveja Brahma 269ml - R$ 5,00', 'Cerveja Imperio 269ml - R$ 5,00',
  'Cerveja Eisenbahn 269ml - R$ 6,00', 'Cerveja Budweiser 269ml - R$ 6,00',
  'Caixa Original 8x269ml - R$ 28,00', 'Caixa Original 15x269ml - R$ 42,00',
  'Caixa Heineken 8x269ml - R$ 32,00', 'Caixa Amstel 8x269ml - R$ 29,00',
  'Caixa Spaten 8x269ml - R$ 29,00', 'Caixa Itaipava 12x269ml - R$ 32,00',
  'Caixa Skol Pilsen 15un - R$ 42,00', 'Caixa Skol Malte 15un - R$ 46,00',
  'Caixa Skol Beats 8un - R$ 48,00', 'Caixa Skol LN 6un - R$ 46,00',
  'Caixa Skol Pilsen 12un - R$ 40,00', 'Smirnoff Ice 275ml - R$ 8,00',
  'Skol Beats 269ml - R$ 9,00', '51 Ice 275ml - R$ 7,00',
  'Cabare Ice 275ml - R$ 7,00', 'Leev Ice 275ml - R$ 7,00',
  'Caracu 350ml - R$ 6,00', 'Pitu 1L - R$ 28,00',
  'Pitu 350ml - R$ 6,00', 'Pitu com Limao 350ml - R$ 6,00',
  '51 Original 1L - R$ 16,00', 'Velho Barreiro 1L - R$ 20,00',
  'Cabare 1L - R$ 25,00', 'Ypioca 1L - R$ 20,00'
];

const produtosNaoAlcoolicos = [
  'Coca-cola 2L - R$ 12,00', 'Coca-cola 1L - R$ 10,00',
  'Coca-cola 350ml - R$ 6,00', 'Pepsi 2L - R$ 10,00',
  'Pepsi 350ml - R$ 5,00', 'Dolly Guarana 2L - R$ 7,00',
  'Guarana Antarctica 2L - R$ 9,00', 'Guarana Antarctica 350ml - R$ 5,00',
  'Fanta Laranja 2L - R$ 10,00', 'Fanta Laranja 350ml - R$ 6,00',
  'Fanta Uva 350ml - R$ 5,00', 'Schweppes Citrus 1,5L - R$ 9,00'
];

const produtosSalgadinhos = [
  'Amendoim Hitnuts 90g - R$ 6,00', 'Torcida Pimenta 90g - R$ 6,00',
  'Torcida Cebola 90g - R$ 6,00', 'Lays Classica - R$ 8,00',
  'Ruffles Original 68g - R$ 7,00', 'Fofura Cebola - R$ 3,50',
  'Chettos sabores - R$ 5,00', 'Kitkat ao Leite - R$ 6,00',
  'Kitkat Branco - R$ 6,00', 'Trento sabores - R$ 6,00'
];

function encontrarProduto(texto, lista) {
  const num = parseInt(texto);
  if (!isNaN(num) && num >= 1 && num <= lista.length) return lista[num - 1];
  const lower = texto.toLowerCase();
  return lista.find(p => p.toLowerCase().includes(lower)) || null;
}

async function adicionarItens(userId, txt, lista, session) {
  const partes = txt.split(/[\s,;]+/).filter(p => p.trim().length > 0);
  const adicionados = [];
  const naoEncontrados = [];

  for (const parte of partes) {
    const prod = encontrarProduto(parte.trim(), lista);
    if (prod) {
      session.carrinho.push(prod);
      session.total += parsePreco(prod);
      adicionados.push(prod);
    } else {
      naoEncontrados.push(parte);
    }
  }

  if (adicionados.length > 0) {
    const itens = adicionados.map(p => '- ' + p).join('\n');
    let msg = adicionados.length === 1
      ? '*' + adicionados[0] + '* adicionado ao carrinho!'
      : '*' + adicionados.length + ' itens* adicionados ao carrinho:\n' + itens;
    msg += '\n\nTotal atual: R$ ' + session.total.toFixed(2);
    if (naoEncontrados.length > 0) msg += '\n\nNao encontrado(s): ' + naoEncontrados.join(', ');
    await sendMessage(userId, msg, [['Ver Carrinho', 'Voltar ao Menu']]);
  } else {
    await sendMessage(userId, 'Nenhum produto encontrado. Digite os numeros separados por espaco ou virgula. Ex: 1 3 7');
  }
}

async function processarMensagem(userId, texto, userName) {
  const session = getSession(userId);
  session.userName = userName;
  const txt = texto.trim();

  // Usuario em atendimento humano
  if (session.aguardandoAtendente) {
    if (txt.toLowerCase() === '/sair') {
      session.aguardandoAtendente = false;
      session.step = 'menu';
      liberarCodigo(userId);
      await sendMessage(userId, 'Atendimento encerrado. Obrigado!');
      await sendMenu(userId);
      await sendAgentMessage(`Atendimento com *${userName}* encerrado pelo usuario.`);
    } else {
      const cod = getCodigo(userId);
      await sendAgentMessage(`[${cod}] *${userName}:*\n${txt}`);
    }
    return;
  }

  // Comandos globais
  if (txt === '/start' || txt.toLowerCase() === 'oi' || txt.toLowerCase() === 'ola' || txt.toLowerCase() === 'olá') {
    session.step = 'menu';
    session.carrinho = [];
    session.total = 0;
    await sendMessage(userId, 'Ola! Bem-vindo a Adega Desce Outra. Como posso ajudar?');
    await sendMenu(userId);
    return;
  }

  if (txt === 'Voltar ao Menu' || txt.toLowerCase() === 'menu') {
    session.step = 'menu';
    await sendMenu(userId);
    return;
  }

  if (txt === 'Voltar ao Cardapio' || txt.toLowerCase() === 'voltar ao cardapio') {
    session.step = 'cardapio';
    await sendCardapio(userId);
    return;
  }

  if (txt === 'Ver Carrinho' || txt.toLowerCase() === 'carrinho') {
    if (session.carrinho.length === 0) {
      await sendMessage(userId, 'Seu carrinho esta vazio.');
      return;
    }
    const resumo = session.carrinho.map((item, i) => `${i + 1}. ${item}`).join('\n');
    const linkWpp = `https://wa.me/5511981716393?text=${encodeURIComponent('Ola! Gostaria de fazer o seguinte pedido:\n\n' + resumo + '\n\nTotal: R$ ' + session.total.toFixed(2))}`;
    await sendMessage(userId,
      `*Resumo do Pedido:*\n\n${resumo}\n\n*Total: R$ ${session.total.toFixed(2)}*\n\n[Clique aqui para enviar seu pedido pelo WhatsApp](${linkWpp})`,
      [['Adicionar mais itens', 'Voltar ao Menu']]
    );
    return;
  }

  if (txt === 'Adicionar mais itens') {
    await sendCardapio(userId);
    return;
  }

  switch (session.step) {
    case 'menu':
      if (txt === 'Ver Cardapio') {
        session.step = 'cardapio';
        await sendCardapio(userId);
      } else if (txt === 'Ver Localizacao') {
        await sendMessage(userId, '*Localizacao:*\n\nR. Caminho de Itapevi, 97 - Vila Nossa Sra. Aparecida\nCarapicuiba - SP, 06390-220\n\n[Abrir no Google Maps](https://maps.google.com/?q=R.+Caminho+de+Itapevi,+97+Carapicuiba)');
        await sendMenu(userId);
      } else if (txt === 'Horario de Funcionamento') {
        await sendMessage(userId, '*Horario de Atendimento:*\n\nTerca a quinta: 8h as 20h\nSexta e sabado: 10h as 22h\nDomingo: 10h as 17h');
        await sendMenu(userId);
      } else if (txt === 'Falar com Atendente') {
        session.step = 'confirmar_atendente';
        await sendMessage(userId, 'Deseja mesmo falar com um atendente?', [['Sim', 'Nao']]);
      } else if (txt === 'Falar no WhatsApp') {
        await sendMessage(userId, `[Clique aqui para falar no WhatsApp](${WHATSAPP})`);
        await sendMenu(userId);
      } else if (txt === 'Sair') {
        session.step = 'menu';
        session.carrinho = [];
        session.total = 0;
        await sendMessage(userId, 'A Adega Desce Outra agradece o contato! Ate logo!');
      } else {
        await sendMenu(userId);
      }
      break;

    case 'confirmar_atendente':
      if (txt === 'Sim') {
        session.aguardandoAtendente = true;
        session.step = 'atendente';
        const cod = getCodigo(userId);
        await sendMessage(userId, 'Certo! Nossa equipe foi notificada e vai te responder por aqui.\n\nPode mandar sua mensagem. Para encerrar, digite /sair.');
        await sendAgentMessage(
          `*Novo atendimento solicitado*\n\nCliente: ${userName}\nCodigo: \`${cod}\`\n\nResponda: /reply ${cod} mensagem\nEncerrar: /encerrar ${cod}`
        );
      } else {
        session.step = 'menu';
        await sendMenu(userId);
      }
      break;

    case 'cardapio':
      if (txt === 'Bebidas alcoolicas') {
        session.step = 'verificar_idade';
        await sendMessage(userId, 'Para acessar o cardapio de bebidas alcoolicas, confirme:\n\nVoce tem mais de 18 anos?', [['Sim, tenho 18+', 'Nao']]);
      } else if (txt === 'Bebidas nao alcoolicas') {
        session.step = 'nao_alcoolicas';
        await sendNaoAlcoolicas(userId);
      } else if (txt === 'Salgadinhos e petiscos') {
        session.step = 'salgadinhos';
        await sendSalgadinhos(userId);
      } else {
        await sendCardapio(userId);
      }
      break;

    case 'verificar_idade':
      if (txt === 'Sim, tenho 18+') {
        session.step = 'perfil_bebida';
        await sendMessage(userId,
          'Qual o seu perfil de paladar?\n\nEscolha uma opcao para ver sugestoes personalizadas:',
          [['Suave', 'Mediano', 'Encorpado'], ['Voltar ao Cardapio']]
        );
      } else {
        await sendMessage(userId, 'Venda de bebidas alcoolicas proibida para menores de 18 anos (Lei 13.106/15).');
        session.step = 'cardapio';
        await sendCardapio(userId);
      }
      break;

    case 'perfil_bebida': {
      let perfil = null;
      if (txt === 'Suave') perfil = 'suave';
      else if (txt === 'Mediano') perfil = 'mediana';
      else if (txt === 'Encorpado') perfil = 'encorpada';

      if (perfil) {
        const s = sugestoes[perfil];
        const lista = s.itens.map((item, i) => `${i + 1}. ${item}`).join('\n');
        session.step = 'sugestoes_' + perfil;
        await sendMessage(userId,
          `${s.titulo}\n\n_${s.descricao}_\n\n${lista}\n\nDigite o *numero* do produto para adicionar ao carrinho:`,
          [['Ver Carrinho'], ['Voltar ao Cardapio', 'Voltar ao Menu']]
        );
      } else {
        await sendMessage(userId, 'Escolha uma opcao:', [
          ['Suave', 'Mediano', 'Encorpado'],
          ['Voltar ao Cardapio']
        ]);
      }
      break;
    }

    case 'sugestoes_suave':
    case 'sugestoes_mediana':
    case 'sugestoes_encorpada': {
      const perfil = session.step.replace('sugestoes_', '');
      // Tenta adicionar da lista de sugestoes
      const listaS = sugestoes[perfil].itens;
      const num = parseInt(txt);
      if (!isNaN(num) && num >= 1 && num <= listaS.length) {
        const prod = listaS[num - 1];
        session.carrinho.push(prod);
        session.total += parsePreco(prod);
        await sendMessage(userId,
          `*${prod}* adicionado ao carrinho!\n\nTotal atual: R$ ${session.total.toFixed(2)}`,
          [['Ver Carrinho'], ['Voltar ao Cardapio', 'Voltar ao Menu']]
        );
      } else {
        await sendMessage(userId, 'Digite o numero do produto da lista acima.');
      }
      break;
    }

    case 'alcoolicas': {
      await adicionarItens(userId, txt, produtosAlcoolicos, session);
      break;
    }

    case 'nao_alcoolicas': {
      await adicionarItens(userId, txt, produtosNaoAlcoolicos, session);
      break;
    }

    case 'salgadinhos': {
      await adicionarItens(userId, txt, produtosSalgadinhos, session);
      break;
    }

    default:
      session.step = 'menu';
      await sendMenu(userId);
  }
}

// Webhook do bot PRINCIPAL
app.post('/webhook-main', async (req, res) => {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) return res.sendStatus(200);
    const userId = String(msg.chat.id);
    const userName = msg.from?.first_name || 'Usuario';
    await processarMensagem(userId, msg.text, userName);
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro webhook-main:', err.message);
    res.sendStatus(200);
  }
});

// Webhook do AGENT BOT — atendente responde com /reply CODIGO mensagem
app.post('/webhook', async (req, res) => {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) return res.sendStatus(200);
    if (String(msg.chat.id) !== String(AGENT_CHAT_ID)) return res.sendStatus(200);

    const txt = msg.text.trim();

    // /encerrar CODIGO
    const matchEncerrar = txt.match(/^\/encerrar\s+(\S+)/i);
    if (matchEncerrar) {
      const cod = matchEncerrar[1].toUpperCase();
      const uid = codigos[cod];
      const sess = uid ? sessions[uid] : null;
      if (!sess || !sess.aguardandoAtendente) {
        await sendAgentMessage(`Codigo ${cod} nao encontrado ou ja encerrado.`);
        return res.sendStatus(200);
      }
      sess.aguardandoAtendente = false;
      sess.step = 'menu';
      liberarCodigo(uid);
      await sendAgentMessage(`Atendimento *${cod}* encerrado.`);
      await sendMessage(uid, 'Atendimento encerrado pelo atendente. Obrigado!');
      await sendMenu(uid);
      return res.sendStatus(200);
    }

    // /reply CODIGO mensagem
    const matchReply = txt.match(/^\/reply\s+(\S+)\s+([\s\S]+)/i);
    if (matchReply) {
      const cod = matchReply[1].toUpperCase();
      const responseText = matchReply[2];
      const uid = codigos[cod];
      const sess = uid ? sessions[uid] : null;
      if (!sess || !sess.aguardandoAtendente) {
        await sendAgentMessage(`Codigo ${cod} nao encontrado ou ja encerrado.`);
        return res.sendStatus(200);
      }
      await sendMessage(uid, `Atendente:\n${responseText}`);
      return res.sendStatus(200);
    }

    // Mensagem sem comando — lista atendimentos ativos
    if (!txt.startsWith('/')) {
      const ativos = Object.entries(sessions)
        .filter(([, s]) => s.aguardandoAtendente)
        .map(([uid, s]) => `- ${s.userName}: /reply ${userCodigos[uid]} mensagem`);
      if (ativos.length > 0) {
        await sendAgentMessage(`Atendimentos ativos:\n${ativos.join('\n')}\n\nUse /reply CODIGO para responder.`);
      } else {
        await sendAgentMessage('Nenhum atendimento ativo no momento.');
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro webhook:', err.message);
    res.sendStatus(200);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Bot Adega Desce Outra rodando na porta', process.env.PORT || 3000);
});
