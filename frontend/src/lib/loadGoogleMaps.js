
let googleMapsScript = null;

const loadGoogleMaps = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    if (googleMapsScript) {
      // Script is already being loaded
      googleMapsScript.onload = () => resolve(window.google.maps);
      googleMapsScript.onerror = (error) => reject(error);
      return;
    }

    googleMapsScript = document.createElement('script');
    googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    googleMapsScript.async = true;
    googleMapsScript.defer = true;

    googleMapsScript.onload = () => {
      resolve(window.google.maps);
    };

    googleMapsScript.onerror = (error) => {
      reject(error);
      googleMapsScript = null; // Reset on error to allow retrying
    };

    document.head.appendChild(googleMapsScript);
  });
};

export default loadGoogleMaps;
