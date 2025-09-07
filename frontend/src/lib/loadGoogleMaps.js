// Lightweight singleton loader for Google Maps JS API
// Ensures the script is only created once and exposes a promise that resolves
// when window.google.maps is available. Also installs gm_authFailure handler
// to surface auth/billing errors.

export default function loadGoogleMaps(apiKey) {
  if (!apiKey) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'));
  if (window.__loadGoogleMapsPromise) return window.__loadGoogleMapsPromise;

  window.__loadGoogleMapsPromise = new Promise((resolve, reject) => {
    // auth failure callback: called on invalid key / billing not enabled
    window.gm_authFailure = function() {
      reject(new Error('Google Maps authentication failed or billing not enabled.'));
    };

    if (window.google && window.google.maps) return resolve(window.google);

    const existing = document.getElementById('google-maps-script');
    if (existing) {
      // if script exists, wait for it to load or error
      if (existing.getAttribute('data-loaded') === 'true') {
        if (window.google && window.google.maps) return resolve(window.google);
        return reject(new Error('Google Maps script appears loaded but google.maps is not present'));
      }
      existing.addEventListener('load', () => {
        existing.setAttribute('data-loaded', 'true');
        if (window.google && window.google.maps) resolve(window.google);
        else reject(new Error('Google Maps loaded but window.google.maps missing'));
      });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      if (window.google && window.google.maps) resolve(window.google);
      else reject(new Error('Google Maps script loaded but google.maps not available'));
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return window.__loadGoogleMapsPromise;
}
