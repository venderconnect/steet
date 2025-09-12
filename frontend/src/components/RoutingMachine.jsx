import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";
// Import the Google routing machine plugin
// Note: lrm-google is not included by default. Using the default routing control.
const RoutingMachine = ({ start, end, onRouteFound }) => {
  const map = useMap();

  useEffect(() => {
  if (!map || !start || !end) return;

    // Remove existing routing control if any to prevent duplicates on re-render
    if (map.routingControl) {
      map.removeControl(map.routingControl);
    }

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
      // Pass the API key to the Google routing control
  }).addTo(map);

    // Store the routing control on the map for easy removal
    map.routingControl = routingControl;

    routingControl.on('routesfound', function (e) {
      const routes = e.routes;
      const summary = routes[0].summary;
      if (onRouteFound) {
        onRouteFound(summary);
      }

      // Removed simulated live tracking.
      // Real live tracking would involve updating a marker based on actual data.
    });

    return () => {
      if (map.routingControl) {
        map.removeControl(map.routingControl);
        map.routingControl = null;
      }
    };
  }, [map, start, end, onRouteFound]); // Removed apiKey from dependency array

  return null;
};

export default RoutingMachine;
