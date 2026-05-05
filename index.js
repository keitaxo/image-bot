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
// 🔒 TEMPLATE VALIDATION
// =========================
function isValidIntro(content) {
  // Normalize lines
  const lines = content
    .replace(/\r/g, "")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // Fields in correct order
  const requiredFields = [
    "age",
    "name",
    "pronouns",
    "country",
    "likes",
    "dislike",
    "hobbies",
    "languages",
    "nationality",
    "extra info"
  ];

  let fieldIndex = 0;

  for (const line of lines) {
    if (fieldIndex >= requiredFields.length) break;

    // Check if this line contains the next required field
    if (line.toLowerCase().includes(requiredFields[fieldIndex])) {
      fieldIndex++;
    }
  }

  // Only valid if all fields appear in order
  return fieldIndex === requiredFields.length;
}

// =========================
// 🎯 MAIN EVENT
// =========================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 👑 OWNER BYPASS
  if (message.guild && message.author.id === message.guild.ownerId) return;

  // =========================
  // 🖼 IMAGE FILTER
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
// 🔌 READY EVENT
// =========================
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);