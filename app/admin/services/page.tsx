"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Service = {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  active: boolean;
  created_at: string;
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Add service
  const [showAddForm, setShowAddForm] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit service
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Activate / deactivate
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("services")
      .select("id, name, description, base_price, active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD SERVICES ERROR:", error);
      console.error("MESSAGE:", error.message);
      console.error("CODE:", error.code);
      console.error("DETAILS:", error.details);
      console.error("HINT:", error.hint);

      setError(`Unable to load services: ${error.message}`);
      setLoading(false);
      return;
    }

    setServices(data ?? []);
    setLoading(false);
  }

  async function addService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!serviceName.trim() || !servicePrice) {
      setMessage("Please enter service name and price.");
      return;
    }

    const price = Number(servicePrice);

    if (!Number.isFinite(price) || price <= 0) {
      setMessage("Price must be greater than 0.");
      return;
    }

    setAdding(true);
    setMessage("");

    const { error } = await supabase.from("services").insert({
      name: serviceName.trim(),
      description: serviceDescription.trim() || null,
      base_price: price,
      active: true,
    });

    if (error) {
      console.error("ADD SERVICE ERROR:", error);
      console.error("MESSAGE:", error.message);
      console.error("CODE:", error.code);
      console.error("DETAILS:", error.details);
      console.error("HINT:", error.hint);

      setMessage(`Could not add service: ${error.message}`);
      setAdding(false);
      return;
    }

    setServiceName("");
    setServiceDescription("");
    setServicePrice("");
    setShowAddForm(false);
    setMessage("Service added successfully.");

    await loadServices();

    setAdding(false);
  }

  function startEditing(service: Service) {
    setEditingService(service);
    setEditName(service.name);
    setEditDescription(service.description ?? "");
    setEditPrice(String(service.base_price));

    setShowAddForm(false);
    setMessage("");
  }

  function cancelEditing() {
    setEditingService(null);
    setEditName("");
    setEditDescription("");
    setEditPrice("");
  }

  async function updateService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingService) {
      return;
    }

    if (!editName.trim() || !editPrice) {
      setMessage("Please enter service name and price.");
      return;
    }

    const price = Number(editPrice);

    if (!Number.isFinite(price) || price <= 0) {
      setMessage("Price must be greater than 0.");
      return;
    }

    setSavingEdit(true);
    setMessage("");

    const { data, error } = await supabase
      .from("services")
      .update({
        name: editName.trim(),
        description: editDescription.trim() || null,
        base_price: price,
      })
      .eq("id", editingService.id)
      .select("id, name, description, base_price, active, created_at")
      .single();

    if (error) {
      console.error("UPDATE SERVICE ERROR:", error);
      console.error("MESSAGE:", error.message);
      console.error("CODE:", error.code);
      console.error("DETAILS:", error.details);
      console.error("HINT:", error.hint);

      setMessage(`Could not update service: ${error.message}`);
      setSavingEdit(false);
      return;
    }

    if (!data) {
      setMessage("Service update did not return an updated service.");
      setSavingEdit(false);
      return;
    }

    cancelEditing();
    setMessage("Service updated successfully.");

    await loadServices();

    setSavingEdit(false);
  }

  async function toggleService(service: Service) {
  setUpdatingServiceId(service.id);
  setMessage("");
  setError("");

  const newActiveStatus = !service.active;

  console.log("TOGGLE START");
  console.log("Service ID:", service.id);
  console.log("Current active:", service.active);
  console.log("New active:", newActiveStatus);

  const { data: beforeData, error: beforeError } = await supabase
    .from("services")
    .select("id, name, active")
    .eq("id", service.id)
    .single();

  console.log("BEFORE SELECT:", beforeData);
  console.log("BEFORE SELECT ERROR:", beforeError);

  if (beforeError) {
    console.error("Could not read service:", beforeError);
    setError(beforeError.message);
    setUpdatingServiceId(null);
    return;
  }

  const { data, error } = await supabase
    .from("services")
    .update({
      active: newActiveStatus,
    })
    .eq("id", service.id)
    .select("id, name, active")
    .single();

  console.log("UPDATE DATA:", data);
  console.log("UPDATE ERROR:", error);

  if (error) {
    console.error("UPDATE ERROR MESSAGE:", error.message);
    console.error("UPDATE ERROR CODE:", error.code);
    console.error("UPDATE ERROR DETAILS:", error.details);
    console.error("UPDATE ERROR HINT:", error.hint);

    setError(
      `Update failed: ${error.message} (Code: ${error.code})`
    );

    setUpdatingServiceId(null);
    return;
  }

  if (!data) {
    setError("Supabase did not return the updated service.");
    setUpdatingServiceId(null);
    return;
  }

  setServices((currentServices) =>
    currentServices.map((currentService) =>
      currentService.id === data.id
        ? {
            ...currentService,
            active: data.active,
          }
        : currentService
    )
  );

  console.log("TOGGLE SUCCESS:", data);

  setMessage(
    `${data.name} is now ${data.active ? "active" : "inactive"}.`
  );

  setUpdatingServiceId(null);
}
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Admin
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Services
            </h1>

            <p className="mt-2 text-slate-600">
              Manage services available on MyKarigar.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                if (showAddForm) {
                  setShowAddForm(false);
                } else {
                  setShowAddForm(true);
                  cancelEditing();
                }

                setMessage("");
              }}
              className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              {showAddForm ? "Cancel" : "+ Add Service"}
            </button>

            <button
              type="button"
              onClick={loadServices}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm font-medium text-slate-700">{message}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-slate-600">Loading services...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Add Service */}
        {showAddForm && !loading && !error && (
          <form
            onSubmit={addService}
            className="mt-8 rounded-xl border border-slate-200 bg-white p-6"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Add New Service
            </h2>

            <div className="mt-6 grid gap-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Service Name
                </label>

                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Plumber"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Describe the service"
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Starting Price
                </label>

                <input
                  type="number"
                  min="1"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  placeholder="199"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding ? "Adding Service..." : "Add Service"}
              </button>
            </div>
          </form>
        )}

        {/* Edit Service */}
        {editingService && !loading && !error && (
          <form
            onSubmit={updateService}
            className="mt-8 rounded-xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Service
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update {editingService.name}
                </p>
              </div>

              <button
                type="button"
                onClick={cancelEditing}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Service Name
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Starting Price
                </label>

                <input
                  type="number"
                  min="1"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingEdit}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingEdit ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* No Services */}
        {!loading && !error && services.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-slate-600">No services found.</p>
          </div>
        )}

        {/* Service Cards */}
        {!loading && !error && services.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    {service.name}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      service.active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {service.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {service.description || "No description available."}
                </p>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-sm text-slate-500">Starting price</p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    ₹{service.base_price}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => startEditing(service)}
                  className="mt-5 w-full rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit Service
                </button>

                <button
                  type="button"
                  onClick={() => toggleService(service)}
                  disabled={updatingServiceId === service.id}
                  className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingServiceId === service.id
                    ? "Updating..."
                    : service.active
                      ? "Deactivate Service"
                      : "Activate Service"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}