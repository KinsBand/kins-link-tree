import { showToast } from './toast.js';
import { getSubscriptionState, getSubscriberEmail } from './subscribeController.js';

export async function handleSongRequestSubmit(event, prefilledTitle = '') {
  event.preventDefault();
  const form = event.target;
  const songTitleInput = form.querySelector('#reqSongTitle');
  const artistInput = form.querySelector('#reqArtist');
  const reasonInput = form.querySelector('#reqReason');
  const emailInput = form.querySelector('#reqEmail');
  const submitBtn = form.querySelector('.submit-request-btn');

  const songTitle = songTitleInput?.value.trim() || prefilledTitle || 'Untitled Cover';
  const artist = artistInput?.value.trim() || 'Unknown Artist';
  const reason = reasonInput?.value.trim() || 'None provided';
  
  const isSubscribed = getSubscriptionState();
  const savedEmail = getSubscriberEmail();
  let email = emailInput?.value.trim() || '';
  if (!email || email === 'Subscribed Fan') {
    email = savedEmail || (isSubscribed ? 'Subscribed Fan' : 'Not provided');
  }

  if (!songTitle || !artist) {
    showToast('⚠️ Please provide both Song Title and Original Artist!');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-compact-disc fa-spin"></i> <span>Submitting...</span>`;
  }

  // Cover Song Request Discord Webhook (#cover-requests)
  const webhookUrl = 'https://discord.com/api/webhooks/1537817839199854622/MHgzq6-LRPJzNybsWx_wRhR7zDl5sCslZNxzHQtQRcMAn5rrB3Qu46X2IpNaMiP2uYXV';

  const discordPayload = {
    username: 'Kins Cover Request System',
    avatar_url: 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png',
    embeds: [
      {
        title: '🎵 New Cover Song Request',
        color: isSubscribed ? 0xF2FD43 : 0x5865f2,
        fields: [
          { name: 'Song Title', value: `**${songTitle}**`, inline: true },
          { name: 'Original Artist', value: `**${artist}**`, inline: true },
          { name: 'Fan Status', value: isSubscribed ? '✅ **Subscribed Fan** (Notified via Substack)' : '👤 Guest / Unsubscribed', inline: true },
          { name: 'Why should Kins cover this?', value: reason, inline: false },
          { name: 'Contact Email', value: email ? `\`${email}\`` : 'Not provided', inline: false }
        ],
        footer: { text: 'Kins Cover Request System • Forwarded to HelloKinsBand@gmail.com' },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });
  } catch (err) {
    console.warn('Cover request webhook error:', err);
  }

  const container = form.closest('.request-song-card-container');
  if (container) {
    container.innerHTML = `
      <div class="song-request-success-card">
        <div class="success-icon-box">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h4 class="success-title">Cover Request Locked In!</h4>
        <p class="success-desc">
          Rock on! Kins added <strong>"${songTitle}"</strong> by <strong>${artist}</strong> to their official cover wishlist.
        </p>
        <div class="success-meta-note">
          <i class="fa-solid fa-envelope"></i>
          <span>${isSubscribed ? `We'll update your inbox at <strong>${savedEmail || 'your email'}</strong> when it drops!` : 'You will receive release updates if Kins covers this track.'}</span>
        </div>
        <button class="request-another-btn brutal-press" id="requestAnotherBtn">
          <i class="fa-solid fa-rotate-left"></i> Request Another Song
        </button>
      </div>
    `;

    const requestAnotherBtn = container.querySelector('#requestAnotherBtn');
    if (requestAnotherBtn) {
      requestAnotherBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('overlaySearchInput');
        if (searchInput) {
          searchInput.dispatchEvent(new Event('input'));
        }
      });
    }
  }

  showToast(`🎵 Request for "${songTitle}" submitted to Kins!`);
}
