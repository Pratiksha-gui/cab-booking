
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import Script from "next/script";
import Navbar from "@/app/components/Navbar";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";

const DriverMap = dynamic(
  () => import("@/app/components/DriverMap"),
  {
    ssr: false,
    loading: () => (
      <p className="mt-4 text-gray-600">
        Loading driver map...
      </p>
    ),
  }
);
interface Ride {
  id: number;
  rider_id: number;
  driver_id: number | null;
  driver_vehicle_number: string | null;
  driver_address_proof_status: string | null;
  pickup_location: string;
  drop_location: string;
  status: string;
  created_at: string;
  estimated_distance_km: number;
  estimated_fare: number;
  // Driver live GPS location
  driver_latitude: number | null;
  driver_longitude: number | null;
  driver_location_updated_at: string | null;
}

interface Payment {
  payment_id: number;
  ride_id: number;
  pickup_location: string;
  drop_location: string;
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  created_at: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [trackingRideId, setTrackingRideId] = useState<number | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    apiRequest("/users/me", {
    headers: {
    Authorization: `Bearer ${token}`,
  },
})
    .then((data) => {
    setCurrentUser(data);
    console.log("Logged-in user:", data);
  })
    .catch((err) => {
    console.error("User profile error:", err);
  });

    apiRequest("/rides/", {
      headers: {
        Authorization: `Bearer ${token}`,
  },
   })
      .then((data) => {
      console.log("Rides API response:", data);
      setRides(data);
  })
     .catch((err) => setError(err.message))
     .finally(() => setLoading(false));

    apiRequest("/payments/my-history", {
      headers: {
        Authorization: `Bearer ${token}`,
  },
    })
      .then((data) => setPayments(data))
      .catch((err) => console.error("Payment history error:", err))
      .finally(() => setPaymentLoading(false));
  }, [router]);


 useEffect(() => {
  const token = localStorage.getItem("access_token");

  if (!token) return;

  const intervalId = setInterval(async () => {
    try {
      const updatedRides = await apiRequest("/rides/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRides(updatedRides);
    } catch (err) {
      console.error("Ride refresh failed:", err);
    }
  }, 5000);

  return () => clearInterval(intervalId);
}, []);


useEffect(() => {
  // Only drivers should send GPS coordinates
  if (currentUser?.role !== "driver") {
    return;
  }

  // Find this driver's active ride
  const activeRide = rides.find(
    (ride) =>
      ride.status === "started" &&
      ride.driver_id === currentUser.id
  );

  // No active ride: stop GPS tracking
  if (!activeRide) {
    if (trackingRideId !== null) {
      stopLocationTracking();
    }
    return;
  }

  // Start tracking only if this ride isn't already being tracked
  if (trackingRideId !== activeRide.id) {
    startLocationTracking(activeRide.id);
  }
}, [currentUser, rides, trackingRideId]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.push("/login");
  }

  async function handlePayment(rideId: number) {
  try {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    // Create Razorpay order
    const order = await apiRequest(
      `/payments/create-order?ride_id=${rideId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!window.Razorpay) {
      throw new Error("Razorpay Checkout has not loaded yet.");
    }

    // Open Razorpay Checkout
    const options: RazorpayOptions = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: "CabGo",
      description: `Payment for Ride #${rideId}`,
      order_id: order.razorpay_order_id,

      handler: async (response) => {
        try {
          const result = await apiRequest("/payments/verify", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          alert(result.message);
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : "Payment verification failed."
          );
        }
      },

      theme: {
        color: "#2563eb",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Unable to initiate payment."
    );
  }
}

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

  if (watchIdRef.current !== null) {
    navigator.geolocation.clearWatch(watchIdRef.current);
  }

  setTrackingError(null);
  setTrackingRideId(rideId);

  watchIdRef.current = navigator.geolocation.watchPosition(
    async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/rides/${rideId}/location?latitude=${latitude}&longitude=${longitude}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to update driver location.");
        }
      } catch (error) {
        console.error("GPS update failed:", error);
        setTrackingError(
          error instanceof Error ? error.message : "GPS update failed."
        );
      }
    },
    (error) => {
      setTrackingError(error.message);
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

  setTrackingRideId(null);
  setTrackingError(null);
}

  return (
    <div className="min-h-screen bg-gray-100">
      <Script
  src="https://checkout.razorpay.com/v1/checkout.js"
  strategy="afterInteractive"
/>
      
      <Navbar role="rider" />

      <main className="mx-auto max-w-5xl p-8">

      {currentUser?.role === "driver" && (
  <div className="mt-4 rounded-lg bg-blue-50 p-4">
    <h3 className="font-bold text-blue-900">
      Driver GPS Tracking
    </h3>

    <p className="mt-2 text-blue-800">
      {trackingRideId !== null
        ? `Tracking active for Ride #${trackingRideId}`
        : "Waiting for an active ride..."}
    </p>

    {trackingError && (
      <p className="mt-2 font-semibold text-red-600">
        GPS Error: {trackingError}
      </p>
    )}
  </div>
)}
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome to CabGo!
        </h2>

        <p className="mt-2 text-gray-600">
          Manage your rides from your dashboard.
        </p>

        <div
  id="my-rides"
  className="mt-8 rounded-xl bg-white p-6 shadow scroll-mt-24"
>
          <h3 className="text-xl font-semibold text-gray-900">
            My Rides
          </h3>

          {loading && <p className="mt-4">Loading rides...</p>}

          {error && (
            <p className="mt-4 text-red-600">{error}</p>
          )}

          {!loading && !error && rides.length === 0 && (
            <p className="mt-4 text-gray-600">
              You haven't booked any rides yet.
            </p>
          )}

          {!loading && !error && rides.map((ride) => (
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
                Estimated Fare: ₹{Number(ride.estimated_fare ?? 0).toFixed(2)}
              </p>

              <p className="mt-2 font-medium text-blue-600">
                Status: {ride.status}
              </p>
              {ride.status === "started" && ride.driver_id !== null && (
  
<div className="mt-4 rounded-lg border-2 border-green-600 bg-white p-5">
  <h4 className="text-lg font-extrabold text-black">
    Live Driver Location
  </h4>

  {ride.driver_latitude !== null &&
  ride.driver_longitude !== null ? (
    <>
      <p className="mt-3 text-base font-bold text-black">
        Latitude: {ride.driver_latitude}
      </p>

      <p className="mt-2 text-base font-bold text-black">
        Longitude: {ride.driver_longitude}
      </p>

      <p className="mt-3 text-base font-semibold text-black">
        Last GPS update:{" "}
        {ride.driver_location_updated_at
          ? new Date(
              ride.driver_location_updated_at
            ).toLocaleTimeString()
          : "Not available"}
      </p>

      <DriverMap
        latitude={ride.driver_latitude}
        longitude={ride.driver_longitude}
      />
    </>
  ) : (
    <p className="mt-2 text-base font-semibold text-black">
      Waiting for driver's GPS location...
    </p>
  )}
</div>

)}
{!payments.some(
  (payment) => payment.ride_id === ride.id && payment.status === "paid"
) && (
  <button
    onClick={() => handlePayment(ride.id)}
    className="mt-4 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
  >
    Pay Now ₹{Number(ride.estimated_fare ?? 0).toFixed(2)}
  </button>
)}
              {ride.driver_id !== null && (
                <div className="mt-4 rounded-lg bg-blue-50 p-4">
  <h4 className="font-semibold text-gray-900">
    Driver Details
  </h4>

  <p className="mt-2 text-gray-700">
    Driver ID: {ride.driver_id}
  </p>

  <p className="mt-1 font-semibold text-blue-700">
    Cab Number:{" "}
    {ride.driver_vehicle_number || "Not available"}
  </p>

  <div className="mt-3">
    <p className="font-medium text-gray-700">
      Address Proof Status:
    </p>

    {ride.driver_address_proof_status === "verified" ? (
      <span className="mt-1 inline-block rounded bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
        Verified
      </span>
    ) : ride.driver_address_proof_status === "rejected" ? (
      <span className="mt-1 inline-block rounded bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
        Rejected
      </span>
    ) : (
      <span className="mt-1 inline-block rounded bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
        Pending
      </span>
    )}
  </div>
</div>
              )}
            </div>
          ))}
        </div>

                <div
  id="payment-history"
  className="mt-8 rounded-xl bg-white p-6 shadow scroll-mt-24"
>
          <h3 className="text-xl font-semibold text-gray-900">
            Payment History
          </h3>

          {paymentLoading && (
            <p className="mt-4 text-gray-600">
              Loading payment history...
            </p>
          )}

          {!paymentLoading && payments.length === 0 && (
            <p className="mt-4 text-gray-600">
              No payment records found.
            </p>
          )}

          {!paymentLoading && payments.map((payment) => (
            <div
              key={payment.payment_id}
              className="mt-4 rounded-lg border border-gray-200 p-4"
            >
              <p className="font-semibold text-gray-900">
                Payment #{payment.payment_id}
              </p>

              <p className="mt-2 text-gray-700">
                Ride #{payment.ride_id}
              </p>

              <p className="text-gray-700">
                {payment.pickup_location} → {payment.drop_location}
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                Amount: ₹{Number(payment.amount ?? 0).toFixed(2)}
              </p>

              <p className="text-sm text-gray-600">
                Date: {new Date(payment.created_at).toLocaleString()}
              </p>

              <span
                className={`mt-2 inline-block rounded px-3 py-1 text-sm font-semibold ${
                  payment.status === "paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {payment.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
