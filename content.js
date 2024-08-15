let isEnabled = false;
let bgColor = '#d3d3d3';
let textColor = '#000080';

function initializeExtension() {
  chrome.storage.sync.get(['enabled', 'bgColor', 'textColor'], function(data) {
    isEnabled = data.enabled === true; // Explicitely check for true
    bgColor = data.bgColor || bgColor;
    textColor = data.textColor || textColor;
    
    if (isEnabled) {
      applyThumbnailReplacements();
    } else {
      restoreOriginalThumbnails();
    }
    
    observeNewThumbnails();
  });
}

function applyThumbnailReplacements() {
  if (!isEnabled) return;
  replaceThumbnails();
  replaceMixThumbnails();
  replacePlaylistThumbnails();
  replaceShortsThumbnails();
  replaceVideowallThumbnails();
}

function restoreOriginalThumbnails() {
  const dummyThumbnails = document.querySelectorAll('.dummy-thumbnail');
  dummyThumbnails.forEach(dummy => {
    const originalThumbnail = dummy.previousElementSibling;
    if (originalThumbnail && originalThumbnail.tagName === 'IMG') {
      originalThumbnail.style.display = '';
      dummy.remove();
    }
  });
  
  document.querySelectorAll('[data-replaced]').forEach(el => {
    el.removeAttribute('data-replaced');
  });
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'enable') {
    isEnabled = true;
    applyThumbnailReplacements();
  } else if (request.action === 'disable') {
    isEnabled = false;
    restoreOriginalThumbnails();
  } else if (request.action === 'updateColors') {
    if (request.bgColor) bgColor = request.bgColor;
    if (request.textColor) textColor = request.textColor;
    if (isEnabled) {
      updateThumbnailColors();
    }
  }
  sendResponse({status: "Message received"});
  return true;
});

function updateThumbnailColors() {
  const dummyThumbnails = document.querySelectorAll('.dummy-thumbnail');
  dummyThumbnails.forEach(dummy => {
    dummy.style.backgroundColor = bgColor;
    dummy.querySelector('.dummy-thumbnail-title').style.color = textColor;
  });
}

function replaceMixThumbnails() {
  if (!isEnabled) return;
  
  const mixThumbnails = document.querySelectorAll('ytd-rich-item-renderer ytd-playlist-thumbnail, ytd-radio-renderer');
  
  mixThumbnails.forEach(thumbnail => {
    let container, titleElement, imgElement;

    if (thumbnail.tagName === 'YTD-RADIO-RENDERER') {
      container = thumbnail;
      titleElement = thumbnail.querySelector('#video-title');
      imgElement = thumbnail.querySelector('ytd-playlist-thumbnail img.yt-core-image');
    } else {
      container = thumbnail.closest('ytd-rich-item-renderer');
      titleElement = container.querySelector('#video-title-link');
      imgElement = thumbnail.querySelector('img.yt-core-image');
    }
    
    if (container && !container.dataset.replaced && titleElement && imgElement) {
      const title = titleElement.getAttribute('title') || titleElement.textContent.trim();
      
      const dummyThumbnail = document.createElement('div');
      dummyThumbnail.className = 'dummy-thumbnail mix-thumbnail';
      dummyThumbnail.style.width = `${imgElement.width || imgElement.offsetWidth}px`;
      dummyThumbnail.style.height = `${imgElement.height || imgElement.offsetHeight}px`;
      dummyThumbnail.style.backgroundColor = bgColor;
      
      const titleSpan = document.createElement('span');
      titleSpan.textContent = title;
      titleSpan.className = 'dummy-thumbnail-title';
      titleSpan.style.color = textColor;
      dummyThumbnail.appendChild(titleSpan);
      
      const wrapper = imgElement.closest('#playlist-thumbnails') || imgElement.parentElement;
      if (wrapper) {
        wrapper.innerHTML = '';
        wrapper.appendChild(dummyThumbnail);
        container.dataset.replaced = 'true';
      }
    }
  });
}

function replaceThumbnails() {
  if (!isEnabled) return;

  const thumbnailContainers = document.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer');
  
  thumbnailContainers.forEach(container => {
    const thumbnailElement = container.querySelector('ytd-thumbnail img');
    const titleElement = container.querySelector('#video-title, #title > yt-formatted-string');
    const durationElement = container.querySelector('ytd-thumbnail-overlay-time-status-renderer');
    
    if (thumbnailElement && titleElement && !thumbnailElement.dataset.replaced) {
      const title = titleElement.textContent.trim() || titleElement.getAttribute('title');
      let duration = '';
      if (durationElement) {
        const durationText = durationElement.querySelector('.badge-shape-wiz__text, #text');
        if (durationText) {
          duration = durationText.textContent.trim();
        }
      }
      replaceSingleThumbnail(thumbnailElement, title, duration);
    }
  });

  replaceVideowallThumbnails();
  replaceShortsThumbnails();
  replacePlaylistThumbnails();
}

function replaceVideowallThumbnails() {
  if (!isEnabled) return;

  const videowallStills = document.querySelectorAll('.ytp-videowall-still, .ytp-autonav-endscreen-upnext-container');
  
  videowallStills.forEach(still => {
    if (still.dataset.replaced) return;

    let thumbnailElement, titleElement, durationElement;

    if (still.classList.contains('ytp-videowall-still')) {
      thumbnailElement = still.querySelector('.ytp-videowall-still-image');
      titleElement = still.querySelector('.ytp-videowall-still-info-title');
      durationElement = still.querySelector('.ytp-videowall-still-info-duration');
    } else if (still.classList.contains('ytp-autonav-endscreen-upnext-container')) {
      thumbnailElement = still.querySelector('.ytp-autonav-endscreen-upnext-thumbnail');
      titleElement = still.querySelector('.ytp-autonav-endscreen-upnext-title');
      durationElement = still.querySelector('.ytp-autonav-timestamp');
    }
    
    if (thumbnailElement && titleElement) {
      const title = titleElement.textContent.trim();
      const duration = durationElement ? durationElement.textContent.trim() : '';
      
      const dummyThumbnail = document.createElement('div');
      dummyThumbnail.className = 'dummy-thumbnail videowall-thumbnail';
      dummyThumbnail.style.width = '100%';
      dummyThumbnail.style.height = '100%';
      dummyThumbnail.style.backgroundColor = bgColor;
      
      const titleSpan = document.createElement('span');
      titleSpan.textContent = title;
      titleSpan.className = 'dummy-thumbnail-title';
      titleSpan.style.color = textColor;
      dummyThumbnail.appendChild(titleSpan);
      
      if (duration) {
        const durationSpan = document.createElement('span');
        durationSpan.textContent = duration;
        durationSpan.className = 'dummy-thumbnail-duration';
        dummyThumbnail.appendChild(durationSpan);
      }
      
      if (thumbnailElement.style.backgroundImage) {
        thumbnailElement.style.backgroundImage = 'none';
      }
      thumbnailElement.appendChild(dummyThumbnail);
      still.dataset.replaced = 'true';
    }
  });
}

function checkForVideoEnd() {
  const video = document.querySelector('video');
  if (video) {
    video.addEventListener('ended', () => {
      setTimeout(replaceVideowallThumbnails, 100);
    });
  }
}

function replaceShortsThumbnails() {
  const shortsContainers = document.querySelectorAll('ytm-shorts-lockup-view-model, ytd-reel-item-renderer');
  
  shortsContainers.forEach(container => {
    let thumbnailElement, titleElement, viewsElement;

    if (container.tagName === 'YTM-SHORTS-LOCKUP-VIEW-MODEL') {
      thumbnailElement = container.querySelector('.ShortsLockupViewModelHostThumbnail');
      titleElement = container.querySelector('.ShortsLockupViewModelHostMetadataTitle span');
      viewsElement = container.querySelector('.ShortsLockupViewModelHostMetadataSubhead span');
    } else if (container.tagName === 'YTD-REEL-ITEM-RENDERER') {
      thumbnailElement = container.querySelector('ytd-thumbnail img');
      titleElement = container.querySelector('#video-title');
      viewsElement = container.querySelector('#metadata-line .inline-metadata-item');
    }
    
    if (thumbnailElement && titleElement && !thumbnailElement.dataset.replaced) {
      const title = titleElement.textContent.trim();
      const views = viewsElement ? viewsElement.textContent.trim() : '';
      
      replaceSingleShortsThumbnail(thumbnailElement, title, views, container);
    }
  });
}

function replacePlaylistThumbnails() {
  const playlistThumbnails = document.querySelectorAll('ytd-playlist-thumbnail, ytd-playlist-renderer, ytd-compact-radio-renderer, ytd-compact-playlist-renderer');
  
  playlistThumbnails.forEach(thumbnail => {
    let thumbnailElement, titleElement;

    if (thumbnail.tagName === 'YTD-PLAYLIST-THUMBNAIL' || thumbnail.tagName === 'YTD-THUMBNAIL') {
      thumbnailElement = thumbnail.querySelector('yt-image img');
      titleElement = thumbnail.closest('ytd-rich-grid-media')?.querySelector('#video-title') ||
                     thumbnail.closest('ytd-grid-video-renderer')?.querySelector('#video-title');
    } else if (thumbnail.tagName === 'YTD-PLAYLIST-RENDERER') {
      thumbnailElement = thumbnail.querySelector('ytd-playlist-thumbnail yt-image img');
      titleElement = thumbnail.querySelector('#video-title') || 
                     thumbnail.querySelector('h3 span#video-title');
    } else if (thumbnail.tagName === 'YTD-COMPACT-RADIO-RENDERER' || thumbnail.tagName === 'YTD-COMPACT-PLAYLIST-RENDERER') {
      thumbnailElement = thumbnail.querySelector('ytd-thumbnail yt-image img');
      titleElement = thumbnail.querySelector('#video-title');
    }
    
    if (thumbnailElement && titleElement && !thumbnailElement.dataset.replaced) {
      const title = titleElement.textContent.trim();
      
      const dummyThumbnail = document.createElement('div');
      dummyThumbnail.className = 'dummy-thumbnail playlist-thumbnail';
      dummyThumbnail.style.width = `${thumbnailElement.width || thumbnailElement.offsetWidth}px`;
      dummyThumbnail.style.height = `${thumbnailElement.height || thumbnailElement.offsetHeight}px`;
      dummyThumbnail.style.backgroundColor = bgColor;
      
      const titleSpan = document.createElement('span');
      titleSpan.textContent = title;
      titleSpan.className = 'dummy-thumbnail-title';
      titleSpan.style.color = textColor;
      dummyThumbnail.appendChild(titleSpan);
      
      const wrapper = thumbnail.querySelector('#playlist-thumbnails') || thumbnailElement.closest('a') || thumbnailElement.parentElement;
      if (wrapper) {
        wrapper.innerHTML = '';
        wrapper.appendChild(dummyThumbnail);
        thumbnailElement.dataset.replaced = 'true';
      }
    }
  });
}

function replaceSingleThumbnail(thumbnailElement, title, duration, isVideowall = false) {
  const width = isVideowall ? thumbnailElement.offsetWidth : thumbnailElement.width;
  const height = isVideowall ? thumbnailElement.offsetHeight : thumbnailElement.height;
  
  const dummyThumbnail = document.createElement('div');
  dummyThumbnail.className = 'dummy-thumbnail';
  dummyThumbnail.style.width = `${width}px`;
  dummyThumbnail.style.height = `${height}px`;
  dummyThumbnail.style.backgroundColor = bgColor;
  
  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;
  titleSpan.className = 'dummy-thumbnail-title';
  titleSpan.style.color = textColor;
  dummyThumbnail.appendChild(titleSpan);
  
  const durationSpan = document.createElement('span');
  durationSpan.className = 'dummy-thumbnail-duration';
  dummyThumbnail.appendChild(durationSpan);
  
  if (duration) {
    durationSpan.textContent = duration;
  } else {
    const thumbnailContainer = thumbnailElement.closest('ytd-thumbnail');
    if (thumbnailContainer) {
      const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
          if (mutation.type === 'childList') {
            const durationElement = thumbnailContainer.querySelector('ytd-thumbnail-overlay-time-status-renderer');
            if (durationElement) {
              const durationText = durationElement.querySelector('.badge-shape-wiz__text, #text');
              if (durationText) {
                durationSpan.textContent = durationText.textContent.trim();
                observer.disconnect();
                break;
              }
            }
          }
        }
      });
      observer.observe(thumbnailContainer, { childList: true, subtree: true });
    }
  }
  
  if (isVideowall) {
    thumbnailElement.style.backgroundImage = 'none';
    thumbnailElement.appendChild(dummyThumbnail);
  } else {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.appendChild(dummyThumbnail);
    
    thumbnailElement.parentNode.replaceChild(wrapper, thumbnailElement);
  }
  thumbnailElement.dataset.replaced = 'true';
}

function replaceSingleShortsThumbnail(thumbnailElement, title, views, container) {
  let thumbnailContainer;
  
  if (container.tagName === 'YTM-SHORTS-LOCKUP-VIEW-MODEL') {
    thumbnailContainer = thumbnailElement.closest('.ShortsLockupViewModelHostThumbnailContainer');
  } else if (container.tagName === 'YTD-REEL-ITEM-RENDERER') {
    thumbnailContainer = thumbnailElement.closest('ytd-thumbnail');
  }

  if (!thumbnailContainer) return;

  const dummyThumbnail = document.createElement('div');
  dummyThumbnail.className = 'dummy-thumbnail shorts-thumbnail';
  dummyThumbnail.style.width = thumbnailElement.width + 'px';
  dummyThumbnail.style.height = thumbnailElement.height + 'px';
  dummyThumbnail.style.backgroundColor = bgColor;
  
  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;
  titleSpan.className = 'dummy-thumbnail-title shorts-title';
  titleSpan.style.color = textColor;
  dummyThumbnail.appendChild(titleSpan);
  
  if (views) {
    const viewsSpan = document.createElement('span');
    viewsSpan.textContent = views;
    viewsSpan.className = 'dummy-thumbnail-views';
    dummyThumbnail.appendChild(viewsSpan);
  }

  thumbnailElement.style.display = 'none';
  thumbnailContainer.appendChild(dummyThumbnail);
  thumbnailElement.dataset.replaced = 'true';
}

function observeVideowall() {
  if (!location.pathname.includes('/watch')) return;

  const videoPlayer = document.querySelector('.html5-video-player');
  if (videoPlayer) {
    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.classList && 
                (node.classList.contains('ytp-endscreen-content') || 
                 node.classList.contains('ytp-videowall-still'))) {
              replaceVideowallThumbnails();
            }
          });
        }
      }
    });
    
    observer.observe(videoPlayer, { childList: true, subtree: true });

    const playerObserver = new MutationObserver(() => {
      replaceVideowallThumbnails();
    });

    playerObserver.observe(videoPlayer, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: false
    });
  }
}

const observerOptions = {
  root: null,
  rootMargin: '200px', 
  threshold: 0.1
};

const thumbnailObserver = new IntersectionObserver((entries) => {
  if (entries.some(entry => entry.isIntersecting)) {
    replaceThumbnails();
  }
}, observerOptions);

function observeNewThumbnails() {
  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.addedNodes.length > 0)) {
      if (isEnabled) {
        applyThumbnailReplacements();
        replaceVideowallThumbnails(); 
      } else {
        restoreOriginalThumbnails();
      }
    }
  });

  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

// Inicjalizacja
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}