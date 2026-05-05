require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// 🖼️ IMAGE-ONLY CHANNELS
// =========================
const IMAGE_ONLY_CHANNELS = [
  "1498949958701940736",
  "1496264468273954976"
];

// =========================
// 📋 INTRO CHANNEL
// =========================
const INTRO_CHANNEL_ID = "1496299134574133321";

// =========================
// 🔒 STRICT TEMPLATE MATCH (FIXED)
// =========================
function isValidIntro(content) {
  const clean = content.replace(/\r/g, "").trim();

  const template = `𓎢𓎠𓎟𓎟𓎠𓎟𓎠𓎟𓎠𓎠𓎡
　
**୨୧　：about me　♬**
　
♡　―　age : 
✿　―　name: 
♡　―　pronouns: 
♡　―　country: 
　
𓎢𓎠𓎟𓎟𓎠𓎟𓎠𓎟𓎠𓎠𓎡
　
✿　―　likes: 
♡　―　dislike:
✿　―　hobbies:
♡　―　languages:
✿　―　nationality:
♡　―　extra info :
𓎢𓎠𓎟𓎟𓎠𓎟𓎠𓎟𓎠𓎠𓎡`;

  return clean === template;
}

// =========================
// 🎯 MAIN EVENT
// =========================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 👑 OWNER BYPASS ONLY
  if (message.guild && message.author.id === message.guild.ownerId) {
    return;
  }

  // =========================
  // 🖼️ IMAGE FILTER
  // =========================
  if (IMAGE_ONLY_CHANNELS.includes(message.channel.id)) {

    const hasImageAttachment = message.attachments.some(att =>
      att.contentType?.startsWith('image/')
    );

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
        console.error('Image delete error:', err);
      }
    }

    return;
  }

  // =========================
  // 📋 INTRO FILTER
  // =========================
  if (message.channel.id === INTRO_CHANNEL_ID) {
    if (!isValidIntro(message.content)) {
      try {
        await message.delete();

        await message.author.send(
          "Your intro was removed because it doesn't follow the required template."
        );

      } catch (err) {
        console.error('Intro delete error:', err);
      }
    }
  }
});

// =========================
// 🔌 READY EVENT (FIXED)
// =========================
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);