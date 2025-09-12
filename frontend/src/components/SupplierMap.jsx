import React, { useRef, useEffect, useState } from 'react';
import loadGoogleMaps from '../lib/loadGoogleMaps'; // Adjust path if necessary
import { Loader2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Assuming API key is in .env

const SupplierMap = ({ lat, lng }) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      try {
        const googleMaps = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        setMapLoaded(true);

        const map = new googleMaps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 14, // Adjust zoom level as needed
        });

        new googleMaps.Marker({
          position: { lat, lng },
          map,
          title: 'Supplier Location',
        });
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        // Handle error, e.g., display a message to the user
      }
    };

    if (lat && lng) {
      initMap();
    }
  }, [lat, lng]);

  if (!GOOGLE_MAPS_API_KEY) {
    return <div className="text-red-500">Google Maps API Key is not configured.</div>;
  }

  if (!mapLoaded) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-100 rounded-md">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return <div ref={mapRef} style={{ height: '400px', width: '100%' }} className="rounded-md"></div>;
};

export default SupplierMap;