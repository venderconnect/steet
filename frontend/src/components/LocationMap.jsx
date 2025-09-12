import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { haversineDistance } from '../lib/distance';

// Fix for default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

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

const LocationMap = ({ vendorCoords, supplierCoords }) => {
  if (!vendorCoords || !supplierCoords) {
    return <p>Loading map...</p>;
  }

  const center = [
    (vendorCoords.lat + supplierCoords.lat) / 2,
    (vendorCoords.lng + supplierCoords.lng) / 2
  ];

  const distance = haversineDistance(
    [vendorCoords.lat, vendorCoords.lng],
    [supplierCoords.lat, supplierCoords.lng]
  ).toFixed(2);

  const positions = [
    [vendorCoords.lat, vendorCoords.lng],
    [supplierCoords.lat, supplierCoords.lng]
  ];

  return (
    <MapContainer center={center} zoom={10} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[vendorCoords.lat, vendorCoords.lng]} icon={greenIcon}>
        <Popup>Your Location</Popup>
      </Marker>
      <Marker position={[supplierCoords.lat, supplierCoords.lng]} icon={redIcon}>
        <Popup>Supplier Location</Popup>
      </Marker>
      <Polyline positions={positions} color="blue">
        <Popup>{`Distance: ${distance} km`}</Popup>
      </Polyline>
    </MapContainer>
  );
};

export default LocationMap;