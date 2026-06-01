import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';

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

const CITY_COORDINATES: Record<string, {lat: number, lng: number}> = {
  "Ooty": {lat: 11.4102, lng: 76.6950},
  "Coonoor": {lat: 11.3530, lng: 76.7959},
  "Mysore": {lat: 12.2958, lng: 76.6394},
  "Kodaikanal": {lat: 10.2381, lng: 77.4892},
  "New Delhi": {lat: 28.6139, lng: 77.2090}, // Fallback/Default
};

const DirectionsPolyline = ({ path }: { path: {lat: number, lng: number}[] }) => {
  const map = useMap();
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  
  useEffect(() => {
    if (!map) return;
    
    // Create polyline only once
    const newPolyline = new google.maps.Polyline({
      geodesic: true,
      strokeColor: "hsl(var(--primary))",
      strokeOpacity: 0.8,
      strokeWeight: 4,
    });
    
    newPolyline.setMap(map);
    setPolyline(newPolyline);
    
    return () => {
      newPolyline.setMap(null);
    };
  }, [map]);
  
  // Update path when it changes
  useEffect(() => {
    if (polyline) {
      polyline.setPath(path);
    }
  }, [polyline, path]);
  
  return null;
};

export const InteractiveMap = ({ itinerary }: InteractiveMapProps) => {
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number}>({lat: 11.4102, lng: 76.6950});
  const [routeCoordinates, setRouteCoordinates] = useState<{lat: number, lng: number}[]>([]);

  useEffect(() => {
    if (itinerary && itinerary.length > 0) {
      const coords = itinerary.map(item => {
        return CITY_COORDINATES[item.destination] || CITY_COORDINATES["New Delhi"];
      });
      
      setRouteCoordinates(coords);
      if (coords.length > 0) {
        setMapCenter(coords[0]);
      }
    }
  }, [itinerary]);

  if (!itinerary || itinerary.length === 0) return null;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden border border-border/50 shadow-md mb-6 relative z-0">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultZoom={7}
          defaultCenter={mapCenter}
          center={mapCenter}
          mapId="DEMO_MAP_ID"
          disableDefaultUI={false}
          gestureHandling="greedy"
        >
          {routeCoordinates.map((position, idx) => (
            <AdvancedMarker key={idx} position={position} title={itinerary[idx].destination}>
              <Pin background={"hsl(var(--primary))"} borderColor={"hsl(var(--primary))"} glyphColor={"#ffffff"} />
            </AdvancedMarker>
          ))}
          {routeCoordinates.length > 1 && <DirectionsPolyline path={routeCoordinates} />}
        </Map>
      </APIProvider>
    </div>
  );
};
