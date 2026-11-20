
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import MapPicker from "../components/MapLoader";
import Navbar from "../components/Navbar";
export default function BookRidePage() {
  const router = useRouter();

 const [form, setForm] = useState({
  pickup_location: "",
  drop_location: "",
  pickup_latitude: "",
  pickup_longitude: "",
  drop_latitude: "",
  drop_longitude: "",
});

  const [activeLocation, setActiveLocation] = useState<"pickup" | "drop">(
    "pickup"
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleMapClick(lat: number, lng: number) {
    if (activeLocation === "pickup") {
      setForm((prev) => ({
        ...prev,
        pickup_latitude: lat.toFixed(6),
        pickup_longitude: lng.toFixed(6),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        drop_latitude: lat.toFixed(6),
        drop_longitude: lng.toFixed(6),
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
  
if (
  !form.pickup_latitude ||
  !form.pickup_longitude ||
  !form.drop_latitude ||
  !form.drop_longitude
) {
  setError("Please select both pickup and drop locations on the map.");
  return;
}

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/rides/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          pickup_latitude: Number(form.pickup_latitude),
          pickup_longitude: Number(form.pickup_longitude),
          drop_latitude: Number(form.drop_latitude),
          drop_longitude: Number(form.drop_longitude),
        }),
      });

      alert("Ride booked successfully!");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
    <Navbar role="rider" />

    <div className="flex items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl space-y-4 rounded-xl bg-white p-8 shadow-lg"
      >
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Book Your Cab
        </h1>

        <input
          name="pickup_location"
          placeholder="Pickup Location"
          value={form.pickup_location}
          onChange={handleChange}
          required
          className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        />

        <input
          name="drop_location"
          placeholder="Drop Location"
          value={form.drop_location}
          onChange={handleChange}
          required
          className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        />

        <h2 className="text-lg font-semibold text-gray-800">
          Select Locations on Map
        </h2>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveLocation("pickup")}
            className={`rounded px-4 py-2 font-semibold ${
              activeLocation === "pickup"
                ? "bg-green-600 text-white"
                : "border border-green-600 text-green-700"
            }`}
          >
            Select Pickup
          </button>

          <button
            type="button"
            onClick={() => setActiveLocation("drop")}
            className={`rounded px-4 py-2 font-semibold ${
              activeLocation === "drop"
                ? "bg-red-600 text-white"
                : "border border-red-600 text-red-700"
            }`}
          >
            Select Drop
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Currently selecting:{" "}
          <strong>
            {activeLocation === "pickup" ? "Pickup Location" : "Drop Location"}
          </strong>
          . Click anywhere on the map to set it.
        </p>

        <MapPicker
  pickup={
    form.pickup_latitude && form.pickup_longitude
      ? [
          Number(form.pickup_latitude),
          Number(form.pickup_longitude),
        ]
      : null
  }
  drop={
    form.drop_latitude && form.drop_longitude
      ? [
          Number(form.drop_latitude),
          Number(form.drop_longitude),
        ]
      : null
  }
  activeLocation={activeLocation}
  onLocationSelect={handleMapClick}
/>

        <h3 className="font-semibold text-gray-800">Pickup Coordinates</h3>

        <input
          name="pickup_latitude"
          type="number"
          step="any"
          placeholder="Pickup Latitude"
          value={form.pickup_latitude}
          onChange={handleChange}
          required
          className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        />

        <input
          name="pickup_longitude"
          type="number"
          step="any"
          placeholder="Pickup Longitude"
          value={form.pickup_longitude}
          onChange={handleChange}
          required
          className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        />

        <h3 className="font-semibold text-gray-800">Drop Coordinates</h3>

        <input
          name="drop_latitude"
          type="number"
          step="any"
          placeholder="Drop Latitude"
          value={form.drop_latitude}
          onChange={handleChange}
          required
          className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        />

        <input
          name="drop_longitude"
          type="number"
          step="any"
          placeholder="Drop Longitude"
          value={form.drop_longitude}
          onChange={handleChange}
          required
          className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Booking..." : "Book Now"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="w-full rounded border border-gray-300 p-3 text-gray-700"
        >
          Back to Dashboard
        </button>
      </form>
      </div>
    </div>
  );
}
