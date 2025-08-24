import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface NetworkHop {
  id: number;
  ip: string;
  hostname: string;
  latitude: number;
  longitude: number;
  latency: number;
  country: string;
  city: string;
}

interface NetworkMapProps {
  mapboxToken?: string;
}

const NetworkMap: React.FC<NetworkMapProps> = ({ mapboxToken }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [targetHost, setTargetHost] = useState('google.com');
  const [isTracing, setIsTracing] = useState(false);
  const [hops, setHops] = useState<NetworkHop[]>([]);
  const [currentTokenInput, setCurrentTokenInput] = useState('');

  // Mock traceroute data for demonstration
  const mockTraceroute = (target: string): NetworkHop[] => [
    { id: 1, ip: '192.168.1.1', hostname: 'local-gateway', latitude: 40.7128, longitude: -74.0060, latency: 1.2, country: 'USA', city: 'New York' },
    { id: 2, ip: '10.0.0.1', hostname: 'isp-router-1', latitude: 40.7589, longitude: -73.9851, latency: 12.5, country: 'USA', city: 'New York' },
    { id: 3, ip: '72.14.215.85', hostname: 'google-edge', latitude: 37.4419, longitude: -122.1430, latency: 45.3, country: 'USA', city: 'Palo Alto' },
    { id: 4, ip: '142.250.191.14', hostname: target, latitude: 37.4419, longitude: -122.1430, latency: 47.8, country: 'USA', city: 'Palo Alto' },
  ];

  const initializeMap = (accessToken: string) => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = accessToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 2,
      center: [0, 20],
      pitch: 30,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add atmosphere and fog effects
    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(30, 50, 70)',
        'high-color': 'rgb(20, 40, 60)',
        'horizon-blend': 0.1,
      });
    });

    // Rotation animation
    const rotateCamera = () => {
      if (!map.current || isTracing) return;
      const center = map.current.getCenter();
      center.lng += 0.1;
      map.current.easeTo({ center, duration: 100 });
      requestAnimationFrame(rotateCamera);
    };
    rotateCamera();
  };

  const addNetworkPath = (hopData: NetworkHop[]) => {
    if (!map.current) return;

    // Add source and layers for network path
    const coordinates = hopData.map(hop => [hop.longitude, hop.latitude]);
    
    map.current.addSource('network-path', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    });

    // Add the line layer
    map.current.addLayer({
      id: 'network-path-line',
      type: 'line',
      source: 'network-path',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#00ffff',
        'line-width': 3,
        'line-opacity': 0.8,
        'line-blur': 1
      }
    });

    // Add hop markers
    hopData.forEach((hop, index) => {
      const el = document.createElement('div');
      el.className = 'hop-marker';
      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${index === 0 ? '#00ff00' : index === hopData.length - 1 ? '#ff0040' : '#00ffff'};
        border: 2px solid #ffffff;
        box-shadow: 0 0 15px ${index === 0 ? '#00ff00' : index === hopData.length - 1 ? '#ff0040' : '#00ffff'};
        animation: network-pulse 2s ease-in-out infinite;
        cursor: pointer;
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([hop.longitude, hop.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2 bg-card text-card-foreground rounded">
            <strong>Hop ${hop.id}</strong><br/>
            ${hop.hostname}<br/>
            ${hop.ip}<br/>
            ${hop.city}, ${hop.country}<br/>
            <span style="color: ${hop.latency < 20 ? '#00ff00' : hop.latency < 100 ? '#ffff00' : '#ff0040'}">
              ${hop.latency}ms
            </span>
          </div>
        `))
        .addTo(map.current!);
    });

    // Fit bounds to show all hops
    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => bounds.extend(coord as [number, number]));
    map.current.fitBounds(bounds, { padding: 100 });
  };

  const clearNetworkPath = () => {
    if (!map.current) return;
    
    if (map.current.getLayer('network-path-line')) {
      map.current.removeLayer('network-path-line');
    }
    if (map.current.getSource('network-path')) {
      map.current.removeSource('network-path');
    }
    
    // Clear all markers
    document.querySelectorAll('.hop-marker').forEach(marker => {
      marker.remove();
    });
  };

  const executeTraceroute = async () => {
    if (!map.current) {
      toast({
        title: "Map not ready",
        description: "Please enter your Mapbox token first",
        variant: "destructive",
      });
      return;
    }

    setIsTracing(true);
    clearNetworkPath();
    
    toast({
      title: "Tracing route...",
      description: `Starting traceroute to ${targetHost}`,
    });

    // Simulate traceroute with delay
    const mockHops = mockTraceroute(targetHost);
    setHops([]);
    
    for (let i = 0; i < mockHops.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHops(prev => [...prev, mockHops[i]]);
    }
    
    addNetworkPath(mockHops);
    setHops(mockHops);
    setIsTracing(false);
    
    toast({
      title: "Traceroute complete",
      description: `Found ${mockHops.length} hops to ${targetHost}`,
    });
  };

  const handleTokenSubmit = () => {
    if (currentTokenInput.trim()) {
      initializeMap(currentTokenInput.trim());
      toast({
        title: "Map initialized",
        description: "You can now start tracing network routes!",
      });
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 20) return 'text-latency-good';
    if (latency < 100) return 'text-latency-warning';
    return 'text-latency-error';
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header Controls */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex flex-col space-y-4">
          {!mapboxToken && !map.current && (
            <div className="flex space-x-2">
              <Input
                placeholder="Enter your Mapbox public token..."
                value={currentTokenInput}
                onChange={(e) => setCurrentTokenInput(e.target.value)}
                className="flex-1"
              />
              <Button variant="cyber" onClick={handleTokenSubmit}>
                Initialize Map
              </Button>
            </div>
          )}
          
          {(mapboxToken || map.current) && (
            <div className="flex space-x-2">
              <Input
                placeholder="Enter target hostname (e.g., google.com)"
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
                className="flex-1"
                disabled={isTracing}
              />
              <Button 
                variant="network" 
                onClick={executeTraceroute}
                disabled={isTracing || !targetHost.trim()}
              >
                {isTracing ? 'Tracing...' : 'Trace Route'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapContainer} className="absolute inset-0" />
          {!mapboxToken && !map.current && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Card className="p-6 max-w-md text-center">
                <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
                <p className="text-muted-foreground mb-4">
                  Please get your free Mapbox public token from{' '}
                  <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    mapbox.com
                  </a>
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Hop Details Panel */}
        {hops.length > 0 && (
          <div className="w-80 bg-card border-l border-border p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-cyber">Network Hops</h3>
            <div className="space-y-2">
              {hops.map((hop) => (
                <Card key={hop.id} className="p-3 bg-secondary">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-mono text-muted-foreground">Hop {hop.id}</span>
                    <span className={`text-sm font-bold ${getLatencyColor(hop.latency)}`}>
                      {hop.latency}ms
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="font-mono text-primary">{hop.ip}</div>
                    <div className="text-foreground">{hop.hostname}</div>
                    <div className="text-muted-foreground text-xs">
                      {hop.city}, {hop.country}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkMap;