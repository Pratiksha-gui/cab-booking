
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "rider",
    age: "",
    password: "",
    vehicle_number: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        phone: form.phone || undefined,
        age: form.age ? Number(form.age) : undefined,
        vehicle_number:
          form.role === "driver"
            ? form.vehicle_number.trim().toUpperCase()
            : undefined,
      };

      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("Registration successful!");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow-lg"
      >
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Create Account
        </h1>

        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        />

        <input
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        >
          <option value="rider">Rider</option>
          <option value="driver">Driver</option>
        </select>

        {form.role === "driver" && (
          <input
            name="vehicle_number"
            placeholder="Vehicle Number (e.g. KA-01-AB-1234)"
            value={form.vehicle_number}
            onChange={handleChange}
            required
            maxLength={20}
            className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
          />
        )}

        <input
          name="age"
          type="number"
          placeholder="Age (Optional)"
          value={form.age}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
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
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
