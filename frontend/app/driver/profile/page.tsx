
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import Navbar from "@/app/components/Navbar";

interface DriverProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  vehicle_number: string | null;
  address_proof_status?: string | null;
  address_proof_rejection_reason?: string | null;
}

export default function DriverProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    vehicle_number: "",
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [proofStatus, setProofStatus] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    apiRequest("/users/me/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          vehicle_number: data.vehicle_number || "",
        });
        setProofStatus(data.address_proof_status ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleCancel() {
    if (!profile) return;

    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone || "",
      vehicle_number: profile.vehicle_number || "",
    });

    setEditing(false);
    setError("");
    setSuccess("");
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedProfile = await apiRequest("/users/me/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          vehicle_number: form.vehicle_number.trim().toUpperCase(),
        }),
      });

      setProfile(updatedProfile);

      setForm({
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone || "",
        vehicle_number: updatedProfile.vehicle_number || "",
      });

      setEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddressProofUpload() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    router.push("/login");
    return;
  }

  if (!selectedFile) {
    setUploadMessage("Please select a document first.");
    return;
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (!allowedTypes.includes(selectedFile.type)) {
    setUploadMessage("Only PDF, JPG and PNG files are allowed.");
    return;
  }

  if (selectedFile.size > 5 * 1024 * 1024) {
    setUploadMessage("File size must not exceed 5 MB.");
    return;
  }

  setUploading(true);
  setUploadMessage("");

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/address-proof`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Address proof upload failed.");
    }

    setProofStatus(data.address_proof_status);
    setSelectedFile(null);
    setUploadMessage(data.message || "Address proof uploaded successfully.");
  } catch (err) {
    setUploadMessage(
      err instanceof Error ? err.message : "Upload failed."
    );
  } finally {
    setUploading(false);
  }
}
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        Loading driver profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <p className="text-red-600">
          {error || "Unable to load driver profile."}
        </p>
        <button
          onClick={() => router.push("/driver")}
          className="mt-4 rounded bg-blue-600 px-5 py-2 text-white"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar role="driver" />
      <main className="mx-auto max-w-2xl p-8">
        <div className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-3xl font-bold text-gray-900">
            My Profile
          </h2>

          <p className="mt-2 text-gray-600">
            View and manage your driver information.
          </p>

          {error && (
            <p className="mt-4 rounded bg-red-100 p-3 text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 rounded bg-green-100 p-3 text-green-700">
              {success}
            </p>
          )}

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div>
              <label className="mb-1 block font-medium text-gray-700">
                Driver Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={!editing}
                required
                className="w-full rounded border border-gray-300 p-3 text-gray-900 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled={!editing}
                required
                className="w-full rounded border border-gray-300 p-3 text-gray-900 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-700">
                Phone Number
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                disabled={!editing}
                className="w-full rounded border border-gray-300 p-3 text-gray-900 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-700">
                Vehicle Registration Number
              </label>
              <input
                name="vehicle_number"
                value={form.vehicle_number}
                onChange={handleChange}
                disabled={!editing}
                required
                maxLength={20}
                className="w-full rounded border border-gray-300 p-3 text-gray-900 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-700">
                Account Role
              </label>
              <input
                value={profile.role}
                disabled
                className="w-full rounded border border-gray-300 bg-gray-100 p-3 text-gray-900"
              />
            </div>

            {!editing ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setSuccess("");
                  setError("");
                }}
                className="w-full rounded bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 rounded bg-gray-500 px-5 py-3 font-semibold text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 border-t border-gray-200 pt-6">
  <h3 className="text-xl font-bold text-gray-900">
    Address Proof Verification
  </h3>

  <p className="mt-2 text-gray-600">
    Upload a valid address-proof document for verification.
  </p>

  <div className="mt-4">
    <span className="font-medium text-gray-700">
      Verification Status:{" "}
    </span>

    <span
      className={`font-semibold ${
         profile.address_proof_status === "verified"
          ? "text-green-600"
          :  profile.address_proof_status === "rejected"
          ? "text-red-600"
          : "text-yellow-600"
      }`}
    >
      { profile.address_proof_status
        ?  profile.address_proof_status.charAt(0).toUpperCase() +  profile.address_proof_status.slice(1)
        : "Not Submitted"}
    </span>
  </div>

  {profile.address_proof_status === "rejected" &&
  profile.address_proof_rejection_reason && (
    <div className="mt-3 rounded-lg bg-red-100 p-3">
      <p className="font-semibold text-red-800">Rejection Reason</p>
      <p className="mt-1 text-red-700">
        {profile.address_proof_rejection_reason}
      </p>
      <p className="mt-2 text-sm text-red-700">
        Please upload a corrected address-proof document.
      </p>
    </div>
  )}

  <div className="mt-5">
    <label className="mb-2 block font-medium text-gray-700">
      Select Address Proof (PDF, JPG or PNG)
    </label>

    <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      onChange={(e) =>
        setSelectedFile(e.target.files?.[0] || null)
      }
      className="w-full rounded border border-gray-300 p-3 text-gray-900"
    />

    {selectedFile && (
      <p className="mt-2 text-sm text-gray-600">
        Selected: {selectedFile.name}
      </p>
    )}

    <p className="mt-2 text-sm text-gray-500">
      Maximum file size: 5 MB.
    </p>

    <button
      type="button"
      onClick={handleAddressProofUpload}
      disabled={!selectedFile || uploading}
      className="mt-4 w-full rounded bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {uploading ? "Uploading..." : "Upload Address Proof"}
    </button>

    {uploadMessage && (
      <p className="mt-3 text-sm text-gray-700">
        {uploadMessage}
      </p>
    )}
  </div>
</div>
        </div>
      </main>
    </div>
  );
}
