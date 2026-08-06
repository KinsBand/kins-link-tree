export function setupSegmentedSwitcher(tabSelector, contentSelector) {
  const tabs = document.querySelectorAll(tabSelector);
  const contents = document.querySelectorAll(contentSelector);

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      contents.forEach(content => {
        if (content.id === targetId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}
