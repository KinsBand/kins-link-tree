/**
 * Live Chat & Audience Telemetry Controller
 * Handles live message streaming, crowd simulation, user message posting,
 * pinned message dismiss, and tip superchats.
 */

import { showToast } from './toast.js';
import { supabase } from '../../lib/supabase';

const SIMULATED_CROWD_MESSAGES = [
  { username: 'Newcastle_Punk', handle: '@newy_punk', message: 'VIVIAN ON THE MIC IS UNREAL 🔥🔥🔥', badge: { type: 'pit', label: 'PIT CREW', color: '#f2fd43' } },
  { username: 'FuzzPedalFanatic', handle: '@fuzz_charlie', message: 'That chorus tone on the Strat is pure 80s cure vibes', badge: { type: 'vip', label: 'VIP', color: '#00f2fe' } },
  { username: 'Sammy_G', handle: '@sammy_g', message: 'Trai is beating those drums like they owe him money!! 🥁', badge: null },
  { username: 'MoshPitSarah', handle: '@sarah_pit', message: 'Who else is in the front row right now?! Say hi 👋', badge: { type: 'pit', label: 'PIT CREW', color: '#f2fd43' } },
  { username: 'Alex_Bass', handle: '@alex_bassline', message: 'Oscar bass tone shaking my entire living room subs lmao', badge: null },
  { username: 'IndieRockAussie', handle: '@aus_indie', message: 'Kins are the best live band in NSW no cap 🎸', badge: { type: 'vip', label: 'VIP', color: '#00f2fe' } },
  { username: 'CambridgeCrowd', handle: '@cambridge_fan', message: 'BEER GARDEN SCREAMING!! 🍻🍻', badge: null },
  { username: 'Mia_Riffs', handle: '@miariffs', message: 'Encore better be Shadows in the Mist or we riot!!', badge: null }
];

export function initLiveChatController() {
  const chatMessagesList = document.getElementById('liveChatMessagesList');
  const chatInput = document.getElementById('liveChatInput');
  const chatSendBtn = document.getElementById('liveChatSendBtn');
  const chatForm = document.getElementById('liveChatForm');
  const pinnedBanner = document.getElementById('livePinnedAnnouncement');
  const dismissPinnedBtn = document.getElementById('dismissPinnedAnnouncementBtn');
  const tipModalTrigger = document.getElementById('liveOpenTipModalBtn');

  if (!chatMessagesList) return;

  // 1. Auto Scroll Helper
  function scrollToBottom(smooth = true) {
    if (!chatMessagesList) return;
    requestAnimationFrame(() => {
      chatMessagesList.scrollTo({
        top: chatMessagesList.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    });
  }

  // 2. Render Single Message
  function appendChatMessage({ username, handle, message, timestamp, badge, isTip, tipAmount, highlight }) {
    const li = document.createElement('li');
    li.className = `live-chat-message-item ${isTip ? 'super-tip-message' : ''} ${highlight ? 'user-self-message' : ''}`;

    const timeStr = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let badgeHtml = '';
    if (badge) {
      badgeHtml = `<span class="chat-user-badge badge-${badge.type}" style="--badge-accent: ${badge.color}">${badge.label}</span>`;
    }

    let tipHtml = '';
    if (isTip && tipAmount) {
      tipHtml = `
        <div class="chat-tip-banner">
          <i class="fa-solid fa-gift"></i>
          <span>TIPPED <strong>${tipAmount}</strong> TO THE BAND!</span>
        </div>
      `;
    }

    li.innerHTML = `
      <div class="chat-msg-header">
        <div class="chat-author-wrap">
          <span class="chat-author-name">${escapeHtml(username)}</span>
          ${badgeHtml}
        </div>
        <span class="chat-msg-time">${timeStr}</span>
      </div>
      ${tipHtml}
      <div class="chat-msg-body">${escapeHtml(message)}</div>
    `;

    chatMessagesList.appendChild(li);
    scrollToBottom(true);
  }

  // 3. User Message Submission
  function handleSendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    const text = (chatInput?.value || '').trim();
    if (!text) return;

    const userHandle = localStorage.getItem('kins_fan_handle') || '@fan_' + Math.floor(1000 + Math.random() * 9000);
    const userName = userHandle.replace('@', '');

    appendChatMessage({
      username: userName,
      handle: userHandle,
      message: text,
      badge: { type: 'vip', label: 'YOU', color: '#f2fd43' },
      highlight: true
    });

    if (chatInput) {
      chatInput.value = '';
      chatInput.focus();
    }

    // If Supabase is available, insert into live_chat table
    if (supabase) {
      supabase.from('live_chat').insert([
        { handle: userHandle, username: userName, message: text, created_at: new Date().toISOString() }
      ]).then(() => {}).catch(() => {});
    }
  }

  // Form submit handler (handles Enter key when focused in input)
  if (chatForm) {
    chatForm.addEventListener('submit', handleSendMessage);
  }

  // Direct Click on Send Button
  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', (e) => {
      if (chatForm) {
        // If inside form, triggering form submit is sufficient, but ensure message sends cleanly
        handleSendMessage(e);
      } else {
        handleSendMessage(e);
      }
    });
  }

  // Direct Enter Key on Input (prevent accidental newlines or forms not submitting)
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
      }
    });
  }

  // 4. Pinned Message Dismiss
  if (dismissPinnedBtn && pinnedBanner) {
    dismissPinnedBtn.addEventListener('click', () => {
      pinnedBanner.style.opacity = '0';
      pinnedBanner.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        pinnedBanner.style.display = 'none';
      }, 250);
    });
  }

  // 5. Tip Modal Trigger
  if (tipModalTrigger) {
    tipModalTrigger.addEventListener('click', () => {
      const tipModal = document.getElementById('liveTipJarModal');
      if (tipModal) {
        tipModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
      }
    });
  }

  // 6. Supabase Realtime Listener (if table exists)
  if (supabase) {
    try {
      supabase
        .channel('public:live_chat')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat' }, (payload) => {
          if (payload && payload.new) {
            const m = payload.new;
            appendChatMessage({
              username: m.username || 'Fan',
              handle: m.handle || '@fan',
              message: m.message,
              badge: null
            });
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription not available, using simulated stream');
    }
  }

  // 7. Dynamic Simulated Crowd Chatter (injects periodic fan excitement)
  let crowdIndex = 0;
  setInterval(() => {
    // Only inject if user has not scrolled far up
    const isNearBottom = chatMessagesList.scrollHeight - chatMessagesList.scrollTop - chatMessagesList.clientHeight < 140;
    if (isNearBottom && SIMULATED_CROWD_MESSAGES.length > 0) {
      const msg = SIMULATED_CROWD_MESSAGES[crowdIndex % SIMULATED_CROWD_MESSAGES.length];
      crowdIndex++;
      appendChatMessage(msg);
    }
  }, 7500);

  // Global helper for Tip submission from modal
  window.triggerLiveTipSuperchat = function(amount, shoutout) {
    const userHandle = localStorage.getItem('kins_fan_handle') || '@superfan';
    const userName = userHandle.replace('@', '');
    appendChatMessage({
      username: userName,
      handle: userHandle,
      message: shoutout || 'Rock on Kins! Newcastle loves you!! 🔥',
      isTip: true,
      tipAmount: amount,
      badge: { type: 'vip', label: 'SUPER TIPPER', color: '#53fc18' }
    });
    showToast(`🎉 Super Tip of ${amount} posted to Live Chat!`, 'success');
  };

  // Initial scroll to bottom
  scrollToBottom(false);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
