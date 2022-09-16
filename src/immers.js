export function initImmers () {
  const hud = document.querySelector('immers-hud');
  if (process.env.NODE_ENV !== 'production') {
    hud.setAttribute('token-catcher', window.location.href);
    hud.setAttribute('destination-url', window.location.href);
  }
  hud.addEventListener('immers-hud-connected', evt => {
    document.body.classList.add('immersConnected');
    document.querySelector('a-scene').emit('login');
  }, { once: true });
}
