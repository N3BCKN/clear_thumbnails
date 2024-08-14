let isEnabled = true;

function initializeExtension() {
  chrome.storage.sync.get('enabled', function(data) {
    isEnabled = data.enabled !== false;
    if (isEnabled) {
      checkForVideoEnd();
      replaceThumbnails();
      observeNewThumbnails();
      watchForURLChanges();
    }
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'enable') {
    isEnabled = true;
  } else if (request.action === 'disable') {
    isEnabled = false;
  }
  
  sendResponse({status: "Message received"});
  return true;  // Indicates that the response is sent asynchronously
});


function replaceThumbnails() {
  if (!isEnabled) return;

  // for all types of thumbnails
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
  const videowallStills = document.querySelectorAll('.ytp-videowall-still');
  
  videowallStills.forEach(still => {
    if (!still.dataset.replaced) {
      const thumbnailElement = still.querySelector('.ytp-videowall-still-image');
      const titleElement = still.querySelector('.ytp-videowall-still-info-title');
      const durationElement = still.querySelector('.ytp-videowall-still-info-duration');
      
      if (thumbnailElement && titleElement) {
        const title = titleElement.textContent.trim();
        const duration = durationElement ? durationElement.textContent.trim() : '';
        
        const dummyThumbnail = document.createElement('div');
        dummyThumbnail.className = 'dummy-thumbnail videowall-thumbnail';
        dummyThumbnail.style.width = '100%';
        dummyThumbnail.style.height = '100%';
        
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
        
        thumbnailElement.style.backgroundImage = 'none';
        thumbnailElement.appendChild(dummyThumbnail);
        still.dataset.replaced = 'true';
      }
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
  const shortsContainers = document.querySelectorAll('ytm-shorts-lockup-view-model');
  
  shortsContainers.forEach(container => {
    const thumbnailElement = container.querySelector('.ShortsLockupViewModelHostThumbnail');
    const titleElement = container.querySelector('.ShortsLockupViewModelHostMetadataTitle span');
    
    if (thumbnailElement && titleElement && !thumbnailElement.dataset.replaced) {
      const title = titleElement.textContent.trim();
      const viewsElement = container.querySelector('.ShortsLockupViewModelHostMetadataSubhead span');
      const views = viewsElement ? viewsElement.textContent.trim() : '';
      
      replaceSingleShortsThumbnail(thumbnailElement, title, views);
    }
  });
}

function replacePlaylistThumbnails() {
  const playlistThumbnails = document.querySelectorAll('ytd-playlist-thumbnail');
  
  playlistThumbnails.forEach(thumbnail => {
    const thumbnailElement = thumbnail.querySelector('yt-image img');
    const titleElement = thumbnail.closest('ytd-rich-grid-media').querySelector('#video-title');
    
    if (thumbnailElement && titleElement && !thumbnailElement.dataset.replaced) {
      const title = titleElement.textContent.trim();
      
      const dummyThumbnail = document.createElement('div');
      dummyThumbnail.className = 'dummy-thumbnail playlist-thumbnail';
      dummyThumbnail.style.width = `${thumbnailElement.width}px`;
      dummyThumbnail.style.height = `${thumbnailElement.height}px`;
      
      const titleSpan = document.createElement('span');
      titleSpan.textContent = title;
      titleSpan.className = 'dummy-thumbnail-title';
      dummyThumbnail.appendChild(titleSpan);
      
      const wrapper = thumbnail.querySelector('#playlist-thumbnails');
      wrapper.innerHTML = '';
      wrapper.appendChild(dummyThumbnail);
      thumbnailElement.dataset.replaced = 'true';
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
  
  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;
  titleSpan.className = 'dummy-thumbnail-title';
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

function replaceSingleShortsThumbnail(thumbnailElement, title, views) {
  const container = thumbnailElement.closest('.ShortsLockupViewModelHostThumbnailContainer');
  if (!container) return;

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
  

  container.innerHTML = '';
  container.appendChild(dummyThumbnail);
  container.dataset.replaced = 'true';
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

let videoPageInterval;

function watchForURLChanges() {
  let lastUrl = location.href;

  console.log("LAST URL: " + lastUrl)
  
  function handleURLChange() {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      if (currentUrl.includes('/watch')) {
        console.log("Jesteśmy na stronie z filmem")
        startVideoPageInterval();
      } else {
        
        console.log("Opuściliśmy stronę z filmem")
        stopVideoPageInterval();
      }
    }
  }


  handleURLChange();


  new MutationObserver(handleURLChange).observe(document, {subtree: true, childList: true});
}

function startVideoPageInterval() {
  if (!videoPageInterval) {
    videoPageInterval = setInterval(() => {
      console.log('sprawdzanie...')
      replaceVideowallThumbnails();
    }, 1000);
  }
}

function stopVideoPageInterval() {
  if (videoPageInterval) {
    clearInterval(videoPageInterval);
    videoPageInterval = null;
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
  const thumbnails = document.querySelectorAll('ytd-thumbnail:not([data-observed])');
  thumbnails.forEach(thumbnail => {
    thumbnailObserver.observe(thumbnail);
    thumbnail.dataset.observed = 'true';
  });
}


const observer = new MutationObserver(mutations => {
  if (mutations.some(mutation => mutation.addedNodes.length > 0)) {
    observeNewThumbnails();
  }
});

observer.observe(document.body, { 
  childList: true, 
  subtree: true 
});

// Inicjalizacja
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}