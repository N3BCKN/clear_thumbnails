// initialize caching 
const processedElements = new WeakMap();

//DOM buffer 
const domOperationsBuffer = [];

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


hideAllThumbnails();

function replaceThumbnails() {
  replaceMainThumbnails();
  replaceVideowallThumbnails();
  replaceShortsThumbnails();
  replacePlaylistThumbnails();
  
  executeDOMOperations();
}

function replaceMainThumbnails() {
  const thumbnailContainers = document.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer');
  
  thumbnailContainers.forEach(container => {
    if (processedElements.has(container)) return;

    const thumbnailElement = container.querySelector('ytd-thumbnail img');
    const titleElement = container.querySelector('#video-title, #title > yt-formatted-string');
    
    if (thumbnailElement && titleElement) {
      const title = titleElement.textContent.trim() || titleElement.getAttribute('title');
      const duration = getDurationText(container);
      bufferReplaceSingleThumbnail(thumbnailElement, title, duration);
      processedElements.set(container, true);
    }
  });
}

function bufferReplaceSingleThumbnail(thumbnailElement, title, duration) {
  const width = thumbnailElement.width;
  const height = thumbnailElement.height;
  const dummyThumbnail = createDummyThumbnail(title, duration, width, height);
  
  domOperationsBuffer.push(() => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.appendChild(dummyThumbnail);
    
    const originalDurationElement = thumbnailElement.closest('ytd-thumbnail')?.querySelector('ytd-thumbnail-overlay-time-status-renderer');
    if (originalDurationElement) {
      originalDurationElement.remove();
    }
    
    thumbnailElement.parentNode.replaceChild(wrapper, thumbnailElement);
  });
}



function getDurationText(container) {
  const durationElement = container.querySelector('ytd-thumbnail-overlay-time-status-renderer span, badge-shape-wiz__text');
  return durationElement ? durationElement.textContent.trim() : '';
}

function replaceVideowallThumbnails() {
  const videowallStills = document.querySelectorAll('.ytp-videowall-still');
  
  videowallStills.forEach(still => {
    if (processedElements.has(still)) return;

    const thumbnailElement = still.querySelector('.ytp-videowall-still-image');
    const titleElement = still.querySelector('.ytp-videowall-still-info-title');
    const durationElement = still.querySelector('.ytp-videowall-still-info-duration');
    
    if (thumbnailElement && titleElement) {
      const title = titleElement.textContent.trim();
      const duration = durationElement ? durationElement.textContent.trim() : '';
      
      bufferReplaceSingleVideowallThumbnail(still, thumbnailElement, title, duration);
      processedElements.set(still, true);
    }
  });
}

function bufferReplaceSingleVideowallThumbnail(still, thumbnailElement, title, duration) {
  const width = thumbnailElement.offsetWidth;
  const height = thumbnailElement.offsetHeight;
  const dummyThumbnail = createDummyThumbnail(title, duration, width, height);
  
  domOperationsBuffer.push(() => {
    thumbnailElement.style.backgroundImage = 'none';
    thumbnailElement.style.visibility = 'visible';
    thumbnailElement.innerHTML = '';
    thumbnailElement.appendChild(dummyThumbnail);
    
    const titleElement = still.querySelector('.ytp-videowall-still-info-title');
    const durationElement = still.querySelector('.ytp-videowall-still-info-duration');
    if (titleElement) titleElement.style.display = 'none';
    if (durationElement) durationElement.style.display = 'none';
  });
}

function replaceShortsThumbnails() {
  const shortsContainers = document.querySelectorAll('ytm-shorts-lockup-view-model');
  
  shortsContainers.forEach(container => {
    if (processedElements.has(container)) return;

    const thumbnailElement = container.querySelector('.ShortsLockupViewModelHostThumbnail');
    const titleElement = container.querySelector('.ShortsLockupViewModelHostMetadataTitle span');
    
    if (thumbnailElement && titleElement) {
      const title = titleElement.textContent.trim();
      const viewsElement = container.querySelector('.ShortsLockupViewModelHostMetadataSubhead span');
      const views = viewsElement ? viewsElement.textContent.trim() : '';
      
      bufferReplaceSingleShortsThumbnail(thumbnailElement, title, views);
      processedElements.set(container, true);
    }
  });
}

function bufferReplaceSingleShortsThumbnail(thumbnailElement, title, views) {
  domOperationsBuffer.push(() => {
    const container = thumbnailElement.closest('.ShortsLockupViewModelHostThumbnailContainer');
    if (!container) return;

    const dummyThumbnail = createShortsDummyThumbnail(title, views);
    
    container.innerHTML = '';
    container.appendChild(dummyThumbnail);
  });
}


function replaceSingleVideowallThumbnail(still, thumbnailElement, title, duration) {
  const width = thumbnailElement.offsetWidth;
  const height = thumbnailElement.offsetHeight;
  
  const dummyThumbnail = createDummyThumbnail(title, duration, width, height);
  dummyThumbnail.style.position = 'absolute';
  dummyThumbnail.style.top = '0';
  dummyThumbnail.style.left = '0';
  dummyThumbnail.style.width = '100%';
  dummyThumbnail.style.height = '100%';
  
  // Ukryj oryginalny obrazek, ale nie usuwaj go
  thumbnailElement.style.opacity = '0';
  
  // Dodaj nowy thumbnail jako rodzeństwo oryginalnego obrazka
  thumbnailElement.parentNode.insertBefore(dummyThumbnail, thumbnailElement.nextSibling);
  
  // Ukryj oryginalny tytuł i czas trwania
  const titleElement = still.querySelector('.ytp-videowall-still-info-title');
  const durationElement = still.querySelector('.ytp-videowall-still-info-duration');
  if (titleElement) titleElement.style.display = 'none';
  if (durationElement) durationElement.style.display = 'none';
}

function replacePlaylistThumbnails() {
  const playlistThumbnails = document.querySelectorAll('ytd-playlist-thumbnail');
  
  playlistThumbnails.forEach(thumbnail => {
    if (processedElements.has(thumbnail)) return;

    const thumbnailElement = thumbnail.querySelector('yt-image img');
    const titleElement = thumbnail.closest('ytd-rich-grid-media')?.querySelector('#video-title');
    
    if (thumbnailElement && titleElement) {
      const title = titleElement.textContent.trim();
      
      replaceSinglePlaylistThumbnail(thumbnail, thumbnailElement, title);
      processedElements.set(thumbnail, true);
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
    thumbnailElement.innerHTML = ''; // Clear existing content
    thumbnailElement.appendChild(dummyThumbnail);
  } else {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.appendChild(dummyThumbnail);
    
 
    const originalDurationElement = thumbnailElement.closest('ytd-thumbnail')?.querySelector('ytd-thumbnail-overlay-time-status-renderer');
    if (originalDurationElement) {
      originalDurationElement.remove();
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

function executeDOMOperations() {
  requestAnimationFrame(() => {
    const fragment = document.createDocumentFragment();
    domOperationsBuffer.forEach(operation => operation(fragment));
    document.body.appendChild(fragment);
    domOperationsBuffer.length = 0;  // Clear the buffer
  });
}

function initThumbnailReplacement() {
  replaceThumbnails();
  setInterval(replaceThumbnails, 500);
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThumbnailReplacement);
} else {
  initThumbnailReplacement();
}


let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    replaceThumbnails();
  }
}).observe(document, {subtree: true, childList: true});


let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    requestAnimationFrame(replaceThumbnails);
  }, 100);
});


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

const videoPlayerObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.classList && (node.classList.contains('ytp-endscreen-content') || node.classList.contains('ytp-ce-element'))) {
          setTimeout(replaceEndScreenThumbnails, 100);
        }
      });
    }
  });
});

const videoPlayer = document.querySelector('.html5-video-player');
if (videoPlayer) {
  videoPlayerObserver.observe(videoPlayer, { childList: true, subtree: true });
}

observer.observe(document.body, {
  childList: true,
  subtree: true
});