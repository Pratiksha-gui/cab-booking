
"use client";


import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import Navbar from "@/app/components/Navbar";

interface Ride {
  id: number;
  pickup_location: string;
  drop_location: string;
  status: string;
  created_at: string;
  estimated_distance_km: number;
  estimated_fare: number;
  driver_latitude?: number | null;
  driver_longitude?: number | null;
}

export default function DriverDashboard() {
  const router = useRouter();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackingRideId, setTrackingRideId] = useState<number | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{
  latitude: number;
  longitude: number;
} | null>(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const locationRequestInProgress = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([
  apiRequest("/rides/available", {
    headers: { Authorization: `Bearer ${token}` },
  }),
  apiRequest("/rides/", {
    headers: { Authorization: `Bearer ${token}` },
  }),
])
  .then(([availableRides, assignedRides]) => {
    const allRides = [...availableRides, ...assignedRides];

    const uniqueRides = Array.from(
      new Map(allRides.map((ride) => [ride.id, ride])).values()
    );

    setRides(uniqueRides);
  })
  .catch((err) => setError(err.message))
  .finally(() => setLoading(false));
  }, [router]);


  function startLocationTracking(rideId: number) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    setTrackingError("Please log in again.");
    return;
  }

  if (!navigator.geolocation) {
    setTrackingError("Geolocation is not supported by this browser.");
    return;
  }

  if (trackingRideId !== null && trackingRideId !== rideId) {
  setTrackingError("Another ride is already being tracked.");
  return;
}

if (watchIdRef.current !== null) {
  navigator.geolocation.clearWatch(watchIdRef.current);
  watchIdRef.current = null;
}

  setTrackingError("");
  setTrackingRideId(rideId);

  watchIdRef.current = navigator.geolocation.watchPosition(
    async (position) => {
  if (locationRequestInProgress.current) {
    return;
  }

  locationRequestInProgress.current = true;

  try {
    setCurrentLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    setTrackingError("");
    setLastLocationUpdate(new Date().toLocaleTimeString());

    await apiRequest(
      `/rides/${rideId}/location?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

  } catch (err) {
    setTrackingError(
      err instanceof Error ? err.message : "Location update failed"
    );
  } finally {
    locationRequestInProgress.current = false;
  }
},
    (err) => {
  if (err.code === 1) {
    setTrackingError("Location permission denied.");
  } else if (err.code === 2) {
    setTrackingError("Location position unavailable.");
  } else if (err.code === 3) {
    setTrackingError("GPS timeout. Waiting for another location update...");
  } else {
    setTrackingError(err.message);
  }
},
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    }
  );
}



function stopLocationTracking() {
  if (watchIdRef.current !== null) {
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }
}

useEffect(() => {
  const activeRide = rides.find(
    (ride) => ride.status === "started"
  );

  if (!activeRide) {
    if (watchIdRef.current !== null) {
      stopLocationTracking();
      setTrackingRideId(null);
    }
    return;
  }

  if (trackingRideId === activeRide.id && watchIdRef.current !== null) {
    return;
  }

  if (watchIdRef.current !== null) {
    stopLocationTracking();
  }

  setTrackingRideId(null);
  startLocationTracking(activeRide.id);
}, [rides, trackingRideId]);

async function handleRideAction(
  rideId: number,
  action: "accept" | "start" | "complete"
) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    setError("Authentication required. Please log in again.");
    return;
  }

  try {
    await apiRequest(`/rides/${rideId}/${action}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (action === "complete") {
      stopLocationTracking();
      setTrackingRideId(null);
  }

    const updatedRides = await apiRequest("/rides/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setRides(updatedRides);

  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Action failed"
    );
  }
}


  function handleLogout() {
  stopLocationTracking();
  localStorage.removeItem("access_token");
  router.push("/login");
}
useEffect(() => {
  return () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };
}, []);
  return (
    <div className="min-h-screen bg-gray-100">
     <Navbar role="driver" />

      <main className="mx-auto max-w-5xl p-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Driver Dashboard
        </h2>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h3 className="text-xl font-semibold text-gray-900">
            My Assigned Rides
          </h3>

          {loading && <p className="mt-4">Loading rides...</p>}

          {error && (
            <p className="mt-4 text-red-600">{error}</p>
          )}

          {trackingRideId !== null && (
  <p className="mt-4 text-blue-600">
    GPS tracking active for Ride #{trackingRideId}
  </p>
)}

{trackingError && (
  <p className="mt-2 text-red-600">
    GPS Error: {trackingError}
  </p>
)}

{currentLocation && (
  <div className="mt-3 rounded bg-gray-100 p-3">
    <p>Latitude: {currentLocation.latitude}</p>
    <p>Longitude: {currentLocation.longitude}</p>

    {lastLocationUpdate && (
      <p className="mt-2 text-sm text-gray-600">
        Last GPS update: {lastLocationUpdate}
      </p>
    )}
  </div>
)}

          {!loading && !error && rides.length === 0 && (
            <p className="mt-4 text-gray-600">
              No rides assigned yet.
            </p>
          )}

          {!loading && rides.map((ride) => (
            <div
              key={ride.id}
              className="mt-4 rounded-lg border border-gray-200 p-4"
            >
              <p className="font-semibold text-gray-900">
                Ride #{ride.id}
              </p>

              <p className="mt-2 text-gray-700">
                Pickup: {ride.pickup_location}
              </p>

              <p className="text-gray-700">
                Drop: {ride.drop_location}
              </p>
              <p className="mt-2 text-gray-700">
                Estimated Distance: {ride.estimated_distance_km} km
              </p>

              <p className="font-semibold text-green-600">
                Estimated Fare: ₹{ride.estimated_fare.toFixed(2)}
              </p>

              <p className="mt-2 font-medium text-blue-600">
                Status: {ride.status}
              </p>

            {ride.status === "requested" && (
                 <button
                   onClick={() => handleRideAction(ride.id, "accept")}
                   className="mt-4 rounded bg-green-600 px-5 py-2 text-white hover:bg-green-700"
                >
                   Accept Ride
                </button>
            )}

            {ride.status === "accepted" && (
                <button
                  onClick={() => handleRideAction(ride.id, "start")}
                  className="mt-4 rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
                >
                  Start Ride
                </button>
            )}

            {ride.status === "started" && (
                 <button
                   onClick={() => handleRideAction(ride.id, "complete")}
                   className="mt-4 rounded bg-purple-600 px-5 py-2 text-white hover:bg-purple-700"
         >
                   Complete Ride
                </button>
            )}

            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
