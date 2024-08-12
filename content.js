function replaceThumbnails() {

  const thumbnailContainers = document.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer');
  
  thumbnailContainers.forEach(container => {
    const thumbnailElement = container.querySelector('ytd-thumbnail img');
    const titleElement = container.querySelector('#video-title, #title > yt-formatted-string');
    
    if (thumbnailElement && titleElement && !thumbnailElement.dataset.replaced) {
      const title = titleElement.textContent.trim() || titleElement.getAttribute('title');
      replaceSingleThumbnail(thumbnailElement, title);
    }
  });

  // Przypadek dla sugerowanych filmów na ekranie po obejrzeniu filmu
  replaceVideowallThumbnails();
  

  // Przypadek dla Shorts
  replaceShortsThumbnails();
  

  // playlists
  replacePlaylistThumbnails();
  
}

function replaceVideowallThumbnails() {
  const maxAttempts = 5;
  let attempts = 0;

  function attemptReplace() {
    const videowallStills = document.querySelectorAll('.ytp-videowall-still');
    let replacedCount = 0;

    videowallStills.forEach(still => {
      const thumbnailElement = still.querySelector('.ytp-videowall-still-image');
      const titleElement = still.querySelector('.ytp-videowall-still-info-title');
      const durationElement = still.querySelector('.ytp-videowall-still-info-duration');

      if (thumbnailElement && titleElement && !still.dataset.replaced) {
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
        replacedCount++;
      }
    });

    if (replacedCount === 0 && attempts < maxAttempts) {
      attempts++;
      setTimeout(attemptReplace, 500); // Próbuj ponownie po 500ms
    }
  }

  attemptReplace();
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
  
  if (duration) {
    const durationSpan = document.createElement('span');
    durationSpan.textContent = duration;
    durationSpan.className = 'dummy-thumbnail-duration';
    dummyThumbnail.appendChild(durationSpan);
  }
  
  if (isVideowall) {
    thumbnailElement.style.backgroundImage = 'none';
    thumbnailElement.appendChild(dummyThumbnail);
  } else {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.appendChild(dummyThumbnail);
  

    const durationElement = thumbnailElement.closest('ytd-thumbnail').querySelector('ytd-thumbnail-overlay-time-status-renderer');
    if (durationElement) {
      wrapper.appendChild(durationElement);
    }
    
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

document.addEventListener('DOMContentLoaded', () => {
  checkForVideoEnd();
  replaceThumbnails
});


const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes.length) {
      replaceThumbnails();
    }
  });
});

observer.observe(document.body, { 
  childList: true, 
  subtree: true 
});


setInterval(replaceThumbnails, 2000);