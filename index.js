const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const MAIN_TOKEN = '8939546326:AAFlKtd9tKL5LAZKdJIqZNQZeUUry7IFNuc';
const AGENT_TOKEN = '8747273381:AAGZPgp091yMSwf0UQhGbhh_cQOxK7anBoE';
const AGENT_CHAT_ID = '8231669195';
const PIX_KEY = '5511981716393';
const FRETE_FIXO = 5.00;
const MAIN_API = `https://api.telegram.org/bot${MAIN_TOKEN}`;
const AGENT_API = `https://api.telegram.org/bot${AGENT_TOKEN}`;

// Sessões dos usuários
const sessions = {};

// Códigos curtos: código -> userId e userId -> código
const codigos = {};
const userCodigos = {};

// Pedidos aguardando confirmação de pagamento: código -> userId
const pedidosPendentes = {};
const userPedidoCod = {};

function gerarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let cod;
  do {
    cod = Array.from({ length: 4 }, () => letras[Math.floor(Math.random() * letras.length)]).join('');
  } while (codigos[cod] || pedidosPendentes[cod]);
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
    sessions[userId] = {
      step: 'menu',
      carrinho: [],
      total: 0,
      aguardandoAtendente: false,
      userName: '',
      drink: {},
      entrega: null,
      totalComFrete: 0
    };
  }
  return sessions[userId];
}

async function sendMessage(chatId, text, keyboard = null) {
  const payload = { chat_id: chatId, text, parse_mode: 'Markdown' };
  if (keyboard) payload.reply_markup = { keyboard, resize_keyboard: true, one_time_keyboard: true };
  const res = await axios.post(`${MAIN_API}/sendMessage`, payload);
  return res.data.result;
}

async function sendPhoto(chatId, photoUrl, caption = '') {
  const payload = { chat_id: chatId, photo: photoUrl, caption, parse_mode: 'Markdown' };
  await axios.post(`${MAIN_API}/sendPhoto`, payload);
}

async function sendAgentMessage(text, keyboard = null) {
  const payload = { chat_id: AGENT_CHAT_ID, text, parse_mode: 'Markdown' };
  if (keyboard) payload.reply_markup = { keyboard, resize_keyboard: true, one_time_keyboard: true };
  const res = await axios.post(`${AGENT_API}/sendMessage`, payload);
  return res.data.result;
}

async function sendMenu(chatId) {
  await sendMessage(chatId, 'Selecione uma opção:', [
    ['Ver Cardápio', 'Ver Localização'],
    ['Horário de Funcionamento', 'Falar com Atendente'],
    ['Montar Drink', 'Sair']
  ]);
}

async function sendCardapio(chatId) {
  await sendMessage(chatId, 'Qual categoria te interessa?', [
    ['Bebidas alcoólicas'],
    ['Bebidas não alcoólicas'],
    ['Salgadinhos e petiscos'],
    ['Voltar ao Menu']
  ]);
}

async function sendBebidasAlcoolicas(chatId) {
  await sendMessage(chatId,
    '*Bebidas Alcoólicas*\n\nDigite o *número* do produto para adicionar ao carrinho:\n\n' +
    '1. Cerveja Brahma 269ml - R$ 5,00\n' +
    '2. Cerveja Império 269ml - R$ 5,00\n' +
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
    '19. Cabaré Ice 275ml - R$ 7,00\n' +
    '20. Leev Ice 275ml - R$ 7,00\n' +
    '21. Caracu 350ml - R$ 6,00\n' +
    '22. Pitu 1L - R$ 28,00\n' +
    '23. Pitu 350ml - R$ 6,00\n' +
    '24. Pitu com Limão 350ml - R$ 6,00\n' +
    '25. 51 Original 1L - R$ 16,00\n' +
    '26. Velho Barreiro 1L - R$ 20,00\n' +
    '27. Cabaré 1L - R$ 25,00\n' +
    '28. Ypioca 1L - R$ 20,00',
    [['Ver Carrinho', 'Voltar ao Menu']]
  );
}

async function sendNaoAlcoolicas(chatId) {
  await sendMessage(chatId,
    '*Bebidas Não Alcoólicas*\n\nDigite o *número* do produto para adicionar ao carrinho:\n\n' +
    '1. Coca-cola 2L - R$ 12,00\n' +
    '2. Coca-cola 1L - R$ 10,00\n' +
    '3. Coca-cola 350ml - R$ 6,00\n' +
    '4. Pepsi 2L - R$ 10,00\n' +
    '5. Pepsi 350ml - R$ 5,00\n' +
    '6. Dolly Guaraná 2L - R$ 7,00\n' +
    '7. Guaraná Antarctica 2L - R$ 9,00\n' +
    '8. Guaraná Antarctica 350ml - R$ 5,00\n' +
    '9. Fanta Laranja 2L - R$ 10,00\n' +
    '10. Fanta Laranja 350ml - R$ 6,00\n' +
    '11. Fanta Uva 350ml - R$ 5,00\n' +
    '12. Schweppes Citrus 1,5L - R$ 9,00',
    [['Ver Carrinho', 'Voltar ao Menu']]
  );
}

async function sendSalgadinhos(chatId) {
  await sendMessage(chatId,
    '*Salgadinhos e Petiscos*\n\nDigite o *número* do produto para adicionar ao carrinho:\n\n' +
    '1. Amendoim Hitnuts 90g - R$ 6,00\n' +
    '2. Torcida Pimenta 90g - R$ 6,00\n' +
    '3. Torcida Cebola 90g - R$ 6,00\n' +
    '4. Lays Clássica - R$ 8,00\n' +
    '5. Ruffles Original 68g - R$ 7,00\n' +
    '6. Fofura Cebola - R$ 3,50\n' +
    '7. Chettos sabores - R$ 5,00\n' +
    '8. Kitkat ao Leite - R$ 6,00\n' +
    '9. Kitkat Branco - R$ 6,00\n' +
    '10. Trento sabores - R$ 6,00',
    [['Ver Carrinho', 'Voltar ao Menu']]
  );
}

// ─── DRINKS ────────────────────────────────────────────────────────────────

async function sendDrinkBase(chatId) {
  await sendMessage(chatId,
    '🍹 *Monte seu Drink*\n\nEscolha a *base* do seu drink:',
    [['Gin', 'Whisky'], ['Vodka', 'Saquê'], ['Voltar ao Menu']]
  );
}

async function sendDrinkGelo(chatId) {
  await sendMessage(chatId,
    '🧊 Escolha o tipo de *gelo*:',
    [['Gelo Normal', 'Gelo de Coco'], ['Gelo de Coco Saborizado'], ['Voltar ao Menu']]
  );
}

async function sendDrinkGeloSaborizado(chatId) {
  await sendMessage(chatId,
    '🍉 Escolha o *sabor* do gelo de coco saborizado:',
    [['Maçã Verde', 'Melancia'], ['Frutas Vermelhas'], ['Voltar ao Menu']]
  );
}

async function sendDrinkEnergetico(chatId) {
  await sendMessage(chatId,
    '⚡ Deseja adicionar *energético*?',
    [['Sim, quero energético!', 'Não, obrigado'], ['Voltar ao Menu']]
  );
}

async function sendDrinkEnergeticoMarca(chatId) {
  await sendMessage(chatId,
    '⚡ Escolha o *energético*:',
    [['Red Bull', 'Monster'], ['Baly'], ['Voltar ao Menu']]
  );
}

async function sendDrinkXarope(chatId) {
  await sendMessage(chatId,
    '🍬 Deseja adicionar *xarope*?',
    [['Sim, quero xarope!', 'Não, obrigado'], ['Voltar ao Menu']]
  );
}

async function sendDrinkXaropeSabor(chatId) {
  await sendMessage(chatId,
    '🍬 Escolha o *sabor* do xarope:',
    [['Xarope Melancia', 'Xarope Maçã Verde'], ['Xarope Frutas Vermelhas'], ['Voltar ao Menu']]
  );
}

async function sendDrinkCanudo(chatId) {
  await sendMessage(chatId,
    '🌿 Deseja adicionar *canudo sustentável*?',
    [['Sim, quero canudo!', 'Não, obrigado'], ['Voltar ao Menu']]
  );
}

async function sendDrinkTamanho(chatId) {
  await sendMessage(chatId,
    '📏 Escolha o *tamanho* do drink:\n\n300ml - R$ 15,00\n400ml - R$ 20,00\n500ml - R$ 25,00',
    [['300ml - R$ 15,00', '400ml - R$ 20,00'], ['500ml - R$ 25,00'], ['Voltar ao Menu']]
  );
}

function resumirDrink(drink) {
  let partes = [`Base: ${drink.base}`];
  partes.push(`Gelo: ${drink.gelo === 'Gelo de Coco Saborizado' ? `Gelo de Coco Saborizado (${drink.geloSabor})` : drink.gelo}`);
  if (drink.energetico && drink.energetico !== 'Não') partes.push(`Energético: ${drink.energetico}`);
  else partes.push('Sem energético');
  if (drink.xarope && drink.xarope !== 'Não') partes.push(`Xarope: ${drink.xarope}`);
  else partes.push('Sem xarope');
  partes.push(`Canudo sustentável: ${drink.canudo ? 'Sim' : 'Não'}`);
  partes.push(`Tamanho: ${drink.tamanho}`);
  return partes.join('\n');
}

// ─── PIX QR CODE ───────────────────────────────────────────────────────────

function gerarPixPayload(chave, valor, nome, cidade) {
  function campo(id, val) {
    const len = val.length.toString().padStart(2, '0');
    return `${id}${len}${val}`;
  }
  const merchantAccountInfo = campo('00', 'BR.GOV.BCB.PIX') + campo('01', chave);
  const payload =
    campo('00', '01') +
    campo('26', merchantAccountInfo) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', valor.toFixed(2)) +
    campo('58', 'BR') +
    campo('59', nome.substring(0, 25)) +
    campo('60', cidade.substring(0, 15)) +
    campo('62', campo('05', '***'));

  // CRC16-CCITT
  const str = payload + '6304';
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
    crc &= 0xFFFF;
  }
  return payload + '6304' + crc.toString(16).toUpperCase().padStart(4, '0');
}

async function enviarQrCodePix(chatId, valorTotal) {
  const pixPayload = gerarPixPayload(PIX_KEY, valorTotal, 'Adega Desce Outra', 'Carapicuiba');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixPayload)}`;
  await sendPhoto(chatId, qrUrl,
    `💸 *Pagamento via PIX*\n\n` +
    `Valor: *R$ ${valorTotal.toFixed(2)}*\n\n` +
    `Chave PIX: \`${PIX_KEY}\`\n\n` +
    `Escaneie o QR Code acima ou copie a chave.\n\n` +
    `⏳ Aguarde a confirmação do pagamento pelo atendente.`
  );
}

// ─── SUGESTÕES POR PERFIL ──────────────────────────────────────────────────

const sugestoes = {
  suave: {
    titulo: 'Sugestões para paladar *Suave*',
    descricao: 'Bebidas leves, refrescantes e de baixo amargor. Ideais para quem prefere sabores delicados.',
    itens: [
      'Cerveja Brahma 269ml - R$ 5,00',
      'Cerveja Império 269ml - R$ 5,00',
      'Smirnoff Ice 275ml - R$ 8,00',
      '51 Ice 275ml - R$ 7,00',
      'Cabaré Ice 275ml - R$ 7,00',
      'Leev Ice 275ml - R$ 7,00',
      'Pitu com Limão 350ml - R$ 6,00',
    ]
  },
  mediana: {
    titulo: 'Sugestões para paladar *Mediano*',
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
    titulo: 'Sugestões para paladar *Encorpado*',
    descricao: 'Bebidas com sabor intenso, mais amargas ou com maior teor alcoólico. Para os apreciadores.',
    itens: [
      'Caixa Spaten 8x269ml - R$ 29,00',
      'Caixa Skol Malte 15un - R$ 46,00',
      'Caixa Skol Beats 8un - R$ 48,00',
      'Pitu 1L - R$ 28,00',
      'Velho Barreiro 1L - R$ 20,00',
      'Cabaré 1L - R$ 25,00',
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
  'Cerveja Brahma 269ml - R$ 5,00', 'Cerveja Império 269ml - R$ 5,00',
  'Cerveja Eisenbahn 269ml - R$ 6,00', 'Cerveja Budweiser 269ml - R$ 6,00',
  'Caixa Original 8x269ml - R$ 28,00', 'Caixa Original 15x269ml - R$ 42,00',
  'Caixa Heineken 8x269ml - R$ 32,00', 'Caixa Amstel 8x269ml - R$ 29,00',
  'Caixa Spaten 8x269ml - R$ 29,00', 'Caixa Itaipava 12x269ml - R$ 32,00',
  'Caixa Skol Pilsen 15un - R$ 42,00', 'Caixa Skol Malte 15un - R$ 46,00',
  'Caixa Skol Beats 8un - R$ 48,00', 'Caixa Skol LN 6un - R$ 46,00',
  'Caixa Skol Pilsen 12un - R$ 40,00', 'Smirnoff Ice 275ml - R$ 8,00',
  'Skol Beats 269ml - R$ 9,00', '51 Ice 275ml - R$ 7,00',
  'Cabaré Ice 275ml - R$ 7,00', 'Leev Ice 275ml - R$ 7,00',
  'Caracu 350ml - R$ 6,00', 'Pitu 1L - R$ 28,00',
  'Pitu 350ml - R$ 6,00', 'Pitu com Limão 350ml - R$ 6,00',
  '51 Original 1L - R$ 16,00', 'Velho Barreiro 1L - R$ 20,00',
  'Cabaré 1L - R$ 25,00', 'Ypioca 1L - R$ 20,00'
];

const produtosNaoAlcoolicos = [
  'Coca-cola 2L - R$ 12,00', 'Coca-cola 1L - R$ 10,00',
  'Coca-cola 350ml - R$ 6,00', 'Pepsi 2L - R$ 10,00',
  'Pepsi 350ml - R$ 5,00', 'Dolly Guaraná 2L - R$ 7,00',
  'Guaraná Antarctica 2L - R$ 9,00', 'Guaraná Antarctica 350ml - R$ 5,00',
  'Fanta Laranja 2L - R$ 10,00', 'Fanta Laranja 350ml - R$ 6,00',
  'Fanta Uva 350ml - R$ 5,00', 'Schweppes Citrus 1,5L - R$ 9,00'
];

const produtosSalgadinhos = [
  'Amendoim Hitnuts 90g - R$ 6,00', 'Torcida Pimenta 90g - R$ 6,00',
  'Torcida Cebola 90g - R$ 6,00', 'Lays Clássica - R$ 8,00',
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
    if (naoEncontrados.length > 0) msg += '\n\nNão encontrado(s): ' + naoEncontrados.join(', ');
    await sendMessage(userId, msg, [['Ver Carrinho', 'Voltar ao Menu']]);
  } else {
    await sendMessage(userId, 'Nenhum produto encontrado. Digite os números separados por espaço ou vírgula. Ex: 1 3 7');
  }
}

async function processarMensagem(userId, texto, userName) {
  const session = getSession(userId);
  session.userName = userName;
  const txt = texto.trim();

  // Usuário em atendimento humano
  if (session.aguardandoAtendente) {
    if (txt.toLowerCase() === '/sair') {
      session.aguardandoAtendente = false;
      session.step = 'menu';
      liberarCodigo(userId);
      await sendMessage(userId, 'Atendimento encerrado. Obrigado!');
      await sendMenu(userId);
      await sendAgentMessage(`Atendimento com *${userName}* encerrado pelo usuário.`);
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
    session.drink = {};
    session.entrega = null;
    await sendMessage(userId, 'Olá! Bem-vindo à Adega Desce Outra. Como posso ajudar?');
    await sendMenu(userId);
    return;
  }

  if (txt === 'Voltar ao Menu' || txt.toLowerCase() === 'menu') {
    session.step = 'menu';
    session.drink = {};
    await sendMenu(userId);
    return;
  }

  if (txt === 'Voltar ao Cardápio' || txt.toLowerCase() === 'voltar ao cardapio' || txt === 'Voltar ao Cardapio') {
    session.step = 'cardapio';
    await sendCardapio(userId);
    return;
  }

  if (txt === 'Ver Carrinho' || txt.toLowerCase() === 'carrinho') {
    if (session.carrinho.length === 0) {
      await sendMessage(userId, 'Seu carrinho está vazio.');
      return;
    }
    const resumo = session.carrinho.map((item, i) => `${i + 1}. ${item}`).join('\n');
    session.step = 'checkout_entrega';
    await sendMessage(userId,
      `*Resumo do Pedido:*\n\n${resumo}\n\n*Subtotal: R$ ${session.total.toFixed(2)}*\n\nComo deseja receber?`,
      [['🏠 Retirada no local', '🛵 Entrega'], ['Adicionar mais itens', 'Voltar ao Menu']]
    );
    return;
  }

  if (txt === 'Adicionar mais itens') {
    await sendCardapio(userId);
    return;
  }

  switch (session.step) {
    case 'menu':
      if (txt === 'Ver Cardápio' || txt === 'Ver Cardapio') {
        session.step = 'cardapio';
        await sendCardapio(userId);
      } else if (txt === 'Ver Localização' || txt === 'Ver Localizacao') {
        await sendMessage(userId, '*Localização:*\n\nR. Caminho de Itapevi, 97 - Vila Nossa Sra. Aparecida\nCarapicuíba - SP, 06390-220\n\n[Abrir no Google Maps](https://maps.google.com/?q=R.+Caminho+de+Itapevi,+97+Carapicuiba)');
        await sendMenu(userId);
      } else if (txt === 'Horário de Funcionamento' || txt === 'Horario de Funcionamento') {
        await sendMessage(userId, '*Horário de Atendimento:*\n\nTerça a quinta: 8h às 20h\nSexta e sábado: 10h às 22h\nDomingo: 10h às 17h');
        await sendMenu(userId);
      } else if (txt === 'Falar com Atendente') {
        session.step = 'confirmar_atendente';
        await sendMessage(userId, 'Deseja mesmo falar com um atendente?', [['Sim', 'Não']]);
      } else if (txt === 'Montar Drink') {
        session.step = 'drink_verificar_idade';
        await sendMessage(userId, 'Para montar um drink, confirme:\n\nVocê tem mais de 18 anos?', [['Sim, tenho 18+', 'Não']]);
      } else if (txt === 'Sair') {
        session.step = 'menu';
        session.carrinho = [];
        session.total = 0;
        session.drink = {};
        session.entrega = null;
        await sendMessage(userId, 'A Adega Desce Outra agradece o contato! Até logo!');
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
          `*Novo atendimento solicitado*\n\nCliente: ${userName}\nCódigo: \`${cod}\`\n\nResponda: /reply ${cod} mensagem\nEncerrar: /encerrar ${cod}`
        );
      } else {
        session.step = 'menu';
        await sendMenu(userId);
      }
      break;

    case 'cardapio':
      if (txt === 'Bebidas alcoólicas' || txt === 'Bebidas alcoolicas') {
        session.step = 'verificar_idade';
        await sendMessage(userId, 'Para acessar o cardápio de bebidas alcoólicas, confirme:\n\nVocê tem mais de 18 anos?', [['Sim, tenho 18+', 'Não']]);
      } else if (txt === 'Bebidas não alcoólicas' || txt === 'Bebidas nao alcoolicas') {
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
        session.step = 'sugestao_ou_cardapio';
        await sendMessage(userId,
          '🍺 Quer receber uma *sugestão personalizada* de bebida conforme seu paladar?\n\nOu prefere ver o cardápio completo?',
          [['✨ Quero uma sugestão!', '📋 Ver cardápio completo']]
        );
      } else {
        await sendMessage(userId, 'Venda de bebidas alcoólicas proibida para menores de 18 anos (Lei 13.106/15).');
        session.step = 'cardapio';
        await sendCardapio(userId);
      }
      break;

    case 'sugestao_ou_cardapio':
      if (txt === '✨ Quero uma sugestão!') {
        session.step = 'perfil_bebida';
        await sendMessage(userId,
          'Qual o seu perfil de paladar?\n\nEscolha uma opção para ver sugestões personalizadas:',
          [['Suave', 'Mediano', 'Encorpado'], ['Voltar ao Cardápio']]
        );
      } else if (txt === '📋 Ver cardápio completo') {
        session.step = 'alcoolicas';
        await sendBebidasAlcoolicas(userId);
      } else {
        await sendMessage(userId, 'Escolha uma opção:',
          [['✨ Quero uma sugestão!', '📋 Ver cardápio completo']]
        );
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
          `${s.titulo}\n\n_${s.descricao}_\n\n${lista}\n\nDigite o *número* do produto para adicionar ao carrinho:`,
          [['Ver Carrinho'], ['Voltar ao Cardápio', 'Voltar ao Menu']]
        );
      } else {
        await sendMessage(userId, 'Escolha uma opção:', [
          ['Suave', 'Mediano', 'Encorpado'],
          ['Voltar ao Cardápio']
        ]);
      }
      break;
    }

    case 'sugestoes_suave':
    case 'sugestoes_mediana':
    case 'sugestoes_encorpada': {
      const perfil = session.step.replace('sugestoes_', '');
      const listaS = sugestoes[perfil].itens;
      const num = parseInt(txt);
      if (!isNaN(num) && num >= 1 && num <= listaS.length) {
        const prod = listaS[num - 1];
        session.carrinho.push(prod);
        session.total += parsePreco(prod);
        await sendMessage(userId,
          `*${prod}* adicionado ao carrinho!\n\nTotal atual: R$ ${session.total.toFixed(2)}`,
          [['Ver Carrinho'], ['Voltar ao Cardápio', 'Voltar ao Menu']]
        );
      } else {
        await sendMessage(userId, 'Digite o número do produto da lista acima.');
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

    // ─── CHECKOUT ─────────────────────────────────────────────────────────

    case 'checkout_entrega': {
      if (txt === '🏠 Retirada no local') {
        session.entrega = 'retirada';
        session.totalComFrete = session.total;
        session.step = 'checkout_confirmar';
        const resumo = session.carrinho.map((item, i) => `${i + 1}. ${item}`).join('\n');
        await sendMessage(userId,
          `✅ *Retirada no local*\n\n${resumo}\n\n*Total: R$ ${session.totalComFrete.toFixed(2)}*\n\nConfirmar pedido?`,
          [['✅ Confirmar pedido', '❌ Cancelar']]
        );
      } else if (txt === '🛵 Entrega') {
        session.entrega = 'entrega';
        session.step = 'checkout_confirmar_frete';
        await sendMessage(userId,
          `🛵 *Entrega*\n\nO frete fixo é de *R$ ${FRETE_FIXO.toFixed(2)}*.\n\nSubtotal: R$ ${session.total.toFixed(2)}\nFrete: R$ ${FRETE_FIXO.toFixed(2)}\n*Total: R$ ${(session.total + FRETE_FIXO).toFixed(2)}*\n\nDeseja continuar?`,
          [['✅ Aceito o frete', '❌ Cancelar']]
        );
      } else {
        const resumo = session.carrinho.map((item, i) => `${i + 1}. ${item}`).join('\n');
        await sendMessage(userId,
          `*Resumo do Pedido:*\n\n${resumo}\n\n*Subtotal: R$ ${session.total.toFixed(2)}*\n\nComo deseja receber?`,
          [['🏠 Retirada no local', '🛵 Entrega'], ['Adicionar mais itens', 'Voltar ao Menu']]
        );
      }
      break;
    }

    case 'checkout_confirmar_frete': {
      if (txt === '✅ Aceito o frete') {
        session.totalComFrete = session.total + FRETE_FIXO;
        session.step = 'checkout_confirmar';
        const resumo = session.carrinho.map((item, i) => `${i + 1}. ${item}`).join('\n');
        await sendMessage(userId,
          `🛵 *Entrega confirmada*\n\n${resumo}\n\nFrete: R$ ${FRETE_FIXO.toFixed(2)}\n*Total: R$ ${session.totalComFrete.toFixed(2)}*\n\nConfirmar pedido?`,
          [['✅ Confirmar pedido', '❌ Cancelar']]
        );
      } else if (txt === '❌ Cancelar') {
        session.step = 'checkout_entrega';
        const resumo = session.carrinho.map((item, i) => `${i + 1}. ${item}`).join('\n');
        await sendMessage(userId,
          `*Resumo do Pedido:*\n\n${resumo}\n\n*Subtotal: R$ ${session.total.toFixed(2)}*\n\nComo deseja receber?`,
          [['🏠 Retirada no local', '🛵 Entrega'], ['Adicionar mais itens', 'Voltar ao Menu']]
        );
      } else {
        await sendMessage(userId, 'Escolha uma opção:', [['✅ Aceito o frete', '❌ Cancelar']]);
      }
      break;
    }

    case 'checkout_confirmar': {
      if (txt === '✅ Confirmar pedido') {
        // Gera código de pedido
        const codPedido = gerarCodigo();
        pedidosPendentes[codPedido] = userId;
        userPedidoCod[userId] = codPedido;

        const resumo = session.carrinho.map((item, i) => `${i + 1}. ${item}`).join('\n');
        const tipoEntrega = session.entrega === 'entrega' ? '🛵 Entrega' : '🏠 Retirada no local';

        // Notifica atendente
        await sendAgentMessage(
          `🛒 *NOVO PEDIDO — #${codPedido}*\n\n` +
          `👤 Cliente: ${userName}\n` +
          `📦 Tipo: ${tipoEntrega}\n\n` +
          `${resumo}\n\n` +
          `${session.entrega === 'entrega' ? `Frete: R$ ${FRETE_FIXO.toFixed(2)}\n` : ''}` +
          `*Total: R$ ${session.totalComFrete.toFixed(2)}*\n\n` +
          `Para confirmar pagamento: /pago ${codPedido}\n` +
          `Para recusar: /recusar ${codPedido}`
        );

        // Envia QR Code PIX para o usuário
        session.step = 'aguardando_pagamento';
        await sendMessage(userId, `✅ *Pedido #${codPedido} recebido!*\n\nAgora realize o pagamento via PIX para confirmar.\n\n${tipoEntrega}\n*Total: R$ ${session.totalComFrete.toFixed(2)}*`);
        await enviarQrCodePix(userId, session.totalComFrete);

      } else if (txt === '❌ Cancelar') {
        session.step = 'menu';
        session.carrinho = [];
        session.total = 0;
        session.totalComFrete = 0;
        session.entrega = null;
        await sendMessage(userId, 'Pedido cancelado. Que pena! Se quiser, pode montar um novo pedido.');
        await sendMenu(userId);
      } else {
        await sendMessage(userId, 'Escolha uma opção:', [['✅ Confirmar pedido', '❌ Cancelar']]);
      }
      break;
    }

    case 'aguardando_pagamento': {
      await sendMessage(userId, '⏳ Aguarde a confirmação do pagamento pelo atendente.\n\nSe tiver dúvidas, entre em contato.');
      break;
    }

    // ─── FLUXO DE DRINKS ──────────────────────────────────────────────────

    case 'drink_verificar_idade':
      if (txt === 'Sim, tenho 18+') {
        session.step = 'drink_base';
        session.drink = {};
        await sendDrinkBase(userId);
      } else {
        await sendMessage(userId, 'Venda de bebidas alcoólicas proibida para menores de 18 anos (Lei 13.106/15).');
        session.step = 'menu';
        await sendMenu(userId);
      }
      break;

    case 'drink_base':
      if (['Gin', 'Whisky', 'Vodka', 'Saquê'].includes(txt)) {
        session.drink.base = txt;
        session.step = 'drink_gelo';
        await sendDrinkGelo(userId);
      } else {
        await sendDrinkBase(userId);
      }
      break;

    case 'drink_gelo':
      if (txt === 'Gelo Normal' || txt === 'Gelo de Coco') {
        session.drink.gelo = txt;
        session.step = 'drink_energetico';
        await sendDrinkEnergetico(userId);
      } else if (txt === 'Gelo de Coco Saborizado') {
        session.drink.gelo = 'Gelo de Coco Saborizado';
        session.step = 'drink_gelo_sabor';
        await sendDrinkGeloSaborizado(userId);
      } else {
        await sendDrinkGelo(userId);
      }
      break;

    case 'drink_gelo_sabor':
      if (['Maçã Verde', 'Melancia', 'Frutas Vermelhas'].includes(txt)) {
        session.drink.geloSabor = txt;
        session.step = 'drink_energetico';
        await sendDrinkEnergetico(userId);
      } else {
        await sendDrinkGeloSaborizado(userId);
      }
      break;

    case 'drink_energetico':
      if (txt === 'Sim, quero energético!') {
        session.step = 'drink_energetico_marca';
        await sendDrinkEnergeticoMarca(userId);
      } else if (txt === 'Não, obrigado') {
        session.drink.energetico = 'Não';
        session.step = 'drink_xarope';
        await sendDrinkXarope(userId);
      } else {
        await sendDrinkEnergetico(userId);
      }
      break;

    case 'drink_energetico_marca':
      if (['Red Bull', 'Monster', 'Baly'].includes(txt)) {
        session.drink.energetico = txt;
        session.step = 'drink_xarope';
        await sendDrinkXarope(userId);
      } else {
        await sendDrinkEnergeticoMarca(userId);
      }
      break;

    case 'drink_xarope':
      if (txt === 'Sim, quero xarope!') {
        session.step = 'drink_xarope_sabor';
        await sendDrinkXaropeSabor(userId);
      } else if (txt === 'Não, obrigado') {
        session.drink.xarope = 'Não';
        session.step = 'drink_canudo';
        await sendDrinkCanudo(userId);
      } else {
        await sendDrinkXarope(userId);
      }
      break;

    case 'drink_xarope_sabor':
      if (['Xarope Melancia', 'Xarope Maçã Verde', 'Xarope Frutas Vermelhas'].includes(txt)) {
        session.drink.xarope = txt;
        session.step = 'drink_canudo';
        await sendDrinkCanudo(userId);
      } else {
        await sendDrinkXaropeSabor(userId);
      }
      break;

    case 'drink_canudo':
      if (txt === 'Sim, quero canudo!') {
        session.drink.canudo = true;
        session.step = 'drink_tamanho';
        await sendDrinkTamanho(userId);
      } else if (txt === 'Não, obrigado') {
        session.drink.canudo = false;
        session.step = 'drink_tamanho';
        await sendDrinkTamanho(userId);
      } else {
        await sendDrinkCanudo(userId);
      }
      break;

    case 'drink_tamanho': {
      let preco = 0;
      let tamanho = '';
      if (txt === '300ml - R$ 15,00') { preco = 15; tamanho = '300ml'; }
      else if (txt === '400ml - R$ 20,00') { preco = 20; tamanho = '400ml'; }
      else if (txt === '500ml - R$ 25,00') { preco = 25; tamanho = '500ml'; }

      if (preco > 0) {
        session.drink.tamanho = `${tamanho} - R$ ${preco},00`;
        const resumo = resumirDrink(session.drink);
        const itemCarrinho = `🍹 Drink Personalizado (${tamanho}) - R$ ${preco},00\n   [${resumo.replace(/\n/g, ' | ')}]`;
        session.carrinho.push(itemCarrinho);
        session.total += preco;
        session.step = 'menu';
        session.drink = {};
        await sendMessage(userId,
          `✅ *Drink adicionado ao carrinho!*\n\n${resumo}\n\n*Valor: R$ ${preco},00*\n\nTotal do carrinho: R$ ${session.total.toFixed(2)}`,
          [['Ver Carrinho', 'Montar Drink'], ['Voltar ao Menu']]
        );
      } else {
        await sendDrinkTamanho(userId);
      }
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
    const userName = msg.from?.first_name || 'Usuário';
    await processarMensagem(userId, msg.text, userName);
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro webhook-main:', err.message);
    res.sendStatus(200);
  }
});

// Webhook do AGENT BOT
app.post('/webhook', async (req, res) => {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) return res.sendStatus(200);
    if (String(msg.chat.id) !== String(AGENT_CHAT_ID)) return res.sendStatus(200);

    const txt = msg.text.trim();

    // /pago CODIGO — confirma pagamento e libera pedido
    const matchPago = txt.match(/^\/pago\s+(\S+)/i);
    if (matchPago) {
      const cod = matchPago[1].toUpperCase();
      const uid = pedidosPendentes[cod];
      const sess = uid ? sessions[uid] : null;
      if (!sess) {
        await sendAgentMessage(`Pedido #${cod} não encontrado ou já processado.`);
        return res.sendStatus(200);
      }
      delete pedidosPendentes[cod];
      delete userPedidoCod[uid];
      sess.step = 'menu';
      sess.carrinho = [];
      sess.total = 0;
      sess.totalComFrete = 0;
      sess.entrega = null;
      await sendAgentMessage(`✅ Pedido *#${cod}* confirmado! Cliente notificado.`);
      await sendMessage(uid,
        `🎉 *Pagamento confirmado!*\n\nSeu pedido *#${cod}* foi confirmado e está sendo preparado.\n\nObrigado por comprar na Adega Desce Outra! 🍻`
      );
      await sendMenu(uid);
      return res.sendStatus(200);
    }

    // /recusar CODIGO — recusa pedido
    const matchRecusar = txt.match(/^\/recusar\s+(\S+)/i);
    if (matchRecusar) {
      const cod = matchRecusar[1].toUpperCase();
      const uid = pedidosPendentes[cod];
      const sess = uid ? sessions[uid] : null;
      if (!sess) {
        await sendAgentMessage(`Pedido #${cod} não encontrado ou já processado.`);
        return res.sendStatus(200);
      }
      delete pedidosPendentes[cod];
      delete userPedidoCod[uid];
      sess.step = 'menu';
      await sendAgentMessage(`❌ Pedido *#${cod}* recusado. Cliente notificado.`);
      await sendMessage(uid,
        `❌ *Pagamento não confirmado*\n\nNão conseguimos confirmar seu pagamento para o pedido *#${cod}*.\n\nEntre em contato pelo WhatsApp ou tente novamente.`
      );
      await sendMenu(uid);
      return res.sendStatus(200);
    }

    // /encerrar CODIGO — encerra atendimento humano
    const matchEncerrar = txt.match(/^\/encerrar\s+(\S+)/i);
    if (matchEncerrar) {
      const cod = matchEncerrar[1].toUpperCase();
      const uid = codigos[cod];
      const sess = uid ? sessions[uid] : null;
      if (!sess || !sess.aguardandoAtendente) {
        await sendAgentMessage(`Código ${cod} não encontrado ou já encerrado.`);
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
        await sendAgentMessage(`Código ${cod} não encontrado ou já encerrado.`);
        return res.sendStatus(200);
      }
      await sendMessage(uid, `Atendente:\n${responseText}`);
      return res.sendStatus(200);
    }

    // Mensagem sem comando — lista status
    if (!txt.startsWith('/')) {
      const ativos = Object.entries(sessions)
        .filter(([, s]) => s.aguardandoAtendente)
        .map(([uid, s]) => `- ${s.userName}: /reply ${userCodigos[uid]} mensagem`);

      const pendentes = Object.entries(pedidosPendentes)
        .map(([cod, uid]) => {
          const s = sessions[uid];
          return `- Pedido #${cod} (${s ? s.userName : uid}): /pago ${cod} | /recusar ${cod}`;
        });

      let msg = '';
      if (pendentes.length > 0) msg += `💳 *Pedidos aguardando confirmação:*\n${pendentes.join('\n')}\n\n`;
      if (ativos.length > 0) msg += `💬 *Atendimentos ativos:*\n${ativos.join('\n')}\n\nUse /reply CODIGO para responder.`;
      if (!msg) msg = 'Nenhum pedido ou atendimento ativo no momento.';
      await sendAgentMessage(msg);
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
