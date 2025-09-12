import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom red icon for supplier
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapUpdater = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [map, center]);

  return null;
};

const SupplierLocationMap = ({ supplierCoords, isDialogOpen }) => {
  if (!supplierCoords) {
    return <p>Loading supplier location...</p>;
  }

  const position = [supplierCoords.lat, supplierCoords.lng];

  return (
    <div className="map-container">
      <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: '400px', width: '100%' }} 
        scrollWheelZoom={false}
        className={isDialogOpen ? 'pointer-events-none' : ''} // Apply class conditionally
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater center={position} />
        <Marker position={position} icon={redIcon}>
          <Popup>Supplier Location</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default SupplierLocationMap;