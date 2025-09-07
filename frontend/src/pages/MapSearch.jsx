import { useState, useRef, useEffect } from 'react';
import { getNearbySuppliers } from '../services/productService';
import { useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';

// This component renders a Leaflet Map, fetches nearby suppliers from our API,
// and shows markers on the map.

const MapEvents = ({ onMoveEnd }) => {
  const map = useMap();
  useEffect(() => {
    map.on('moveend', () => {
      const center = map.getCenter();
      onMoveEnd(center.lat, center.lng);
    });
    return () => {
      map.off('moveend');
    };
  }, [map, onMoveEnd]);
  return null;
};

const MapSearch = () => {
  const [userPos, setUserPos] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // try to get browser location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
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
  }, []);

  const fetchSuppliers = async (lat, lng) => {
    try {
      const res = await getNearbySuppliers(lat, lng, 200);
      const list = res.data.suppliers || [];
      setSuppliers(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveEnd = (lat, lng) => {
    fetchSuppliers(lat, lng);
  };

  return (
    <div className="flex h-screen">
      <div className="w-3/4" style={{ height: '100%' }}>
        {userPos && (
          <MapContainer center={userPos} zoom={10} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapEvents onMoveEnd={handleMoveEnd} />
            {suppliers.map(item => {
              const coords = item.supplier.address?.coords;
              if (!coords) return null;
              return (
                <Marker key={item.supplier._id} position={[coords.lat, coords.lng]} eventHandlers={{
                  click: () => {
                    setSelected(item);
                  },
                }}>
                  <Tooltip>{item.supplier.businessName || item.supplier.name}</Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
      <aside className="w-1/4 p-4 overflow-auto">
        <h2 className="text-lg font-bold">Nearby Suppliers</h2>
        {suppliers.length === 0 && <p>No suppliers found nearby.</p>}
        {suppliers.map(item => (
          <div key={item.supplier._id} className={`p-2 border ${selected && selected.supplier._id === item.supplier._id ? 'bg-slate-100' : ''}`} onClick={() => setSelected(item)}>
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