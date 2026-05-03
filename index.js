require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Channels where ONLY images are allowed
const IMAGE_ONLY_CHANNELS = [
  "1498949958701940736",
  "1496264468273954976"
];

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Only apply in selected channels
  if (!IMAGE_ONLY_CHANNELS.includes(message.channel.id)) return;

  // Check image attachments
  const hasImageAttachment = message.attachments.some(att =>
    att.contentType?.startsWith('image/')
  );

  // Check image links
  const hasImageLink = /(https?:\/\/.*\.(png|jpg|jpeg|gif|webp))/i.test(message.content);

  const hasImage = hasImageAttachment || hasImageLink;

  if (!hasImage) {
    try {
      await message.delete();

      const warn = await message.channel.send(
        `⚠️ ${message.author}, only images are allowed in this channel.`
      );

      setTimeout(() => warn.delete().catch(() => {}), 3000);

    } catch (err) {
      console.error('Delete error:', err);
    }
  }
});

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);