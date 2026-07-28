import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Interaction } from 'discord.js';
import { readDB, writeDB, Order } from './db';
import { sendOrderConfirmation } from './email';

let client: Client | null = null;

export function initBot() {
  if (client) return;

  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !clientId || !guildId) {
    console.log("[Discord Bot] Missing Env variables (DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID). Bot won't start.");
    return;
  }

  client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  const commands = [
    {
      name: 'orderconf',
      description: 'Set this channel to receive new order notifications',
    },
    {
      name: 'clearlogs',
      description: 'Set this channel to receive cleared logs data',
    }
  ];

  client.once('ready', async () => {
    console.log(`[Discord Bot] Logged in as ${client?.user?.tag}`);
    try {
      const rest = new REST({ version: '10' }).setToken(token);
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log('[Discord Bot] Successfully registered slash commands.');
    } catch (error) {
      console.error('[Discord Bot] Error registering slash commands:', error);
    }
  });

  client.on('interactionCreate', async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const db = readDB();
        const settings = db.settings || {};

        if (interaction.commandName === 'orderconf') {
          settings.orderChannelId = interaction.channelId;
          db.settings = settings;
          writeDB(db);
          await interaction.reply({ content: '✅ This channel has been set to receive New Order Notifications.', ephemeral: true });
        } else if (interaction.commandName === 'clearlogs') {
          settings.clearLogsChannelId = interaction.channelId;
          db.settings = settings;
          writeDB(db);
          await interaction.reply({ content: '✅ This channel has been set to receive Cleared Logs backups.', ephemeral: true });
        }
      } else if (interaction.isButton()) {
        const customId = interaction.customId;

        if (customId.startsWith('approve_order_')) {
          const orderId = customId.split('_')[2];
          const db = readDB();
          const order = db.orders.find(o => o.orderId === orderId);

          if (!order) {
            return interaction.reply({ content: '❌ Order not found in database.', ephemeral: true });
          }
          if (order.status !== 'PENDING') {
            return interaction.reply({ content: `❌ Order is already ${order.status}.`, ephemeral: true });
          }

          const modal = new ModalBuilder()
            .setCustomId(`modal_approve_${orderId}`)
            .setTitle('Approve Order & Delivery Details');

          const deliveryInput = new TextInputBuilder()
            .setCustomId('deliveryDetails')
            .setLabel('Delivery Details (VPS IP, Credentials)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter IP, User, Password, Panel Link, etc.')
            .setRequired(false);

          const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(deliveryInput);
          modal.addComponents(firstActionRow);

          await interaction.showModal(modal);

        } else if (customId.startsWith('reject_order_')) {
          const orderId = customId.split('_')[2];
          const db = readDB();
          const order = db.orders.find(o => o.orderId === orderId);

          if (!order) {
            return interaction.reply({ content: '❌ Order not found in database.', ephemeral: true });
          }
          if (order.status !== 'PENDING') {
            return interaction.reply({ content: `❌ Order is already ${order.status}.`, ephemeral: true });
          }

          order.status = 'REJECTED';
          writeDB(db);

          const originalEmbed = interaction.message.embeds[0];
          const embed = EmbedBuilder.from(originalEmbed)
            .setColor(0xFF0000)
            .setTitle(`Order #${orderId} - REJECTED`);

          await interaction.update({ embeds: [embed], components: [] });
          await interaction.followUp({ content: `Order #${orderId} rejected successfully.`, ephemeral: true });
        }
      } else if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('modal_approve_')) {
          const orderId = interaction.customId.split('_')[2];
          const deliveryDetails = interaction.fields.getTextInputValue('deliveryDetails');

          const db = readDB();
          const order = db.orders.find(o => o.orderId === orderId);

          if (!order) {
            return interaction.reply({ content: '❌ Order not found in database.', ephemeral: true });
          }

          order.status = 'APPROVED';
          order.paymentVerified = true;
          if (deliveryDetails && deliveryDetails.trim().length > 0) {
            order.deliveryDetails = deliveryDetails.trim();
          }
          writeDB(db);

          // Send Confirmation Email
          await sendOrderConfirmation(order);

          const originalEmbed = interaction.message.embeds[0];
          const embed = EmbedBuilder.from(originalEmbed)
            .setColor(0x00FF00)
            .setTitle(`Order #${orderId} - APPROVED`)
            .addFields({ name: 'Delivery Details Provided', value: deliveryDetails || 'None', inline: false });

          await interaction.update({ embeds: [embed], components: [] });
          await interaction.followUp({ content: `Order #${orderId} approved successfully and email sent!`, ephemeral: true });
        }
      }
    } catch (error) {
      console.error("[Discord Bot] Error handling interaction:", error);
    }
  });

  client.login(token).catch(err => {
    console.error("[Discord Bot] Failed to login:", err.message);
  });
}

export async function sendNewOrderNotification(order: Order) {
  if (!client || !client.isReady()) return;

  const db = readDB();
  const channelId = db.settings?.orderChannelId || process.env.DISCORD_ORDER_CHANNEL_ID;
  if (!channelId) return;

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle(`New Order #${order.orderId}`)
      .setColor(0xFFA500)
      .addFields(
        { name: 'User', value: order.user.email, inline: true },
        { name: 'Product', value: order.product, inline: true },
        { name: 'Price', value: `₹${order.price}`, inline: true },
        { name: 'Payment UTR', value: order.utr || 'Direct Payment', inline: true }
      )
      .setTimestamp();

    if (order.clientConfig && Object.keys(order.clientConfig).length > 0) {
      let configText = '';
      for (const [key, value] of Object.entries(order.clientConfig)) {
        if (value) {
          configText += `**${key.replace('_', ' ').toUpperCase()}**: ${value}\n`;
        }
      }
      embed.addFields({ name: 'Client Configuration', value: configText, inline: false });
    }

    const approveBtn = new ButtonBuilder()
      .setCustomId(`approve_order_${order.orderId}`)
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success);

    const rejectBtn = new ButtonBuilder()
      .setCustomId(`reject_order_${order.orderId}`)
      .setLabel('Reject')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approveBtn, rejectBtn);

    // @ts-ignore
    await channel.send({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error("[Discord Bot] Failed to send order notification:", err);
  }
}
