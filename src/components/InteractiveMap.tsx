import { useEffect, useState, useMemo } from 'react';
import Map, { Marker, Source, Layer, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

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

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap Contributors"
    }
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm"
    }
  ]
};

export const InteractiveMap = ({ itinerary }: InteractiveMapProps) => {
  const [routeCoordinates, setRouteCoordinates] = useState<{lat: number, lng: number, title: string, day: string}[]>([]);
  const [selectedPin, setSelectedPin] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCoordinates = async () => {
      const newCoords = [];
      for (const item of itinerary) {
        // Fetch city center first
        let cityCenter = CITY_COORDINATES[item.destination];
        if (!cityCenter) {
          try {
            await new Promise(r => setTimeout(r, 400));
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item.destination)}`);
            const data = await res.json();
            if (data && data.length > 0) {
              cityCenter = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
              CITY_COORDINATES[item.destination] = cityCenter;
            } else {
              cityCenter = CITY_COORDINATES["New Delhi"];
            }
          } catch (e) {
             cityCenter = CITY_COORDINATES["New Delhi"];
          }
        }

        if (item.activities && item.activities.length > 0) {
          for (const activity of item.activities) {
            const query = activity.spot.includes(item.destination) ? activity.spot : `${activity.spot}, ${item.destination}`;
            if (CITY_COORDINATES[query]) {
              newCoords.push({ ...CITY_COORDINATES[query], title: activity.spot, day: item.day });
            } else {
              try {
                await new Promise(r => setTimeout(r, 500));
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data && data.length > 0) {
                  const lat = parseFloat(data[0].lat);
                  const lng = parseFloat(data[0].lon);
                  CITY_COORDINATES[query] = { lat, lng };
                  newCoords.push({ lat, lng, title: activity.spot, day: item.day });
                } else {
                  // Offset slightly so multiple unmapped spots don't overlap perfectly
                  newCoords.push({ 
                    lat: cityCenter.lat + (Math.random() - 0.5) * 0.03, 
                    lng: cityCenter.lng + (Math.random() - 0.5) * 0.03, 
                    title: activity.spot, 
                    day: item.day 
                  });
                }
              } catch (e) {
                newCoords.push({ lat: cityCenter.lat, lng: cityCenter.lng, title: activity.spot, day: item.day });
              }
            }
          }
        } else {
          newCoords.push({ ...cityCenter, title: item.destination, day: item.day });
        }
      }
      if (!cancelled) {
        setRouteCoordinates(newCoords);
      }
    };

    if (itinerary && itinerary.length > 0) {
      fetchCoordinates();
    }
    
    return () => { cancelled = true; };
  }, [itinerary]);

  const routeGeojson = useMemo(() => {
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: routeCoordinates.map(c => [c.lng, c.lat])
      }
    };
  }, [routeCoordinates]);

  if (!itinerary || itinerary.length === 0 || routeCoordinates.length === 0) return null;

  return (
    <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden border border-border/50 shadow-md mb-6 relative z-0">
      <Map
        initialViewState={{
          longitude: routeCoordinates[0].lng,
          latitude: routeCoordinates[0].lat,
          zoom: 11
        }}
        mapStyle={MAP_STYLE as any}
      >
        {routeCoordinates.map((position, idx) => (
          <Marker 
            key={idx} 
            longitude={position.lng} 
            latitude={position.lat}
            onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedPin(idx);
            }}
          >
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform">
              {idx + 1}
            </div>
          </Marker>
        ))}

        {selectedPin !== null && (
          <Popup
            longitude={routeCoordinates[selectedPin].lng}
            latitude={routeCoordinates[selectedPin].lat}
            anchor="bottom"
            onClose={() => setSelectedPin(null)}
            closeButton={false}
            offset={15}
          >
            <div className="text-black text-sm max-w-[200px]">
              <strong>{routeCoordinates[selectedPin].day.replace("_", " ")}</strong><br />
              <span className="font-semibold text-primary">{routeCoordinates[selectedPin].title}</span>
            </div>
          </Popup>
        )}

        {routeCoordinates.length > 1 && (
          <Source id="route" type="geojson" data={routeGeojson}>
            <Layer 
              id="route-line" 
              type="line" 
              paint={{
                'line-color': '#2563eb',
                'line-width': 4,
                'line-dasharray': [2, 2]
              }} 
            />
          </Source>
        )}
      </Map>
    </div>
  );
};
