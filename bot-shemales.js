require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ],
});

// Detectar entrada a canal de voz
client.on("voiceStateUpdate", async (oldState, newState) => {
  if (!newState.channel) return; // Se salió
  if (oldState.channelId === newState.channelId) return; // No cambió canal
  if (newState.member.user.bot) return; // No saludar bots

  const userId = newState.member.user.id;
  const guild = newState.guild;
  const channel = newState.channel;

  console.log(`👤 ${newState.member.user.username} entró a ${channel.name}`);

  // Buscar archivo personalizado
  const audioPath = findAudio(userId);

  if (!audioPath) {
    console.log("⚠ No hay audio para este usuario");
    return;
  }

  playAudio(channel, guild, audioPath);
});

// Obtener audio correcto
function findAudio(userId) {
  const base = path.join(__dirname, "audios");

  const userFile = path.join(base, `${userId}.mp3`);
  const defaultFile = path.join(base, "default.mp3");

  if (fs.existsSync(userFile)) return userFile;
  if (fs.existsSync(defaultFile)) return defaultFile;

  return null;
}

// Reproducir audio
function playAudio(channel, guild, file) {
  console.log(`▶ Reproduciendo: ${file}`);

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });

  const player = createAudioPlayer();
  const resource = createAudioResource(file);

  player.play(resource);
  connection.subscribe(player);

  // Salir cuando termine
  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
  });
}

client.once("ready", () => {
  console.log(`🤖 Bot activo como ${client.user.tag}`);
});

client.login(process.env.TOKEN);