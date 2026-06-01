import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Map, { Marker, Popup, Source, Layer, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Navigation, BellRing, Loader2, Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LatLng { lat: number; lng: number; }

const ALERT_RADIUS_M = 500;

const haversine = (a: LatLng, b: LatLng) => {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const generateCircleGeojson = (center: LatLng, radiusInMeters: number) => {
  const points = 64;
  const coords = [];
  const km = radiusInMeters / 1000;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const dy = km * Math.cos(theta);
    const dx = km * Math.sin(theta);
    const lat = center.lat + (dy / 110.574);
    const lng = center.lng + (dx / (111.320 * Math.cos(center.lat * Math.PI / 180)));
    coords.push([lng, lat]);
  }
  coords.push(coords[0]);
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coords]
    }
  };
};

const playAlarm = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    [0, 0.5, 1].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now + t);
      osc.frequency.setValueAtTime(660, now + t + 0.15);
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.4, now + t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.45);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    console.error("alarm error", e);
  }
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

const TripMap = () => {
  const { toast } = useToast();
  const mapRef = useRef<MapRef>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [destination, setDestination] = useState<(LatLng & { label: string }) | null>(null);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [tracking, setTracking] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [alertsOn, setAlertsOn] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);
  const watchId = useRef<number | null>(null);
  const alertedRef = useRef(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query + ", India")}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      if (!data?.length) {
        toast({ title: "Not found", description: "Try a more specific place name.", variant: "destructive" });
        return;
      }
      const d = data[0];
      const newDest = { lat: parseFloat(d.lat), lng: parseFloat(d.lon), label: d.display_name };
      setDestination(newDest);
      setInfoOpen(true);
      alertedRef.current = false;
      toast({ title: "Destination set 📍", description: d.display_name.split(",").slice(0, 2).join(",") });
      
      mapRef.current?.flyTo({ center: [newDest.lng, newDest.lat], zoom: 14, duration: 2000 });
    } catch (e) {
      toast({ title: "Search failed", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast({ title: "Unavailable", description: "Geolocation not supported in this browser.", variant: "destructive" });
      return;
    }
    if (alertsOn && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      (err) => {
        toast({ title: "Location error", description: err.message, variant: "destructive" });
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    setTracking(true);
    toast({ title: "Tracking started 🛰️", description: "We'll alert you 500m before arrival." });
  }, [alertsOn, toast, stopTracking]);

  useEffect(() => () => stopTracking(), [stopTracking]);

  useEffect(() => {
    if (!destination || !userPos) return;
    const d = haversine(userPos, destination);
    setDistance(d);
    if (alertsOn && d <= ALERT_RADIUS_M && !alertedRef.current) {
      alertedRef.current = true;
      playAlarm();
      toast({
        title: "🔔 Almost there!",
        description: `You're within ${Math.round(d)}m of ${destination.label.split(",")[0]}. Get ready!`,
      });
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("VirtueYatra • Arriving soon", {
          body: `You're ${Math.round(d)}m from ${destination.label.split(",")[0]}.`,
          icon: "/favicon.ico",
        });
      }
    }
    if (d > ALERT_RADIUS_M * 2) alertedRef.current = false;
  }, [userPos, destination, alertsOn, toast]);

  const circleGeojson = useMemo(() => {
    if (!destination) return null;
    return generateCircleGeojson(destination, ALERT_RADIUS_M);
  }, [destination]);

  return (
    <section id="map" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 animate-slide-up">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Live Maps</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Track Your <span className="gradient-text">Journey</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enter your destination — we'll ring an alarm <strong>500 meters before</strong> you arrive. Never miss your stop again.
          </p>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-2xl">
          <div className="p-4 md:p-6 bg-card border-b border-border flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1 flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search a destination (e.g. Charminar, Hyderabad)"
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searching} className="bg-gradient-to-r from-primary to-travel-ocean">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={tracking ? "destructive" : "default"}
                onClick={tracking ? stopTracking : startTracking}
                disabled={!destination}
                className={!tracking ? "bg-gradient-to-r from-secondary to-accent" : ""}
              >
                <Navigation className="w-4 h-4 mr-2" />
                {tracking ? "Stop" : "Start tracking"}
              </Button>
              <Button variant="outline" onClick={() => setAlertsOn((v) => !v)} title="Toggle 500m alarm">
                {alertsOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {(destination || distance !== null) && (
            <div className="px-4 md:px-6 py-3 bg-muted/40 border-b border-border flex flex-wrap items-center gap-4 text-sm">
              {destination && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium truncate max-w-[300px]">{destination.label.split(",").slice(0, 3).join(", ")}</span>
                </span>
              )}
              {distance !== null && (
                <span className="flex items-center gap-2">
                  <BellRing className={`w-4 h-4 ${distance <= ALERT_RADIUS_M ? "text-secondary animate-pulse" : "text-muted-foreground"}`} />
                  <span>
                    {distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(2)} km`} away
                  </span>
                </span>
              )}
            </div>
          )}

          <div className="h-[500px] w-full relative">
            <Map
              ref={mapRef}
              initialViewState={{
                longitude: 78.9629,
                latitude: 20.5937,
                zoom: 5
              }}
              mapStyle={MAP_STYLE as any}
            >
              {destination && (
                <Marker 
                    longitude={destination.lng} 
                    latitude={destination.lat} 
                    onClick={e => {
                        e.originalEvent.stopPropagation();
                        setInfoOpen(true);
                    }}
                >
                  <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg cursor-pointer"></div>
                </Marker>
              )}
              {destination && infoOpen && (
                <Popup
                  longitude={destination.lng}
                  latitude={destination.lat}
                  anchor="bottom"
                  onClose={() => setInfoOpen(false)}
                  offset={15}
                >
                  <div className="text-black">{destination.label}</div>
                </Popup>
              )}
              
              {circleGeojson && (
                <Source id="alert-circle" type="geojson" data={circleGeojson}>
                  <Layer 
                    id="alert-circle-fill" 
                    type="fill" 
                    paint={{
                      'fill-color': 'hsl(var(--secondary))',
                      'fill-opacity': 0.15
                    }} 
                  />
                  <Layer 
                    id="alert-circle-outline" 
                    type="line" 
                    paint={{
                      'line-color': 'hsl(var(--secondary))',
                      'line-width': 2,
                      'line-opacity': 0.8
                    }} 
                  />
                </Source>
              )}

              {userPos && (
                <Marker longitude={userPos.lng} latitude={userPos.lat}>
                  <div className="w-[18px] h-[18px] rounded-full bg-primary shadow-[0_0_0_6px_hsla(var(--primary)/0.25)] border-2 border-white" />
                </Marker>
              )}
            </Map>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default TripMap;
