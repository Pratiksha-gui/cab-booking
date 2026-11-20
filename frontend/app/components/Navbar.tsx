
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NavbarProps {
  role: "rider" | "driver" | "admin";
}

const navigationItems = {
  
  rider: [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Book a Ride", href: "/book" },
  { label: "My Rides", href: "/dashboard#my-rides" },
  { label: "Payment History", href: "/dashboard#payment-history" },
],
  driver: [
  { label: "Dashboard", href: "/driver" },
  { label: "Profile", href: "/driver/profile" },
],
  admin: [
  { label: "Dashboard", href: "/admin" },
  { label: "Driver Management", href: "/admin#driver-management" },
  { label: "User Management", href: "/admin#user-management" },
  { label: "Ride Management", href: "/admin#ride-management" },
  { label: "Payment Summary & Analytics", href: "/admin#payment-summary-&-analytics" },
  { label: "Payment Management", href: "/admin#payment-management" },
],
};

export default function Navbar({ role }: NavbarProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const router = useRouter();
  useEffect(() => {
  const updateHash = () => setHash(window.location.hash);

  updateHash();
  window.addEventListener("hashchange", updateHash);

  return () => {
    window.removeEventListener("hashchange", updateHash);
  };
}, []);
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 bg-gray-900 px-6 py-4 text-white">
      <Link href={`/${role === "rider" ? "dashboard" : role}`} className="text-xl font-bold">
        CabGo
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        {navigationItems[role].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
    setHash(item.href.includes("#") ? `#${item.href.split("#")[1]}` : "");
  }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              (item.href.includes("#")
                ? hash === item.href.split("#")[1] || hash === `#${item.href.split("#")[1]}`
                : pathname === item.href)
                ? "bg-blue-600 text-white"
                : "text-gray-200 hover:bg-gray-700"
            }`}
          >
            {item.label}
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
