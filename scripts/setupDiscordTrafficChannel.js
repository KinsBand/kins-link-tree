// scripts/setupDiscordTrafficChannel.js
// One-time setup script to initialize #traffic channel and webhook via environment variables

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1531126774061203524';

if (!BOT_TOKEN) {
  console.error('❌ Error: DISCORD_BOT_TOKEN environment variable is required.');
  process.exit(1);
}

async function main() {
  console.log('📡 Connecting to Discord API for Guild ID:', GUILD_ID);

  // 1. Check existing channels in Guild
  const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
    headers: { Authorization: `Bot ${BOT_TOKEN}` }
  });
  const channels = await channelsRes.json();
  let trafficChan = Array.isArray(channels) ? channels.find(c => c.name === 'traffic') : null;

  if (!trafficChan) {
    console.log('Creating #traffic channel...');
    const createRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'traffic',
        type: 0,
        topic: '⚡ Live Hourly Traffic Radar & Website Observability'
      })
    });
    trafficChan = await createRes.json();
    console.log('✅ Channel #traffic created! ID:', trafficChan.id);
  } else {
    console.log('✅ Found existing #traffic channel! ID:', trafficChan.id);
  }

  // 2. Create Webhook in #traffic
  const webhooksRes = await fetch(`https://discord.com/api/webhooks/${trafficChan.id}/webhooks`, {
    headers: { Authorization: `Bot ${BOT_TOKEN}` }
  });
  const webhooks = await webhooksRes.json();
  let webhook = Array.isArray(webhooks) ? webhooks.find(w => w.name === 'Kins Traffic Radar') : null;

  if (!webhook) {
    console.log('Creating webhook in #traffic...');
    const createWh = await fetch(`https://discord.com/api/v10/channels/${trafficChan.id}/webhooks`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Kins Traffic Radar'
      })
    });
    webhook = await createWh.json();
    console.log('✅ Webhook created! ID:', webhook.id);
  } else {
    console.log('✅ Found existing webhook! ID:', webhook.id);
  }

  const webhookUrl = `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`;
  console.log('🎯 DISCORD_TRAFFIC_WEBHOOK_URL=' + webhookUrl);
  return webhookUrl;
}

main().catch(console.error);
