const viewer = document.querySelector('#image-viewer');
const fullImage = document.querySelector('#viewer-image');
const caption = document.querySelector('#image-caption');
if (viewer && typeof viewer.showModal === 'function') {
  document.querySelectorAll('[data-image]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      fullImage.src = link.dataset.image;
      fullImage.alt = link.dataset.caption;
      fullImage.classList.toggle('rotated', link.classList.contains('rotated'));
      fullImage.classList.toggle('rotated-counterclockwise', link.dataset.rotation === '-90');
      caption.textContent = link.dataset.caption;
      viewer.showModal();
      document.body.classList.add('viewing-image');
    });
  });
  viewer.querySelector('.close-viewer').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => document.body.classList.remove('viewing-image'));
}
