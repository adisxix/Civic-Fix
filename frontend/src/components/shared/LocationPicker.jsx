import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';

// Fix Vite default Leaflet icon paths
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function DraggableMarker({ position, onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={customIcon}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          onPositionChange(pos.lat, pos.lng);
        },
      }}
    />
  );
}

export function LocationPicker({ value, latitude, longitude, address, onChange, className }) {
  const [geoError, setGeoError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const loc = value || {
    latitude: latitude || 12.9716,
    longitude: longitude || 77.5946,
    address: address || '',
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onChange({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: loc.address || 'Detected from device GPS',
        });
      },
      (err) => {
        setIsLocating(false);
        setGeoError(err.message || 'Unable to retrieve location.');
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          Set Issue Coordinates
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleUseLocation}
          disabled={isLocating}
          className="text-xs"
        >
          <Crosshair className="w-3.5 h-3.5" />
          {isLocating ? 'Locating...' : 'Use my current location'}
        </Button>
      </div>

      {geoError && (
        <div className="mb-2 p-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs">
          {geoError}
        </div>
      )}

      <div className="h-64 md:h-72 w-full rounded-xl overflow-hidden border border-slate-300 relative">
        <MapContainer
          center={[loc.latitude, loc.longitude]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker
            position={loc}
            onPositionChange={(lat, lng) => onChange({ ...loc, latitude: lat, longitude: lng })}
          />
        </MapContainer>
      </div>

      <div className="mt-2 text-xs text-slate-500 font-mono">
        Coordinates: {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} (Click or drag pin)
      </div>
    </div>
  );
}

export default LocationPicker;
