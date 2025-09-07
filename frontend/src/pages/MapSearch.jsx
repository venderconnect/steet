import { useState, useRef, useEffect } from 'react';
import { getNearbySuppliers } from '../services/productService';
import { useQueryClient } from '@tanstack/react-query';

// This component renders a Google Map, fetches nearby suppliers from our API,
// shows markers, a side panel with supplier details, and draws routes using the
// Google Maps DirectionsService.

const MapSearch = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!mapRef.current) return;
    if (!apiKey) return;
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      const m = new window.google.maps.Map(mapRef.current, { center: { lat: 20.5937, lng: 78.9629 }, zoom: 6 });
      setMap(m);
    }
  }, [mapRef]);

  useEffect(() => {
    if (!map) return;
    // try to get browser location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        map.setCenter(p);
        map.setZoom(10);
        fetchSuppliers(p.lat, p.lng);
      }, () => {
        // fallback location center
        const p = { lat: 20.5937, lng: 78.9629 };
        setUserPos(p);
        fetchSuppliers(p.lat, p.lng);
      });
    } else {
      const p = { lat: 20.5937, lng: 78.9629 };
      setUserPos(p);
      fetchSuppliers(p.lat, p.lng);
    }
  }, [map]);

  const fetchSuppliers = async (lat, lng) => {
    try {
      const res = await getNearbySuppliers(lat, lng, 200);
      const list = res.data.suppliers || [];
      setSuppliers(list);
      // place markers
      if (map) {
        list.forEach(item => {
          const coords = item.supplier.address?.coords;
          if (!coords) return;
          const marker = new window.google.maps.Marker({ position: { lat: coords.lat, lng: coords.lng }, map, title: item.supplier.businessName || item.supplier.name });
          marker.addListener('click', () => {
            setSelected(item);
            drawRouteTo(coords);
          });
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const drawRouteTo = (coords) => {
    if (!userPos || !map) return;
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
    }
    const directionsService = new window.google.maps.DirectionsService();
    const dr = new window.google.maps.DirectionsRenderer({ map });
    setDirectionsRenderer(dr);

    directionsService.route({
      origin: { lat: userPos.lat, lng: userPos.lng },
      destination: { lat: coords.lat, lng: coords.lng },
      travelMode: window.google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true,
    }, (result, status) => {
      if (status === 'OK') {
        dr.setDirections(result);
        // optionally display travel time/distance from result.routes[0].legs[0]
      } else {
        console.error('Directions request failed', status);
      }
    });
  };

  return (
    <div className="flex h-screen">
      <div className="w-3/4" ref={mapRef} style={{ height: '100%' }} />
      <aside className="w-1/4 p-4 overflow-auto">
        <h2 className="text-lg font-bold">Nearby Suppliers</h2>
        {suppliers.length === 0 && <p>No suppliers found nearby.</p>}
        {suppliers.map(item => (
          <div key={item.supplier._id} className={`p-2 border ${selected && selected.supplier._id === item.supplier._id ? 'bg-slate-100' : ''}`} onClick={() => { setSelected(item); drawRouteTo(item.supplier.address.coords); }}>
            <h3 className="font-medium">{item.supplier.businessName || item.supplier.name}</h3>
            <p className="text-sm">{item.supplier.address?.street}, {item.supplier.address?.city}</p>
            <p className="text-sm">{item.distanceKm?.toFixed(1)} km</p>
          </div>
        ))}
      </aside>
    </div>
  );
};

export default MapSearch;
