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
    if (tab.dataset.tabSwitcherBound) return;
    tab.dataset.tabSwitcherBound = 'true';
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = tab.getAttribute('data-target');
      const parentContainer = tab.closest('.segmented-switcher-box') || tab.closest('.brutal-tab-switcher') || tab.parentElement;

      if (tab.classList.contains('active')) return;

      if (parentContainer) {
        const siblingTabs = parentContainer.querySelectorAll(tabSelector);
        siblingTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
      }
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      if (parentContainer && parentContainer.classList.contains('segmented-switcher-box')) {
        const pill = parentContainer.querySelector('.switcher-active-pill');
        if (pill) {
          pill.style.transform = `translateX(${tab.offsetLeft}px)`;
          pill.style.width = `${tab.offsetWidth}px`;
          pill.style.height = `${tab.offsetHeight}px`;
          pill.style.top = `${tab.offsetTop}px`;
        }
      }

      const wrapper = document.getElementById('tabPanelsWrapper') || (contents[0] && contents[0].parentElement);
      let startHeight = 0;
      if (wrapper) {
        if (wrapper._heightAnimTimer) {
          clearTimeout(wrapper._heightAnimTimer);
          wrapper._heightAnimTimer = null;
        }
        startHeight = wrapper.offsetHeight;
      }

      contents.forEach(content => {
        if (content._tabLeaveTimeout) {
          clearTimeout(content._tabLeaveTimeout);
          content._tabLeaveTimeout = null;
        }

        if (content.id === targetId) {
          content.classList.remove('is-leaving');
          content.classList.add('active');
          content.style.display = '';
        } else if (content.classList.contains('active')) {
          content.classList.remove('active');
          content.classList.add('is-leaving');
          content.style.display = '';
          content._tabLeaveTimeout = setTimeout(() => {
            content.classList.remove('is-leaving');
            content._tabLeaveTimeout = null;
          }, 180);
        } else {
          content.classList.remove('active', 'is-leaving');
          content.style.display = '';
        }
      });

      if (wrapper) {
        const targetContent = Array.from(contents).find(c => c.id === targetId);
        if (targetContent) {
          const targetHeight = targetContent.offsetHeight;
          if (startHeight > 0 && targetHeight > 0 && Math.abs(startHeight - targetHeight) > 3) {
            wrapper.style.height = `${startHeight}px`;
            wrapper.style.overflow = 'hidden';
            wrapper.style.transition = 'none';

            // Force reflow
            void wrapper.offsetHeight;

            wrapper.style.transition = 'height 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
            wrapper.style.height = `${targetHeight}px`;

            wrapper._heightAnimTimer = setTimeout(() => {
              wrapper.style.height = '';
              wrapper.style.transition = '';
              wrapper.style.overflow = '';
              wrapper._heightAnimTimer = null;
            }, 240);
          }
        }
      }
    });
  });
}

