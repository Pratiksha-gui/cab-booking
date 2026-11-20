
"use client";

import { useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";

interface DriverMapProps {
  latitude: number;
  longitude: number;
}

// Automatically moves the map when driver coordinates change
function MapUpdater({
  latitude,
  longitude,
}: DriverMapProps) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), {
      animate: true,
    });
  }, [latitude, longitude, map]);

  return null;
}

export default function DriverMap({
  latitude,
  longitude,
}: DriverMapProps) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg">
      <MapContainer
        key={`${latitude}-${longitude}`}
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "350px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater
          latitude={latitude}
          longitude={longitude}
        />

        <CircleMarker
  center={[latitude, longitude]}
  radius={12}
  pathOptions={{
    color: "#1e3a8a",
    weight: 3,
    fillColor: "#2563eb",
    fillOpacity: 1,
    opacity: 1,
  }}
>
  <Popup>Driver's Current Location</Popup>
</CircleMarker>
      </MapContainer>
    </div>
  );
}
