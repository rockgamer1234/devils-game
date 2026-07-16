import { requestExpandedMode } from '@devvit/web/client';

window.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  const loaderBar = document.getElementById('loader-bar');
  const loadingText = document.getElementById('loading-text');

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 12) + 6;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      if (loaderBar) loaderBar.style.width = '100%';
      
      setTimeout(() => {
        if (loadingText) {
          loadingText.textContent = 'SYSTEMS OPERATIONAL';
          loadingText.style.color = '#ef4444';
        }
        if (startBtn) {
          startBtn.removeAttribute('disabled');
          startBtn.style.opacity = '1';
          startBtn.style.cursor = 'pointer';
        }
      }, 200);
    } else {
      if (loaderBar) loaderBar.style.width = `${progress}%`;
    }
  }, 80);

  if (startBtn) {
    startBtn.addEventListener('click', async (event) => {
      try {
        await requestExpandedMode(event, 'game');
      } catch (error) {
        console.error('Failed to enter expanded mode:', error);
      }
    });
  }
});

export {};