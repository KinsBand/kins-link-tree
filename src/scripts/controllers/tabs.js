import { trackKinsInteraction } from '../../lib/analytics';

export function setupSegmentedSwitcher(tabSelector, contentSelector) {
  const tabs = document.querySelectorAll(tabSelector);
  const contents = document.querySelectorAll(contentSelector);

  if (tabs.length === 0) return;

  const containers = new Set();
  tabs.forEach(tab => {
    const parent = tab.closest('.segmented-switcher-box') || tab.closest('.brutal-tab-switcher') || tab.parentElement;
    if (parent) containers.add(parent);
  });

  containers.forEach(container => {
    // Only add sliding pill for segmented-switcher-box (not brutal-tab-switcher)
    if (container.classList.contains('segmented-switcher-box')) {
      let pill = container.querySelector('.switcher-active-pill');
      if (!pill) {
        pill = document.createElement('div');
        pill.className = 'switcher-active-pill';
        container.insertBefore(pill, container.firstChild);
      }

      function updatePillPosition() {
        const activeTab = container.querySelector(`${tabSelector}.active`) || container.querySelector('.switcher-tab.active');
        if (activeTab && pill) {
          pill.style.transform = `translateX(${activeTab.offsetLeft}px)`;
          pill.style.width = `${activeTab.offsetWidth}px`;
          pill.style.height = `${activeTab.offsetHeight}px`;
          pill.style.top = `${activeTab.offsetTop}px`;
        }
      }

      requestAnimationFrame(() => updatePillPosition());
      setTimeout(() => updatePillPosition(), 60);

      window.addEventListener('resize', updatePillPosition);
    }
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = tab.getAttribute('data-target');
      const parentContainer = tab.closest('.segmented-switcher-box') || tab.closest('.brutal-tab-switcher') || tab.parentElement;

      if (parentContainer) {
        const siblingTabs = parentContainer.querySelectorAll(tabSelector);
        siblingTabs.forEach(t => t.classList.remove('active'));
      }
      tab.classList.add('active');

      // Track Tab Switch Interaction
      trackKinsInteraction('links_tab_switched', 'social', {
        selected_tab: tab.innerText?.trim() || targetId,
        target_id: targetId || '',
        container_scope: 'main:links'
      });

      if (parentContainer && parentContainer.classList.contains('segmented-switcher-box')) {
        const pill = parentContainer.querySelector('.switcher-active-pill');
        if (pill) {
          pill.style.transform = `translateX(${tab.offsetLeft}px)`;
          pill.style.width = `${tab.offsetWidth}px`;
          pill.style.height = `${tab.offsetHeight}px`;
          pill.style.top = `${tab.offsetTop}px`;
        }
      }

      contents.forEach(content => {
        if (content.id === targetId) {
          content.classList.add('active');
          content.style.display = 'block';
        } else {
          content.classList.remove('active');
          content.style.display = 'none';
        }
      });
    });
  });
}

