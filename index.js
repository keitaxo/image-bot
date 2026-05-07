require('dotenv').config();

const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// CONFIG
// =========================
const config = {
  imageOnlyChannels: [
    "1498949958701940736",
    "1496264468273954976"
  ],

  allowedLinkChannels: [
    "1499029471297015989"
  ],

  allowedLinkRoles: [
    "1495747720319602799",
    "1499876762283409408"
  ],

  whitelistedDomains: [
    "youtube.com",
    "youtu.be",
    "discord.gg"
  ],

  introChannelId: "1496299134574133321"
};

// GIF permission role
const GIF_ROLE_IDS = ["1495890571397435442"];

// =========================
// STRIKE SYSTEM
// =========================
const userStrikes = new Map();

// =========================
// SLUR FILTER
// =========================
const severeSlurPatterns = [

  // Main forms
  /n+i+g+g+a+/i,
  /n+i+g+g+e+r+/i,

  // Shortened forms
  /\bnga\b/i,
  /^n+g+a+$/i
];

function normalizeText(text) {
  return text
    .toLowerCase()

    // Common replacements
    .replace(/1/g, "i")
    .replace(/!/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/@/g, "a")
    .replace(/0/g, "o")
    .replace(/\$/g, "s")

    // Remove symbols/spaces
    .replace(/[^a-z0-9]/g, "")

    // Compress repeated letters
    .replace(/(.)\1+/g, "$1");
}

// =========================
// INTRO TEMPLATE
// =========================
function isValidIntro(content) {
  const lines = content
    .replace(/\r/g, "")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

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

    if (line.toLowerCase().includes(requiredFields[fieldIndex])) {
      fieldIndex++;
    }
  }

  return fieldIndex === requiredFields.length;
}

// =========================
// LINK FUNCTIONS
// =========================
function containsLink(content) {
  return /(https?:\/\/[^\s]+)/gi.test(content);
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

// =========================
// MESSAGE EVENT
// =========================
client.on('messageCreate', async (message) => {

  if (message.author.bot || !message.guild) return;
  if (message.author.id === message.guild.ownerId) return;

  // =========================
  // SLUR FILTER
  // =========================
  const normalized = normalizeText(message.content);

  const severeMatch = severeSlurPatterns.some(pattern =>
    pattern.test(normalized)
  );

  if (severeMatch) {

    await message.delete().catch(() => {});

    const strikes =
      (userStrikes.get(message.author.id) || 0) + 1;

    userStrikes.set(message.author.id, strikes);

    // Punishments
    if (strikes >= 5) {

      await message.guild.members.ban(message.author.id, {
        reason: "Repeated severe slur usage"
      }).catch(() => {});

    } else if (strikes >= 3) {

      await message.member.timeout(
        24 * 60 * 60 * 1000,
        "Repeated severe slur usage"
      ).catch(() => {});

    } else {

      await message.member.timeout(
        60 * 60 * 1000,
        "Severe slur detected"
      ).catch(() => {});
    }

    const warn = await message.channel.send(
      `${message.author}, severe slurs are prohibited. Strike ${strikes}/5`
    );

    setTimeout(() => {
      warn.delete().catch(() => {});
    }, 5000);

    return;
  }

  // =========================
  // COMMANDS
  // =========================
  if (message.content.startsWith("!")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const args = message.content.split(" ");
    const cmd = args[0].toLowerCase();

    if (cmd === "!addlinkchannel") {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply("Mention a channel.");

      if (!config.allowedLinkChannels.includes(channel.id)) {
        config.allowedLinkChannels.push(channel.id);
      }

      return message.reply("Link channel added.");
    }

    if (cmd === "!removelinkchannel") {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply("Mention a channel.");

      config.allowedLinkChannels =
        config.allowedLinkChannels.filter(id => id !== channel.id);

      return message.reply("Link channel removed.");
    }

    if (cmd === "!addlinkrole") {
      const role = message.mentions.roles.first();
      if (!role) return message.reply("Mention a role.");

      if (!config.allowedLinkRoles.includes(role.id)) {
        config.allowedLinkRoles.push(role.id);
      }

      return message.reply("Role added.");
    }

    if (cmd === "!removelinkrole") {
      const role = message.mentions.roles.first();
      if (!role) return message.reply("Mention a role.");

      config.allowedLinkRoles =
        config.allowedLinkRoles.filter(id => id !== role.id);

      return message.reply("Role removed.");
    }

    if (cmd === "!addimagechannel") {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply("Mention a channel.");

      if (!config.imageOnlyChannels.includes(channel.id)) {
        config.imageOnlyChannels.push(channel.id);
      }

      return message.reply("Image-only channel added.");
    }

    if (cmd === "!removeimagechannel") {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply("Mention a channel.");

      config.imageOnlyChannels =
        config.imageOnlyChannels.filter(id => id !== channel.id);

      return message.reply("Image-only channel removed.");
    }

    if (cmd === "!config") {
      return message.reply(
`Current Config

Allowed Link Channels:
${config.allowedLinkChannels.length
  ? config.allowedLinkChannels.map(id => `<#${id}>`).join("\n")
  : "None"}

Allowed Link Roles:
${config.allowedLinkRoles.length
  ? config.allowedLinkRoles.map(id => `<@&${id}>`).join("\n")
  : "None"}

Image Only Channels:
${config.imageOnlyChannels.length
  ? config.imageOnlyChannels.map(id => `<#${id}>`).join("\n")
  : "None"}`
      );
    }
  }

  // =========================
  // GIF BYPASS
  // =========================
  const hasGifRole = message.member.roles.cache.some(role =>
    GIF_ROLE_IDS.includes(role.id)
  );

  const hasGifAttachment = message.attachments.some(att =>
    att.contentType === "image/gif" ||
    att.name?.toLowerCase().endsWith(".gif")
  );

  const hasGifLink =
    /(https?:\/\/.*\.gif)/i.test(message.content) ||
    /(tenor\.com|giphy\.com|media\.discordapp\.net|cdn\.discordapp\.com)/i.test(message.content);

  const gifAllowed =
    hasGifRole && (hasGifAttachment || hasGifLink);

  // =========================
  // LINK FILTER
  // =========================
  if (containsLink(message.content)) {

    if (gifAllowed) return;

    if (config.allowedLinkChannels.includes(message.channel.id)) return;

    const hasAllowedRole = message.member.roles.cache.some(role =>
      config.allowedLinkRoles.includes(role.id)
    );

    if (hasAllowedRole) return;

    const urls =
      message.content.match(/(https?:\/\/[^\s]+)/gi) || [];

    const allWhitelisted = urls.every(url => {
      const domain = getDomain(url);

      return config.whitelistedDomains.some(d =>
        domain?.includes(d)
      );
    });

    if (!allWhitelisted) {
      await message.delete();

      const warn = await message.channel.send(
        `${message.author}, links are not allowed here.`
      );

      setTimeout(() => {
        warn.delete().catch(() => {});
      }, 3000);

      return;
    }
  }

  // =========================
  // IMAGE FILTER
  // =========================
  if (config.imageOnlyChannels.includes(message.channel.id)) {

    const hasImageAttachment = message.attachments.some(att =>
      att.contentType?.startsWith('image/')
    );

    const hasImageLink =
      /(https?:\/\/.*\.(png|jpg|jpeg|webp))/i.test(message.content);

    const hasImage =
      hasImageAttachment || hasImageLink || gifAllowed;

    if (!hasImage) {

      await message.delete();

      const warn = await message.channel.send(
        `${message.author}, only images are allowed here.`
      );

      setTimeout(() => {
        warn.delete().catch(() => {});
      }, 3000);

      return;
    }
  }

  // =========================
  // INTRO FILTER
  // =========================
  if (message.channel.id === config.introChannelId) {

    if (!isValidIntro(message.content)) {

      await message.delete();

      try {
        await message.author.send(
          "Your intro was removed because it doesn't follow the template."
        );
      } catch {}
    }
  }
});

// =========================
// READY
// =========================
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);