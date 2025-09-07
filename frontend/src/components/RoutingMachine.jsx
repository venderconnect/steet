import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";

const RoutingMachine = ({ start, end, onRouteFound }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !start || !end) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      routeWhileDragging: true,
      lineOptions: {
        styles: [{ color: "blue", opacity: 0.7, weight: 5 }],
      },
      show: false, // Hide the default instructions panel
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
    }).addTo(map);

    routingControl.on('routesfound', function (e) {
      const routes = e.routes;
      const summary = routes[0].summary;
      if (onRouteFound) {
        onRouteFound(summary);
      }

      // Simulate live tracking
      const route = routes[0].coordinates;
      const packageMarker = L.marker(route[0], {
        icon: L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
      }).addTo(map);

      let i = 0;
      const interval = setInterval(() => {
        if (i < route.length) {
          packageMarker.setLatLng(route[i]);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 1000); // Adjust the interval for speed
    });

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, start, end, onRouteFound]);

  return null;
};

export default RoutingMachine;