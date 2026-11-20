"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";

interface AdminStatistics {
  total_users: number;
  total_riders: number;
  total_drivers: number;
  active_users: number;
  deactivated_users: number;
  total_rides: number;
}

interface PaymentStatistics {
  total_payments: number;
  successful_payments: number;
  pending_payments: number;
  total_revenue: number;
}

interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  vehicle_number: string | null;
  address_proof_status: string | null;
}

interface UserAccount {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;

}

interface AdminRide {
  id: number;
  rider_id: number;
  driver_id: number | null;
  driver_vehicle_number: string | null;
  driver_address_proof_status: string | null;
  pickup_location: string;
  drop_location: string;
  pickup_latitude: number;
  pickup_longitude: number;
  drop_latitude: number;
  drop_longitude: number;
  status: string;
  created_at: string;
  estimated_distance_km: number;
  estimated_fare: number;
}


interface AdminPayment {
  payment_id: number;
  ride_id: number;
  rider_id: number;
  rider_name: string;
  rider_email: string;
  pickup_location: string;
  drop_location: string;
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  created_at: string;
}
export default function AdminDashboard() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [appliedPaymentSearch, setAppliedPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [paymentStatistics, setPaymentStatistics] =
  useState<PaymentStatistics | null>(null);

  const [paymentStatisticsLoading, setPaymentStatisticsLoading] =
  useState(true);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [rides, setRides] = useState<AdminRide[]>([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userActionLoading, setUserActionLoading] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [documentUrl, setDocumentUrl] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  async function fetchStatistics() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    router.push("/login");
    return;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/admin/statistics`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load dashboard statistics");
    }

    const data = await response.json();
    setStatistics(data);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to load statistics"
    );
  } finally {
    setStatisticsLoading(false);
  }
}

  async function fetchUsers() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    router.push("/login");
    return;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/admin/all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load users");
    }

    const data = await response.json();
    setUsers(data);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to load users"
    );
  } finally {
    setUsersLoading(false);
  }
}


  
async function fetchRides() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    router.push("/login");
    return;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/rides/admin/all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load rides");
    }

    const data = await response.json();
    setRides(data);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to load rides"
    );
  } finally {
    setRidesLoading(false);
  }
}

  async function fetchPayments() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    router.push("/login");
    return;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payments/admin/all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load payments");
    }

    const data = await response.json();
    setPayments(data);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to load payments"
    );
  } finally {
    setPaymentsLoading(false);
  }
}

  const filteredPayments = payments.filter((payment) => {
  const search = appliedPaymentSearch.trim().toLowerCase();

  const isNumericSearch = /^\d+$/.test(search);

  const exactPaymentExists =
    isNumericSearch &&
    payments.some(
      (p) => p.payment_id === Number(search)
    );

  const matchesSearch =
    search === "" ||
    (exactPaymentExists
      ? payment.payment_id === Number(search)
      : isNumericSearch
      ? payment.ride_id === Number(search)
      : payment.rider_name.toLowerCase().includes(search) ||
        payment.rider_email.toLowerCase().includes(search));

  const matchesStatus =
    paymentStatusFilter === "all" ||
    payment.status.toLowerCase() === paymentStatusFilter;

  return matchesSearch && matchesStatus;
});
  
  
  async function fetchPaymentStatistics() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    router.push("/login");
    return;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payments/admin/statistics`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load payment statistics");
    }

    const data = await response.json();
    setPaymentStatistics(data);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to load payment statistics"
    );
  } finally {
    setPaymentStatisticsLoading(false);
  }
}

  async function handleUserStatusChange(
  userId: number,
  isActive: boolean
) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    router.push("/login");
    return;
  }

  setUserActionLoading(userId);
  setError("");
  setSuccessMessage("");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/admin/${userId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: !isActive,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to update account status");
    }

    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        user.id === userId
          ? { ...user, is_active: data.is_active }
          : user
      )
    );

    setSuccessMessage(data.message);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Something went wrong"
    );
  } finally {
    setUserActionLoading(null);
  }
}

  async function handleViewDocument(driverId: number) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    router.push("/login");
    return;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/admin/drivers/${driverId}/address-proof`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Unable to load address proof document");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
    }

    setDocumentUrl(url);
    setSelectedDriver(
      drivers.find((driver) => driver.id === driverId) || null
    );
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Document viewing failed"
    );
  }
}

async function handleReview(
  driverId: number,
  status: "verified" | "rejected"
) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    router.push("/login");
    return;
  }

  if (status === "rejected" && !reviewReason.trim()) {
    setError("Please enter a rejection reason.");
    return;
  }

  setReviewLoading(true);
  setError("");
  setSuccessMessage("");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/admin/drivers/${driverId}/address-proof/review`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          rejection_reason:
            status === "rejected" ? reviewReason.trim() : null,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Review failed");
    }

    setDrivers((previousDrivers) =>
      previousDrivers.map((driver) =>
        driver.id === driverId
          ? { ...driver, address_proof_status: status }
          : driver
      )
    );

    setSuccessMessage(data.message);
    setReviewReason("");
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Something went wrong"
    );
  } finally {
    setReviewLoading(false);
  }
}
  useEffect(() => {
    async function fetchDrivers() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/admin/drivers`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          setError("You are not authorized to access the admin dashboard.");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load drivers");
        }

        const data = await response.json();
        setDrivers(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDrivers();
    fetchUsers();
    fetchStatistics();
    fetchRides();
    fetchPayments();
    fetchPaymentStatistics();
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
       <Navbar role="admin" />
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          CabGo Admin Dashboard
        </h1>
        </div>  
        <p className="mb-8 text-base font-medium text-gray-700">
          Manages drivers and address-proof verification.
        </p>

        <div className="mb-8">
  {statisticsLoading ? (
    <p className="text-gray-700">Loading statistics...</p>
  ) : statistics ? (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[
        { title: "Total Users", value: statistics.total_users },
        { title: "Total Riders", value: statistics.total_riders },
        { title: "Total Drivers", value: statistics.total_drivers },
        { title: "Active Users", value: statistics.active_users },
        { title: "Deactivated Users", value: statistics.deactivated_users },
        { title: "Total Rides", value: statistics.total_rides },
      ].map((item) => (
        <div
          key={item.title}
          className="rounded-xl bg-white p-6 shadow"
        >
          <h2 className="text-sm font-semibold text-gray-600">
            {item.title}
          </h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-red-600">Unable to load statistics.</p>
  )}
</div>

        {loading && (
          <p className="font-medium text-gray-900">Loading drivers...</p>
        )}

        {error && (
          <p className="rounded bg-red-100 p-4 text-red-700">
            {error}
          </p>
        )}
<h2
  id="driver-management"
  className="mb-4 mt-10 text-2xl font-bold text-gray-900"
>
  Driver Management
</h2>
        
        {!loading && !error && (
        
          <div className="overflow-x-auto rounded-xl bg-white shadow">
            <table className="w-full text-left">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-4">Driver ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Vehicle Number</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-t border-gray-200 text-gray-900">
                    <td className="p-4">{driver.id}</td>
                    <td className="p-4">{driver.name}</td>
                    <td className="p-4">{driver.email}</td>
                    <td className="p-4">{driver.phone || "N/A"}</td>
                    <td className="p-4">
                      {driver.vehicle_number || "N/A"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          driver.address_proof_status === "verified"
                            ? "bg-green-100 text-green-700"
                            : driver.address_proof_status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {driver.address_proof_status || "pending"}

                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
      <button
        onClick={() => handleViewDocument(driver.id)}
        className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        View Document
      </button>

      <button
  onClick={() => {
    setSelectedDriver(driver);
    setError("");
  }}
  className="ml-2 rounded bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
>
  Select
</button>

      <button
        onClick={() => handleReview(driver.id, "verified")}
        disabled={reviewLoading}
        className="ml-2 rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>
      
    </td>
                  </tr>
                ))}

                {drivers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center font-medium text-gray-900">
                      No drivers registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-4">
  <label className="mb-2 block font-semibold text-gray-900">
    Rejection Reason
  </label>
  <textarea

    value={reviewReason}
    onChange={(e) => setReviewReason(e.target.value)}
    placeholder="Enter the reason if rejecting a document..."
    className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
    rows={2}
  />
</div>

<button
  onClick={() => {
    if (!selectedDriver) {
      setError("Please select a driver first.");
      return;
    }

    handleReview(selectedDriver.id, "rejected");
  }}
  disabled={reviewLoading || !selectedDriver}
  className="mb-6 rounded bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
>
  {reviewLoading ? "Submitting..." : "Submit Rejection"}
</button>

        <div className="mt-10">
  <h2
  id="user-management"
  className="mb-4 text-2xl font-bold text-gray-900"
>
  User Management
</h2>

  {usersLoading ? (
    <p className="text-gray-700">Loading users...</p>
  ) : (
    <div className="overflow-x-auto rounded-xl bg-white shadow">
      <table className="w-full text-left">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="p-4">User ID</th>
            <th className="p-4">Name</th>
            <th className="p-4">Email</th>
            <th className="p-4">Phone</th>
            <th className="p-4">Role</th>
            <th className="p-4">Account Status</th>
            <th className="p-4">Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-t border-gray-200 text-gray-900"
            >
              <td className="p-4">{user.id}</td>
              <td className="p-4">{user.name}</td>
              <td className="p-4">{user.email}</td>
              <td className="p-4">{user.phone || "N/A"}</td>
              <td className="p-4 capitalize">{user.role}</td>

              <td className="p-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    user.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.is_active ? "Active" : "Deactivated"}
                </span>
              </td>

              <td className="p-4">
                <button
                  onClick={() =>
                    handleUserStatusChange(user.id, user.is_active)
                  }
                  disabled={userActionLoading === user.id}
                  className={`rounded px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                    user.is_active
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {userActionLoading === user.id
                    ? "Updating..."
                    : user.is_active
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </td>
            </tr>
          ))}

          {users.length === 0 && (
            <tr>
              <td colSpan={7} className="p-6 text-center">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )}
</div>


        {documentUrl && selectedDriver && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-white p-4 shadow-xl">

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Address Proof - {selectedDriver.name}
        </h2>

        <button
          onClick={() => {
            URL.revokeObjectURL(documentUrl);
            setDocumentUrl("");
            setSelectedDriver(null);
          }}
          className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          Close
        </button>
      </div>

      <iframe
        src={documentUrl}
        title="Driver Address Proof"
        className="h-full w-full rounded border border-gray-300"
      />
    </div>
  </div>
)}
<div className="mt-10">
  <h2
  id="ride-management"
  className="mb-4 text-2xl font-bold text-gray-900"
>
  Ride Management
</h2>
  
{ridesLoading ? (
  <p className="text-gray-700">Loading rides...</p>
) : (
  <>
    <p className="mb-4 font-semibold text-gray-700">
      Total Rides: {rides.length}
    </p>

    <div className="overflow-x-auto rounded-xl bg-white shadow">
      <table className="w-full text-left">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="p-4">Ride ID</th>
            <th className="p-4">Rider ID</th>
            <th className="p-4">Driver ID</th>
            <th className="p-4">Vehicle Number</th>
            <th className="p-4">Pickup</th>
            <th className="p-4">Drop</th>
            <th className="p-4">Distance</th>
            <th className="p-4">Fare</th>
            <th className="p-4">Status</th>
            <th className="p-4">Booking Date & Time</th>
          </tr>
        </thead>

        <tbody>
          {rides.map((ride) => (
            <tr
              key={ride.id}
              className="border-t border-gray-200 text-gray-900"
            >
              <td className="p-4">{ride.id}</td>
              <td className="p-4">{ride.rider_id}</td>
              <td className="p-4">{ride.driver_id ?? "Unassigned"}</td>
              <td className="p-4">{ride.driver_vehicle_number ?? "Not Available"}</td>
              <td className="p-4">{ride.pickup_location}</td>
              <td className="p-4">{ride.drop_location}</td>
              <td className="p-4">
                {ride.estimated_distance_km} km
              </td>
              <td className="p-4">
                ₹{ride.estimated_fare.toFixed(2)}
              </td>
              <td className="p-4 capitalize">{ride.status}</td>
              <td className="p-4 whitespace-nowrap">
  {new Date(ride.created_at).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })}
</td>
            </tr>
          ))}

          {rides.length === 0 && (
            <tr>
              <td colSpan={10} className="p-6 text-center">
                No rides found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </>
)}
<div className="mt-10">
  <h2
  id="payment-summary-&-analytics"
  className="mb-4 text-2xl font-bold text-gray-900"
>
  Payment Summary & Analytics
</h2>
  {paymentStatisticsLoading ? (
    <p className="text-gray-700">Loading payment statistics...</p>
  ) : paymentStatistics ? (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[
        {
          title: "Total Payments",
          value: paymentStatistics.total_payments,
        },
        {
          title: "Successful Payments",
          value: paymentStatistics.successful_payments,
        },
        {
          title: "Pending Payments",
          value: paymentStatistics.pending_payments,
        },
        {
          title: "Total Revenue",
          value: `₹${Number(paymentStatistics.total_revenue).toFixed(2)}`,
        },
      ].map((item) => (
        <div
          key={item.title}
          className="rounded-xl bg-white p-6 shadow"
        >
          <h3 className="text-sm font-semibold text-gray-600">
            {item.title}
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-red-600">Unable to load payment statistics.</p>
  )}
</div>
<div className="mt-10">
  <h2
  id="payment-management"
  className="mb-4 text-2xl font-bold text-gray-900"
>
  Payment Management
</h2>

<div className="mb-4 flex flex-col gap-3 md:flex-row">
  <div className="relative flex flex-1">
    <input
      type="text"
      placeholder="Search Payment ID, Ride ID, Rider name or email..."
      value={paymentSearch}
      onChange={(e) => setPaymentSearch(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setAppliedPaymentSearch(paymentSearch);
        }
      }}
      className="w-full rounded-lg border border-gray-300 py-2 pl-4 pr-12 text-gray-900"
    />

    <button
      type="button"
      onClick={() => setAppliedPaymentSearch(paymentSearch)}
      className="absolute right-0 top-0 flex h-full items-center rounded-r-lg bg-blue-600 px-4 text-white hover:bg-blue-700"
      title="Search payments"
    >
      🔍
    </button>
  </div>

  <select
    value={paymentStatusFilter}
    onChange={(e) => setPaymentStatusFilter(e.target.value)}
    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
  >
    <option value="all">All Payments</option>
    <option value="paid">Paid</option>
    <option value="pending">Pending</option>
  </select>
</div>
  {paymentsLoading ? (
    <p className="text-gray-700">Loading payments...</p>
  ) : (
    <>
      <p className="mb-4 font-semibold text-gray-700">
        Total Payments: {payments.length}
      </p>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-4">Payment ID</th>
              <th className="p-4">Ride ID</th>
              <th className="p-4">Rider</th>
              <th className="p-4">Pickup</th>
              <th className="p-4">Drop</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Payment ID (Gateway)</th>
              <th className="p-4">Payment Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredPayments.map((payment) => (
              <tr
                key={payment.payment_id}
                className="border-t border-gray-200 text-gray-900"
              >
                <td className="p-4">{payment.payment_id}</td>
                <td className="p-4">{payment.ride_id}</td>
                <td className="p-4">
                  {payment.rider_name}
                  <br />
                  <span className="text-sm text-gray-600">
                    {payment.rider_email}
                  </span>
                </td>
                <td className="p-4">{payment.pickup_location}</td>
                <td className="p-4">{payment.drop_location}</td>
                <td className="p-4">
                  ₹{Number(payment.amount).toFixed(2)}
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      payment.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="p-4">
                  {payment.razorpay_payment_id || "N/A"}
                </td>
                <td className="p-4 whitespace-nowrap">
                  {new Date(payment.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
              </tr>
            ))}

            {payments.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center">
                  No payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )}
</div>


</div>
      </div>
 </main>
  );
}
