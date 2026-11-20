
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between bg-white px-8 py-5 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600">
          CabGo
        </h1>

        <div className="flex items-center gap-6">
          <a href="#" className="font-medium text-slate-700">
            Home
          </a>
          <a href="#" className="font-medium text-slate-700">
            My Rides
          </a>
          <a href="#" className="font-medium text-slate-700">
            Login
          </a>
          <button className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-5xl font-bold leading-tight text-slate-900">
              Your Ride,
              <span className="text-blue-600"> Your Way.</span>
            </h2>

            <p className="mt-5 text-lg text-slate-600">
              Book a comfortable and affordable ride.
              Reach your destination safely and on time.
            </p>

            <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-5 text-2xl font-semibold text-slate-800">
                Book Your Ride
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    placeholder="Enter pickup location"
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Drop Location
                  </label>
                  <input
                    type="text"
                    placeholder="Enter destination"
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500"
                  />
                </div>

                <button className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
                  Book a Cab
                </button>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex min-h-80 items-center justify-center rounded-2xl bg-blue-600 p-10 text-center text-white">
            <div>
              <div className="text-8xl">🚕</div>
              <h3 className="mt-6 text-3xl font-bold">
                Travel Made Easy
              </h3>
              <p className="mt-3 text-blue-100">
                Safe rides. Affordable prices. Happy journeys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Why Choose CabGo?
          </h2>

          <div className="mt-10 grid gap-8 text-center md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-6">
              <div className="text-4xl">🚗</div>
              <h3 className="mt-4 text-xl font-semibold text-slate-800">
                Easy Booking
              </h3>
              <p className="mt-2 text-slate-600">
                Book your ride in just a few steps.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-6">
              <div className="text-4xl">🛡️</div>
              <h3 className="mt-4 text-xl font-semibold text-slate-800">
                Safe Travel
              </h3>
              <p className="mt-2 text-slate-600">
                Enjoy a comfortable journey.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-6">
              <div className="text-4xl">💰</div>
              <h3 className="mt-4 text-xl font-semibold text-slate-800">
                Affordable
              </h3>
              <p className="mt-2 text-slate-600">
                Convenient rides at affordable prices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 px-6 py-6 text-center text-slate-300">
        © 2026 CabGo. All rights reserved.
      </footer>
    </main>
  );
}
