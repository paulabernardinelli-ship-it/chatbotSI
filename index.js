const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Bot principal (Botpress) - envia mensagens ao usuário
const MAIN_BOT_TOKEN = '8939546326:AAFlKtd9tKL5LAZKdJIqZNQZeUUry7IFNuc';

// Bot atendimento (AdegaAtendimento_bot) - recebe webhook, atendente usa para /reply
const AGENT_BOT_TOKEN = '8747273381:AAGZPgp091yMSwf0UQhGbhh_cQOxK7anBoE';

const GROUP_ID = '-5233303235';
const MAIN_API = `https://api.telegram.org/bot${MAIN_BOT_TOKEN}`;
const AGENT_API = `https://api.telegram.org/bot${AGENT_BOT_TOKEN}`;

// Guarda userId dos usuários aguardando atendimento
// chave: userId, valor: true
const waitingUsers = {};

// Webhook do AdegaAtendimento_bot
// Recebe: /reply <userId> <mensagem> do atendente no grupo
app.post('/webhook', async (req, res) => {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) return res.sendStatus(200);

    // Só processa mensagens do grupo de atendentes
    if (String(msg.chat.id) !== String(GROUP_ID)) return res.sendStatus(200);

    const match = msg.text.match(/^\/reply\s+(\S+)\s+([\s\S]+)/);
    if (!match) return res.sendStatus(200);

    const [, userId, responseText] = match;

    if (!waitingUsers[userId]) {
      await axios.post(`${AGENT_API}/sendMessage`, {
        chat_id: GROUP_ID,
        text: `❌ Usuário ${userId} não encontrado ou já encerrado.`
      });
      return res.sendStatus(200);
    }

    // Responde ao usuário pelo bot PRINCIPAL (Botpress)
    await axios.post(`${MAIN_API}/sendMessage`, {
      chat_id: userId,
      text: `👨‍💼 *Atendente:* ${responseText}`,
      parse_mode: 'Markdown'
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro no webhook:', err.message);
    res.sendStatus(200);
  }
});

// Webhook do bot PRINCIPAL
// Detecta quando o usuário digita a palavra-chave de atendimento
app.post('/webhook-main', async (req, res) => {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) return res.sendStatus(200);

    const texto = msg.text.toLowerCase();
    const userId = String(msg.chat.id);
    const userName = msg.from?.first_name || 'Usuário';

    // Detecta pedido de atendente
    if (texto === 'atendente' || texto === '/atendente') {
      waitingUsers[userId] = true;

      // Notifica o grupo
      await axios.post(`${AGENT_API}/sendMessage`, {
        chat_id: GROUP_ID,
        text: `🔔 *Novo atendimento solicitado*\n\n👤 Nome: ${userName}\n🔑 ID: \`${userId}\`\n💬 Mensagem: ${msg.text}\n\nResponda com:\n/reply ${userId} sua mensagem aqui`,
        parse_mode: 'Markdown'
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro webhook-main:', err.message);
    res.sendStatus(200);
  }
});

// Encerra atendimento
app.post('/end', async (req, res) => {
  const { userId } = req.body;
  delete waitingUsers[userId];
  res.json({ ok: true });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor rodando na porta', process.env.PORT || 3000);
});
