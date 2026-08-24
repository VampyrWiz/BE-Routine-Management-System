// downloadElementPng captures an element as a PNG via html2canvas and
// triggers a browser download. The element is captured hug-to-content
// (width:max-content, content-box) so wide grids are never clipped by their
// scroll container and no blank page-space leaks into the image, with a 1cm
// margin on all four sides filled with the card's themed background.
// Throws on failure so callers can show their own error message.
import html2canvas from 'html2canvas';

const downloadElementPng = async (el, filename) => {
  if (!el) return;
  // The capture target is usually transparent — take the themed card
  // background so dark-mode exports stay readable.
  const bg = getComputedStyle(el.closest('.card') || el).backgroundColor || '#ffffff';
  el.style.width = 'max-content';
  el.style.boxSizing = 'content-box';
  el.style.padding = '1cm';
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: bg,
      windowWidth: el.offsetWidth,
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    el.style.width = '';
    el.style.boxSizing = '';
    el.style.padding = '';
  }
};

export default downloadElementPng;
