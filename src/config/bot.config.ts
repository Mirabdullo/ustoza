import { registerAs } from '@nestjs/config';

export default registerAs('bot', () => ({
  token: process.env.BOT_TOKEN,
  webhookUrl: process.env.BOT_WEBHOOK_URL,
  webhookSecret: process.env.BOT_WEBHOOK_SECRET,
  proxyUrl: process.env.BOT_PROXY_URL || '',
}));
