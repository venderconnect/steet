import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { haversineDistance } from '../lib/distance';

// Fix for default icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons for vendor (green) and supplier (red)
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// NEW: Custom blue icon for current supplier when viewing another supplier's product
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapUpdater = ({ vendorCoords, supplierCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (vendorCoords && supplierCoords) {
      const bounds = L.latLngBounds([vendorCoords.lat, vendorCoords.lng], [supplierCoords.lat, supplierCoords.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, vendorCoords, supplierCoords]);

  return null;
};

const RouteMap = ({ vendorCoords, supplierCoords, isDialogOpen, userRole }) => {
  if (!vendorCoords || !supplierCoords) {
    return <p>Loading map...</p>;
  }

  const position = [
    [vendorCoords.lat, vendorCoords.lng],
    [supplierCoords.lat, supplierCoords.lng]
  ];

  const distance = haversineDistance(
    [vendorCoords.lat, vendorCoords.lng],
    [supplierCoords.lat, supplierCoords.lng]
  ).toFixed(1);

  return (
    <div className="map-container">
      <MapContainer 
        center={[vendorCoords.lat, vendorCoords.lng]} 
        zoom={13} 
        style={{ height: '400px', width: '100%' }} 
        scrollWheelZoom={false}
        className={isDialogOpen ? 'pointer-events-none' : ''} // Apply class conditionally
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater vendorCoords={vendorCoords} supplierCoords={supplierCoords} />
        <Marker position={[vendorCoords.lat, vendorCoords.lng]} icon={userRole === 'supplier' ? blueIcon : greenIcon}> {/* Conditional icon */}
          <Popup>{userRole === 'supplier' ? 'Your Location' : 'Your Location'}</Popup>
        </Marker>
        <Marker position={[supplierCoords.lat, supplierCoords.lng]} icon={redIcon}>
          <Popup>Supplier Location</Popup>
        </Marker>
        <Polyline positions={position} color="blue" />
      </MapContainer>
      <p className="text-center mt-2">Distance: {distance} km</p>
    </div>
  );
};

export default RouteMap;