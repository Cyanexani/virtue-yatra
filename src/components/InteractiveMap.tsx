import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AIItineraryDay {
  day: string;
  destination: string;
  cost: number;
  utility_score: number;
  reasoning: string;
}

interface InteractiveMapProps {
  itinerary: AIItineraryDay[];
}

// Rough coordinates for our mock cities
const CITY_COORDINATES: Record<string, [number, number]> = {
  "Ooty": [11.4102, 76.6950],
  "Coonoor": [11.3530, 76.7959],
  "Mysore": [12.2958, 76.6394],
  "Kodaikanal": [10.2381, 77.4892],
  "New Delhi": [28.6139, 77.2090], // Fallback/Default
};

export const InteractiveMap = ({ itinerary }: InteractiveMapProps) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.4102, 76.6950]);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  useEffect(() => {
    if (itinerary && itinerary.length > 0) {
      // Find coordinates for each destination in the itinerary
      const coords: [number, number][] = itinerary.map(item => {
        return CITY_COORDINATES[item.destination] || CITY_COORDINATES["New Delhi"];
      });
      
      setRouteCoordinates(coords);
      if (coords.length > 0) {
        setMapCenter(coords[0]); // Center on the first destination
      }
    }
  }, [itinerary]);

  if (!itinerary || itinerary.length === 0) return null;

  return (
    <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden border border-border/50 shadow-md mb-6 relative z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={7} 
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {routeCoordinates.map((position, idx) => (
          <Marker key={idx} position={position}>
            <Popup>
              <strong>{itinerary[idx].day.replace("_", " ")}</strong><br />
              {itinerary[idx].destination}
            </Popup>
          </Marker>
        ))}

        {routeCoordinates.length > 1 && (
          <Polyline 
            positions={routeCoordinates} 
            color="hsl(var(--primary))" 
            weight={4} 
            dashArray="10, 10" 
            opacity={0.7} 
          />
        )}
      </MapContainer>
    </div>
  );
};
