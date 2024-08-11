function replaceThumbnails() {
  // Ujednolicony selektor dla wszystkich typów miniatur na YouTube
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
  const videowallStills = document.querySelectorAll('.ytp-videowall-still');
  
  videowallStills.forEach(still => {
    const thumbnailElement = still.querySelector('.ytp-videowall-still-image');
    const titleElement = still.querySelector('.ytp-videowall-still-info-title');
    
    if (thumbnailElement && titleElement && !thumbnailElement.dataset.replaced) {
      replaceSingleThumbnail(thumbnailElement, titleElement.textContent.trim(), true);
    }
  });

  replaceVideowallThumbnails();
  replaceShortsThumbnails();
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
  
  // Zamiast zastępować element, dodajemy nasz element jako dziecko kontenera
  container.innerHTML = '';
  container.appendChild(dummyThumbnail);
  container.dataset.replaced = 'true';
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
        
        still.style.backgroundImage = 'none';
        still.appendChild(dummyThumbnail);
        still.dataset.replaced = 'true';
      }
    }
  });
}

function replaceSingleThumbnail(thumbnailElement, title, isVideowall = false) {
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
  
  if (isVideowall) {
    thumbnailElement.style.backgroundImage = 'none';
    thumbnailElement.appendChild(dummyThumbnail);
  } else {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.appendChild(dummyThumbnail);
    
    // Przenosimy oryginalny element z czasem trwania do naszego wrappera
    const durationElement = thumbnailElement.closest('ytd-thumbnail').querySelector('ytd-thumbnail-overlay-time-status-renderer');
    if (durationElement) {
      wrapper.appendChild(durationElement);
    }
    
    thumbnailElement.parentNode.replaceChild(wrapper, thumbnailElement);
  }
  thumbnailElement.dataset.replaced = 'true';
}

// Uruchom funkcję po załadowaniu strony
document.addEventListener('DOMContentLoaded', replaceThumbnails);

// Obserwuj zmiany w DOM
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

// Dodatkowe sprawdzenie co 1 sekundę dla pewności
setInterval(replaceThumbnails, 1000);