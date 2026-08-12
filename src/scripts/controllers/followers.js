const platformStats = {
  instagram: 0,
  linkedin: 0,
  tiktok: 0,
  twitch: 0,
  twitter: 0,
  youtube: 0,
  ytmusic: 0,
  soundcloud: 0,
  spotify: 0
};

function formatShortNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'Updated just now';
  if (diff < 3600) return `Updated ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Updated ${Math.floor(diff / 3600)}h ago`;
  return `Updated ${Math.floor(diff / 86400)}d ago`;
}

function animateCount(el, target, duration = 900) {
  const start = parseInt(el.getAttribute('data-raw') || '0', 10);
  if (target <= start) {
    el.innerText = formatShortNumber(target);
    el.setAttribute('data-raw', target.toString());
    return;
  }
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    el.innerText = formatShortNumber(current);
    el.setAttribute('data-raw', current.toString());
    if (progress < 1) requestAnimationFrame(step);
    else {
      el.innerText = formatShortNumber(target);
      el.setAttribute('data-raw', target.toString());
    }
  }
  requestAnimationFrame(step);
}

export function initFollowersTracker() {
  const totalFollowersCountEl = document.getElementById('totalFollowersCount');
  const lastUpdatedEl = document.getElementById('followersLastUpdated');

  function updateLiveMetrics(animate = false) {
    const socialKeys = ['instagram', 'linkedin', 'tiktok', 'twitch', 'twitter', 'youtube'];
    let totalSocialFollowers = socialKeys.reduce((sum, k) => sum + (platformStats[k] || 0), 0);

    if (totalFollowersCountEl) {
      if (animate) {
        animateCount(totalFollowersCountEl, totalSocialFollowers);
      } else {
        totalFollowersCountEl.innerText = formatShortNumber(totalSocialFollowers).toUpperCase();
        totalFollowersCountEl.setAttribute('data-raw', totalSocialFollowers.toString());
      }
    }

    Object.keys(platformStats).forEach(key => {
      const badge = document.getElementById(`badge-${key}`);
      if (badge) {
        if (animate) {
          animateCount(badge, platformStats[key], 800);
        } else {
          badge.innerText = formatShortNumber(platformStats[key]);
          badge.setAttribute('data-raw', platformStats[key].toString());
        }
      }
    });
  }

  updateLiveMetrics(false);

  async function fetchFollowersData() {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${baseUrl}followers.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      let anyUpdated = false;
      if (json.platforms) {
        Object.keys(json.platforms).forEach(key => {
          const val = json.platforms[key]?.followers;
          if (typeof val === 'number' && platformStats.hasOwnProperty(key)) {
            platformStats[key] = val;
            anyUpdated = true;
          }
        });
      }

      if (anyUpdated) {
        updateLiveMetrics(true);
        if (lastUpdatedEl && json.last_updated) {
          lastUpdatedEl.textContent = formatRelativeTime(json.last_updated);
          lastUpdatedEl.title = new Date(json.last_updated).toLocaleString();
          lastUpdatedEl.classList.add('visible');
        }
      }
    } catch (err) {
      console.warn('[Kins] followers.json fetch failed:', err);
    }
  }

  fetchFollowersData();
  setInterval(fetchFollowersData, 30 * 60 * 1000);
}
