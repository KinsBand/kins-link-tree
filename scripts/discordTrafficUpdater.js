// scripts/discordTrafficUpdater.js
// Single-Message Hourly Live Traffic Radar Bot for Discord (#traffic channel)
// Edits a single pinned message every 60 minutes without channel spam.

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_TRAFFIC_WEBHOOK_URL;

const STATE_FILE_PATH = path.resolve('.discord_traffic_state.json');

function getStoredMessageId() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
      return data.message_id || null;
    }
  } catch (e) {}
  return null;
}

function saveStoredMessageId(messageId) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify({ message_id: messageId, updated_at: new Date().toISOString() }, null, 2));
  } catch (e) {}
}

async function fetchHourlyTraffic() {
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: events, error } = await sb
    .from('analytics_events')
    .select('*')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false });

  if (error || !events) {
    return {
      visitors: 0,
      pageviews: 0,
      audioPlays: 0,
      outbound: 0,
      topChannel: 'Direct',
      topRegion: 'Sydney / NSW',
      level: '🟢 Low Traffic'
    };
  }

  const visitors = new Set(events.map(e => e.session_id)).size;
  const pageviews = events.filter(e => e.event_type === 'pageview').length;
  const audioPlays = events.filter(e => e.event_type === 'audio_milestone' && e.metadata?.milestone === 'play_start').length;
  const outbound = events.filter(e => e.event_type === 'outbound_click').length;

  const channelMap = {};
  const regionMap = {};

  events.forEach(e => {
    const ch = e.metadata?.inbound_channel || 'Direct';
    const reg = e.metadata?.region || 'Sydney / NSW';
    channelMap[ch] = (channelMap[ch] || 0) + 1;
    regionMap[reg] = (regionMap[reg] || 0) + 1;
  });

  const topChannel = Object.entries(channelMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Direct';
  const topRegion = Object.entries(regionMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sydney / NSW';

  // 5 Traffic Tiers
  let level = '🟢 Low';
  let color = 0x10b981; // Green

  if (visitors > 150) {
    level = '🔥 HIGH TRAFFIC SPIKE (150+ fans/hr)';
    color = 0xff0055; // Hot Pink/Red
  } else if (visitors > 80) {
    level = '🔴 Medium-High (81 - 150 fans/hr)';
    color = 0xf43f5e; // Rose Red
  } else if (visitors > 40) {
    level = '🟠 Medium (41 - 80 fans/hr)';
    color = 0xf59e0b; // Amber
  } else if (visitors > 15) {
    level = '🟡 Low-Medium (16 - 40 fans/hr)';
    color = 0xf2fd43; // Neon Yellow
  } else {
    level = '🟢 Low (1 - 15 fans/hr)';
    color = 0x10b981; // Emerald
  }

  return { visitors, pageviews, audioPlays, outbound, topChannel, topRegion, level, color };
}

function buildDiscordPayload(stats) {
  const timestamp = new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit' });
  const dateStr = new Date().toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', month: 'short', day: 'numeric' });

  return {
    username: 'Kins Traffic Radar',
    avatar_url: 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/images/logo/kins-logo.webp',
    embeds: [
      {
        title: '⚡ KINS BAND — LIVE HOURLY TRAFFIC RADAR',
        description: `**Current Status:** \`${stats.level}\`\n*Auto-updated every 60 minutes in #traffic.*`,
        color: stats.color,
        fields: [
          {
            name: '👥 Past Hour Visitors',
            value: `**${stats.visitors} unique fans** (${stats.pageviews} views)`,
            inline: true
          },
          {
            name: '🎵 Audio Auditions',
            value: `**${stats.audioPlays} track plays**`,
            inline: true
          },
          {
            name: '💿 Outbound Stream Clicks',
            value: `**${stats.outbound} conversions**`,
            inline: true
          },
          {
            name: '🔗 Top Inbound Bio Link',
            value: `\`${stats.topChannel}\``,
            inline: true
          },
          {
            name: '📍 Top Fan Region',
            value: `\`${stats.topRegion}\``,
            inline: true
          },
          {
            name: '🕒 Last Radar Scan',
            value: `${dateStr} at ${timestamp} AEST`,
            inline: true
          }
        ],
        footer: {
          text: 'Kins Official Observability • Zero-Spam Single Message Updater',
          icon_url: 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/images/logo/kins-logo.webp'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };
}

export async function updateDiscordTrafficStatus() {
  console.log('📡 Scanning Supabase for hourly traffic metrics...');
  const stats = await fetchHourlyTraffic();
  const payload = buildDiscordPayload(stats);

  let messageId = getStoredMessageId();

  if (messageId) {
    console.log(`🔄 Editing existing Discord status message (ID: ${messageId})...`);
    const editUrl = `${DISCORD_WEBHOOK_URL}/messages/${messageId}`;
    try {
      const res = await fetch(editUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log('✅ Discord status message updated successfully!');
        return;
      } else {
        console.warn('⚠️ Could not edit existing message (might be deleted). Creating a new one...');
        messageId = null;
      }
    } catch (e) {
      console.warn('⚠️ Discord edit request failed:', e);
      messageId = null;
    }
  }

  // Create initial message if none exists
  console.log('✨ Creating initial Discord radar status card...');
  const createUrl = `${DISCORD_WEBHOOK_URL}?wait=true`;
  try {
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const createdMsg = await res.json();
      if (createdMsg.id) {
        saveStoredMessageId(createdMsg.id);
        console.log(`✅ Status card created and saved! Message ID: ${createdMsg.id}`);
      }
    } else {
      console.error('❌ Failed to post status card to Discord:', res.status, await res.text());
    }
  } catch (err) {
    console.error('❌ Error sending Discord webhook:', err);
  }
}

// Run immediately if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  updateDiscordTrafficStatus();
}
