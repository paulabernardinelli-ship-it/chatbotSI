const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN; // defina no Railway
const GROUP_ID  = '-5233303235';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const sessions = {};

// Botpress chama esse endpoint quando o usuário pede atendente
app.post('/notify-agent', async (req, res) => {
  const { userId, userName, message, conversationId } = req.body;

  sessions[conversationId] = userId;

  await axios.post(`${API}/sendMessage`, {
    chat_id: GROUP_ID,
    text: `🔔 *Novo atendimento solicitado*\n\n👤 Usuário: ${userName}\n💬 Última mensagem: ${message}\n\n🔑 ID da conversa: \`${conversationId}\`\n\nResponda com:\n/reply ${conversationId} sua mensagem aqui`,
    parse_mode: 'Markdown'
  });

  res.json({ ok: true });
});

// Telegram envia atualizações via webhook
app.post('/webhook', async (req, res) => {
  const msg = req.body.message;
  if (!msg || !msg.text) return res.sendStatus(200);

  // Só processa mensagens do grupo que comecem com /reply
  if (String(msg.chat.id) !== String(GROUP_ID)) return res.sendStatus(200);

  const match = msg.text.match(/^\/reply\s+(\S+)\s+([\s\S]+)/);
  if (!match) return res.sendStatus(200);

  const [, conversationId, responseText] = match;
  const targetUserId = sessions[conversationId];

  if (!targetUserId) {
    await axios.post(`${API}/sendMessage`, {
      chat_id: GROUP_ID,
      text: `❌ Conversa ${conversationId} não encontrada ou expirada.`
    });
    return res.sendStatus(200);
  }

  // Envia direto ao usuário — o bot não fala no grupo
  await axios.post(`${API}/sendMessage`, {
    chat_id: targetUserId,
    text: `👨‍💼 *Atendente:* ${responseText}`,
    parse_mode: 'Markdown'
  });

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => console.log('Servidor rodando na porta', process.env.PORT || 3000));
