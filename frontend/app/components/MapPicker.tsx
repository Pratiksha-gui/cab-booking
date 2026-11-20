
"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMapEvents,
  useMap,
} from "react-leaflet";

import { useEffect } from "react";

interface MapPickerProps {
  pickup: [number, number] | null;
  drop: [number, number] | null;
  activeLocation: "pickup" | "drop";
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

function CurrentLocation({
  pickup,
  drop,
}: {
  pickup: [number, number] | null;
  drop: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Don't override a location already selected by the rider.
        if (pickup || drop) {
          return;
        }

        const currentLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        map.setView(currentLocation, 15);
      },
      (error) => {
        console.error("Unable to get current location:", error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, [map, pickup, drop]);

  return null;
}


function MapUpdater({
  pickup,
  drop,
}: {
  pickup: [number, number] | null;
  drop: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    const location = drop || pickup;

    if (location) {
      map.panTo(location, { animate: true });
    }
  }, [pickup, drop, map]);

  return null;
}

export default function MapPicker({
  pickup,
  drop,
  activeLocation,
  onLocationSelect,
}: MapPickerProps) {
  const defaultCenter: [number, number] = [
    12.9716,
    77.5946,
  ];

  return (
    <div className="overflow-hidden rounded-lg border">
      <MapContainer
        center={pickup || drop || defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onLocationSelect={onLocationSelect}
        />

        <CurrentLocation
          pickup={pickup}
          drop={drop}
        />

        <MapUpdater pickup={pickup} drop={drop} />

        {pickup && (
          <CircleMarker
            center={pickup}
            radius={activeLocation === "pickup" ? 12 : 8}
            pathOptions={{
              color: "green",
              fillColor: "green",
              fillOpacity: 1,
            }}
          />
        )}

        {drop && (
          <CircleMarker
            center={drop}
            radius={activeLocation === "drop" ? 12 : 8}
            pathOptions={{
              color: "red",
              fillColor: "red",
              fillOpacity: 1,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
