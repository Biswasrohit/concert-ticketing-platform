import React, { useMemo, useState } from "react";

/**
 * Plain-React + Tailwind demo UI that maps to your ERD:
 * - Concerts (with Venue, Group, Lineup: Artist+Role)
 * - Ticket Categories (price/inventory)
 * - Cart drawer + simple Checkout modal
 * - Lightweight Orders & Customers boards (mock)
 *
 * No external UI libraries or icons used.
 */

// ---------- Types via JSDoc (for editor intellisense only) ----------
/** @typedef {{ id:string, name:string }} Genre */
/** @typedef {{ id:string, name:string }} Role */
/** @typedef {{ id:string, name:string, genres:string[] }} Artist */
/** @typedef {{ id:string, name:string, city:string, capacity:number }} Venue */
/** @typedef {{ id:string, name:string }} ConcertGroup */
/** @typedef {{ id:string, title:string, date:string, venueId:string, groupId?:string, lineup:{artistId:string, roleId:string}[], ticketCategoryIds:string[] }} Concert */
/** @typedef {{ id:string, concertId:string, name:string, price:number, inventory:number, row?:string }} TicketCategory */
/** @typedef {{ id:string, name:string, email:string }} Customer */
/** @typedef {{ id:string, customerId:string, createdAt:string, total:number, items:{categoryId:string, qty:number, unitPrice:number}[] }} Order */

// ---------- Seed Data ----------
const seed = (() => {
  /** @type {Genre[]} */
  const genres = [
    { id: "g1", name: "Pop" },
    { id: "g2", name: "Rock" },
    { id: "g3", name: "Electronic" },
    { id: "g4", name: "Classical" },
    { id: "g5", name: "Hip-Hop" },
  ];

  /** @type {Role[]} */
  const roles = [
    { id: "r1", name: "Headliner" },
    { id: "r2", name: "Opener" },
    { id: "r3", name: "Guest" },
    { id: "r4", name: "Conductor" },
  ];

  /** @type {Artist[]} */
  const artists = [
    { id: "a1", name: "Neon Dunes", genres: ["g2", "g3"] },
    { id: "a2", name: "Aurora Vale", genres: ["g1"] },
    { id: "a3", name: "Metro Echo", genres: ["g3"] },
    { id: "a4", name: "Civic Symphony", genres: ["g4"] },
  ];

  /** @type {Venue[]} */
  const venues = [
    { id: "v1", name: "Harbor Pavilion", city: "Brooklyn, NY", capacity: 8500 },
    { id: "v2", name: "Cedar Hall", city: "Boston, MA", capacity: 2200 },
    { id: "v3", name: "Skyline Bowl", city: "Chicago, IL", capacity: 12000 },
  ];

  /** @type {ConcertGroup[]} */
  const groups = [
    { id: "cg1", name: "Summer Nights Series" },
    { id: "cg2", name: "Orchestral Sundays" },
  ];

  /** @type {Concert[]} */
  const concerts = [
    {
      id: "c1",
      title: "Neon Dunes: Live at the Harbor",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      venueId: "v1",
      groupId: "cg1",
      lineup: [
        { artistId: "a1", roleId: "r1" },
        { artistId: "a3", roleId: "r2" },
      ],
      ticketCategoryIds: ["tc1", "tc2", "tc3"],
    },
    {
      id: "c2",
      title: "Aurora Vale: Moonlight Tour",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
      venueId: "v3",
      lineup: [
        { artistId: "a2", roleId: "r1" },
        { artistId: "a3", roleId: "r3" },
      ],
      ticketCategoryIds: ["tc4", "tc5"],
    },
    {
      id: "c3",
      title: "Civic Symphony plays Beethoven 7",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 35).toISOString(),
      venueId: "v2",
      groupId: "cg2",
      lineup: [{ artistId: "a4", roleId: "r4" }],
      ticketCategoryIds: ["tc6", "tc7"],
    },
  ];

  /** @type {TicketCategory[]} */
  const ticketCategories = [
    { id: "tc1", concertId: "c1", name: "VIP Pit", price: 169, inventory: 25 },
    { id: "tc2", concertId: "c1", name: "Floor GA", price: 95, inventory: 260 },
    { id: "tc3", concertId: "c1", name: "Balcony", price: 65, inventory: 180 },
    { id: "tc4", concertId: "c2", name: "Gold", price: 145, inventory: 120 },
    { id: "tc5", concertId: "c2", name: "Silver", price: 85, inventory: 350 },
    {
      id: "tc6",
      concertId: "c3",
      name: "Orchestra",
      price: 120,
      inventory: 200,
    },
    {
      id: "tc7",
      concertId: "c3",
      name: "Mezzanine",
      price: 75,
      inventory: 180,
    },
  ];

  return { genres, roles, artists, venues, groups, concerts, ticketCategories };
})();

// ---------- Helpers ----------
const money = (n) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
const shortDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

// ---------- App ----------
export default function App() {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("all");
  const [venue, setVenue] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cart, setCart] = useState([]); // {categoryId, qty}

  const byId = {
    artist: Object.fromEntries(seed.artists.map((a) => [a.id, a])),
    role: Object.fromEntries(seed.roles.map((r) => [r.id, r])),
    venue: Object.fromEntries(seed.venues.map((v) => [v.id, v])),
    group: Object.fromEntries(seed.groups.map((g) => [g.id, g])),
    ticketCategory: Object.fromEntries(
      seed.ticketCategories.map((t) => [t.id, t])
    ),
  };

  const concerts = useMemo(() => {
    return seed.concerts.filter((c) => {
      const text = (c.title + " " + byId.venue[c.venueId].name).toLowerCase();
      const textOk = text.includes(q.toLowerCase());
      const genreOk =
        genre === "all" ||
        c.lineup.some((li) =>
          seed.artists.find((a) => a.id === li.artistId)?.genres.includes(genre)
        );
      const venueOk = venue === "all" || c.venueId === venue;
      return textOk && genreOk && venueOk;
    });
  }, [q, genre, venue]);

  const cartTotal = cart.reduce(
    (sum, it) => sum + it.qty * byId.ticketCategory[it.categoryId].price,
    0
  );

  function addToCart(categoryId, qty = 1) {
    setCart((prev) => {
      const i = prev.findIndex((p) => p.categoryId === categoryId);
      const max = byId.ticketCategory[categoryId].inventory;
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(next[i].qty + qty, max) };
        return next;
      }
      return [...prev, { categoryId, qty }];
    });
    setCartOpen(true);
  }
  function updateQty(categoryId, qty) {
    setCart((prev) =>
      prev.map((it) => (it.categoryId === categoryId ? { ...it, qty } : it))
    );
  }
  function removeFromCart(categoryId) {
    setCart((prev) => prev.filter((it) => it.categoryId !== categoryId));
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl bg-black text-white grid place-content-center font-semibold">
              CT
            </div>
            <span className="font-semibold tracking-tight">
              Concert Tickets
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <input
              className="input w-64"
              placeholder="Search concerts, venues…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="select w-40"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="all">All genres</option>
              {seed.genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <select
              className="select w-48"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            >
              <option value="all">All venues</option>
              {seed.venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <button
              className="btn-primary"
              onClick={() => setCartOpen(true)}
              title="Open cart"
            >
              🛒 Open Cart · {money(cartTotal)}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 grid gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Upcoming Concerts
          </h1>
          <p className="text-sm text-slate-600">
            Browse by series, artists, or venue. Add ticket categories to your
            cart.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {concerts.map((c) => (
            <ConcertCard key={c.id} c={c} byId={byId} addToCart={addToCart} />
          ))}
        </div>

        <AdminBoards />
      </main>

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setCartOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-[420px] max-w-[90vw] bg-white border-l border-slate-200 p-5 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Cart</h3>
              <button className="btn-ghost" onClick={() => setCartOpen(false)}>
                ✕ Close
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              {cart.length === 0 && (
                <p className="text-sm text-slate-600">Cart is empty.</p>
              )}
              {cart.map((it) => {
                const cat = byId.ticketCategory[it.categoryId];
                const concert = seed.concerts.find(
                  (x) => x.id === cat.concertId
                );
                const v = byId.venue[concert.venueId];
                return (
                  <div key={it.categoryId} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{concert.title}</div>
                        <div className="text-sm text-slate-600">
                          📅 {shortDate(concert.date)} · 📍 {v.name}
                        </div>
                        <div className="mt-1 text-sm">
                          <span className="badge mr-2">{cat.name}</span>
                          {money(cat.price)} each
                        </div>
                      </div>
                      <button
                        className="btn-ghost"
                        onClick={() => removeFromCart(it.categoryId)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <label className="text-sm">Qty</label>
                      <input
                        type="number"
                        min={1}
                        max={cat.inventory}
                        value={it.qty}
                        onChange={(e) =>
                          updateQty(
                            it.categoryId,
                            Math.max(
                              1,
                              Math.min(cat.inventory, Number(e.target.value))
                            )
                          )
                        }
                        className="input w-24"
                      />
                      <div className="ml-auto font-medium">
                        {money(it.qty * cat.price)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="my-4 h-px bg-slate-200" />

            <button
              className="btn-primary w-full"
              disabled={cartTotal === 0}
              onClick={() => setCheckoutOpen(true)}
            >
              Checkout · {money(cartTotal)}
            </button>
          </div>
        </>
      )}

      {/* Simple Checkout Modal */}
      {checkoutOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setCheckoutOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 w-[520px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 card p-5">
            <h3 className="text-lg font-semibold">Checkout</h3>
            <div className="mt-3 grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm">Name</label>
                <input className="input" placeholder="Ada Lovelace" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm">Email</label>
                <input className="input" placeholder="ada@example.com" />
              </div>
              <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm flex items-center justify-between">
                <span>Total</span>
                <span className="font-semibold">{money(cartTotal)}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="btn-ghost"
                onClick={() => setCheckoutOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setCheckoutOpen(false);
                  setCartOpen(false);
                  setCart([]);
                }}
              >
                Place Order
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Subcomponents ----------
function ConcertCard({ c, byId, addToCart }) {
  const v = byId.venue[c.venueId];
  const group = c.groupId ? byId.group[c.groupId] : undefined;
  const categories = c.ticketCategoryIds.map((id) => byId.ticketCategory[id]);

  return (
    <div className="card">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <div className="text-lg">🎵</div>
          <h3 className="text-base font-semibold">{c.title}</h3>
        </div>
        <div className="mt-1 text-sm text-slate-600 flex flex-wrap gap-2">
          <span className="badge">{group?.name ?? "Standalone"}</span>
          <span>📅 {shortDate(c.date)}</span>
          <span>
            📍 {v.name} · {v.city}
          </span>
        </div>

        {/* Lineup */}
        <div className="mt-3 flex flex-wrap gap-2">
          {c.lineup.map((li, i) => {
            const a = seed.artists.find((x) => x.id === li.artistId);
            const r = seed.roles.find((x) => x.id === li.roleId);
            const strong = r.name === "Headliner";
            return (
              <span
                key={i}
                className={strong ? "badge-strong" : "badge"}
                title={r.name}
              >
                {a.name} {strong ? "· Headliner" : `· ${r.name}`}
              </span>
            );
          })}
        </div>

        {/* Ticket categories */}
        <div className="mt-4 grid gap-2">
          {categories.map((tc) => (
            <div
              key={tc.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-slate-200 p-3"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">🎟️ {tc.name}</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {tc.inventory} left
                </div>
              </div>
              <div className="font-medium">{money(tc.price)}</div>
              <button
                className="btn-primary"
                disabled={tc.inventory === 0}
                onClick={() => addToCart(tc.id)}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminBoards() {
  const [tab, setTab] = useState("orders");
  /** @type {Order[]} */
  const orders = [
    {
      id: "o1",
      customerId: "cu1",
      createdAt: new Date().toISOString(),
      total: 230,
      items: [{ categoryId: "tc2", qty: 2, unitPrice: 95 }],
    },
    {
      id: "o2",
      customerId: "cu2",
      createdAt: new Date().toISOString(),
      total: 120,
      items: [{ categoryId: "tc6", qty: 1, unitPrice: 120 }],
    },
  ];
  /** @type {Customer[]} */
  const customers = [
    { id: "cu1", name: "Ada Lovelace", email: "ada@example.com" },
    { id: "cu2", name: "Alan Turing", email: "alan@example.com" },
  ];

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Customers & Orders</h2>
        <div className="rounded-xl border border-slate-200 p-1 bg-white">
          <button
            className={`btn ${
              tab === "orders" ? "bg-black text-white" : "btn-ghost"
            }`}
            onClick={() => setTab("orders")}
          >
            Orders
          </button>
          <button
            className={`btn ${
              tab === "customers" ? "bg-black text-white" : "btn-ghost"
            }`}
            onClick={() => setTab("customers")}
          >
            Customers
          </button>
          <button
            className={`btn ${
              tab === "notes" ? "bg-black text-white" : "btn-ghost"
            }`}
            onClick={() => setTab("notes")}
          >
            Notes
          </button>
        </div>
      </div>

      {tab === "orders" && (
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Order {o.id}</div>
                <div className="font-semibold">{money(o.total)}</div>
              </div>
              <div className="text-sm text-slate-600">
                {shortDate(o.createdAt)}
              </div>
              <div className="mt-2 text-sm">
                {o.items.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1 text-slate-700"
                  >
                    <span>Category {it.categoryId}</span>
                    <span>×{it.qty}</span>
                    <span>{money(it.unitPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "customers" && (
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="text-base font-semibold">{c.name}</div>
              <div className="text-sm text-slate-600">{c.email}</div>
              <div className="mt-2 text-sm text-slate-700">
                👥 Customer since 2025
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "notes" && (
        <div className="mt-4 card p-4 text-sm">
          <div className="font-semibold mb-1">Design Notes</div>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>
              <b>Concert</b> cards pull Venue, Group, and the Artist/Role
              lineup.
            </li>
            <li>
              <b>Ticket Category</b> rows expose price + remaining inventory.
            </li>
            <li>
              Checkout simulates <b>Customer</b> + <b>Order</b> with line items
              (i.e., <b>Order_Ticket</b>).
            </li>
            <li>
              Extend with seat maps by materializing individual <b>Ticket</b>{" "}
              entities.
            </li>
          </ul>
        </div>
      )}
    </section>
  );
}
