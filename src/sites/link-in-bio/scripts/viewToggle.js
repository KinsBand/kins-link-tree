export function initViewToggle() {
  const phoneFrame = document.getElementById('phoneFrame');
  const toggleMobileViewBtn = document.getElementById('toggleMobileView');
  const toggleFullViewBtn = document.getElementById('toggleFullView');

  if (toggleMobileViewBtn && toggleFullViewBtn && phoneFrame) {
    toggleMobileViewBtn.addEventListener('click', () => {
      phoneFrame.classList.remove('full-width-mode');
      toggleMobileViewBtn.classList.add('active');
      toggleFullViewBtn.classList.remove('active');
    });

    toggleFullViewBtn.addEventListener('click', () => {
      phoneFrame.classList.add('full-width-mode');
      toggleFullViewBtn.classList.add('active');
      toggleMobileViewBtn.classList.remove('active');
    });
  }
}
