// Funkcja do ukrycia wszystkich miniatur natychmiast po załadowaniu strony
function hideAllThumbnails() {
  const style = document.createElement('style');
  style.textContent = `
    ytd-thumbnail img, 
    .ytp-videowall-still-image, 
    .ShortsLockupViewModelHostThumbnail, 
    ytd-playlist-thumbnail img {
      visibility: hidden !important;
    }
  `;
  document.head.appendChild(style);
}

// Wywołaj funkcję hideAllThumbnails natychmiast
hideAllThumbnails();

// Reszta kodu pozostaje bez zmian
function replaceThumbnails() {
  replaceMainThumbnails();
  replaceVideowallThumbnails();
  replaceShortsThumbnails();
  replacePlaylistThumbnails();
}

function replaceMainThumbnails() {
  const thumbnailContainers = document.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer');
  
  thumbnailContainers.forEach(container => {
    const thumbnailElement = container.querySelector('ytd-thumbnail img');
    const titleElement = container.querySelector('#video-title, #title > yt-formatted-string');
    
    if (thumbnailElement && titleElement && !thumbnailElement.dataset.replaced) {
      const title = titleElement.textContent.trim() || titleElement.getAttribute('title');
      const duration = getDurationText(container);
      replaceSingleThumbnail(thumbnailElement, title, duration);
      thumbnailElement.dataset.replaced = 'true';
    }
  });
}

function getDurationText(container) {
  const durationElement = container.querySelector('ytd-thumbnail-overlay-time-status-renderer');
  return durationElement ? durationElement.textContent.trim() : '';
}

function replaceVideowallThumbnails() {
  const videowallStills = document.querySelectorAll('.ytp-videowall-still');
  
  videowallStills.forEach(still => {
    const thumbnailElement = still.querySelector('.ytp-videowall-still-image');
    const titleElement = still.querySelector('.ytp-videowall-still-info-title');
    const durationElement = still.querySelector('.ytp-videowall-still-info-duration');
    
    if (thumbnailElement && titleElement && !still.dataset.replaced) {
      const title = titleElement.textContent.trim();
      const duration = durationElement ? durationElement.textContent.trim() : '';
      
      replaceSingleThumbnail(thumbnailElement, title, duration, true);
      still.dataset.replaced = 'true';
    }
  });
}

function replaceShortsThumbnails() {
  const shortsContainers = document.querySelectorAll('ytm-shorts-lockup-view-model');
  
  shortsContainers.forEach(container => {
    const thumbnailElement = container.querySelector('.ShortsLockupViewModelHostThumbnail');
    const titleElement = container.querySelector('.ShortsLockupViewModelHostMetadataTitle span');
    
    if (thumbnailElement && titleElement && !container.dataset.replaced) {
      const title = titleElement.textContent.trim();
      const viewsElement = container.querySelector('.ShortsLockupViewModelHostMetadataSubhead span');
      const views = viewsElement ? viewsElement.textContent.trim() : '';
      
      replaceSingleShortsThumbnail(thumbnailElement, title, views);
      container.dataset.replaced = 'true';
    }
  });
}

function replacePlaylistThumbnails() {
  const playlistThumbnails = document.querySelectorAll('ytd-playlist-thumbnail');
  
  playlistThumbnails.forEach(thumbnail => {
    const thumbnailElement = thumbnail.querySelector('yt-image img');
    const titleElement = thumbnail.closest('ytd-rich-grid-media')?.querySelector('#video-title');
    
    if (thumbnailElement && titleElement && !thumbnail.dataset.replaced) {
      const title = titleElement.textContent.trim();
      
      replaceSinglePlaylistThumbnail(thumbnail, thumbnailElement, title);
      thumbnail.dataset.replaced = 'true';
    }
  });
}

function replaceSingleThumbnail(thumbnailElement, title, duration, isVideowall = false) {
  const width = isVideowall ? thumbnailElement.offsetWidth : thumbnailElement.width;
  const height = isVideowall ? thumbnailElement.offsetHeight : thumbnailElement.height;
  
  const dummyThumbnail = createDummyThumbnail(title, duration, width, height);
  
  if (isVideowall) {
    thumbnailElement.style.backgroundImage = 'none';
    thumbnailElement.style.visibility = 'visible';
    thumbnailElement.appendChild(dummyThumbnail);
  } else {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.appendChild(dummyThumbnail);
  
    const durationElement = thumbnailElement.closest('ytd-thumbnail')?.querySelector('ytd-thumbnail-overlay-time-status-renderer');
    if (durationElement) {
      wrapper.appendChild(durationElement);
    }
    
    thumbnailElement.parentNode.replaceChild(wrapper, thumbnailElement);
  }
}

function replaceSingleShortsThumbnail(thumbnailElement, title, views) {
  const container = thumbnailElement.closest('.ShortsLockupViewModelHostThumbnailContainer');
  if (!container) return;

  const dummyThumbnail = createShortsDummyThumbnail(title, views);
  
  container.innerHTML = '';
  container.appendChild(dummyThumbnail);
}

function replaceSinglePlaylistThumbnail(thumbnail, thumbnailElement, title) {
  const dummyThumbnail = createPlaylistDummyThumbnail(thumbnailElement, title);
  
  const wrapper = thumbnail.querySelector('#playlist-thumbnails');
  if (wrapper) {
    wrapper.innerHTML = '';
    wrapper.appendChild(dummyThumbnail);
  }
}

function createDummyThumbnail(title, duration, width, height) {
  const dummyThumbnail = document.createElement('div');
  dummyThumbnail.className = 'dummy-thumbnail';
  dummyThumbnail.style.width = `${width}px`;
  dummyThumbnail.style.height = `${height}px`;
  
  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;
  titleSpan.className = 'dummy-thumbnail-title';
  dummyThumbnail.appendChild(titleSpan);
  
  if (duration) {
    const durationSpan = document.createElement('span');
    durationSpan.textContent = duration;
    durationSpan.className = 'dummy-thumbnail-duration';
    dummyThumbnail.appendChild(durationSpan);
  }
  
  return dummyThumbnail;
}

function createShortsDummyThumbnail(title, views) {
  const dummyThumbnail = document.createElement('div');
  dummyThumbnail.className = 'dummy-thumbnail shorts-thumbnail';
  
  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;
  titleSpan.className = 'dummy-thumbnail-title shorts-title';
  dummyThumbnail.appendChild(titleSpan);
  
  if (views) {
    const viewsSpan = document.createElement('span');
    viewsSpan.textContent = views;
    viewsSpan.className = 'dummy-thumbnail-views';
    dummyThumbnail.appendChild(viewsSpan);
  }
  
  return dummyThumbnail;
}

function createPlaylistDummyThumbnail(thumbnailElement, title) {
  const dummyThumbnail = document.createElement('div');
  dummyThumbnail.className = 'dummy-thumbnail playlist-thumbnail';
  dummyThumbnail.style.width = `${thumbnailElement.width}px`;
  dummyThumbnail.style.height = `${thumbnailElement.height}px`;
  
  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;
  titleSpan.className = 'dummy-thumbnail-title';
  dummyThumbnail.appendChild(titleSpan);
  
  return dummyThumbnail;
}

// Run the thumbnail replacement periodically
// Zmodyfikowane wywołanie skryptu
function initThumbnailReplacement() {
  replaceThumbnails();
  // Usuwamy opóźnienie i zwiększamy częstotliwość sprawdzania
  setInterval(replaceThumbnails, 100);
}

// Natychmiastowe uruchomienie skryptu
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThumbnailReplacement);
} else {
  initThumbnailReplacement();
}

// Nasłuchiwanie zmian URL
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    replaceThumbnails();
  }
}).observe(document, {subtree: true, childList: true});

// Optymalizacja obsługi przewijania
let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    requestAnimationFrame(replaceThumbnails);
  }, 100);
});

// Dodanie obserwatora mutacji dla dynamicznie ładowanych treści
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          requestAnimationFrame(() => replaceThumbnails());
        }
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});