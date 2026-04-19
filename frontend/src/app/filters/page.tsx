"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  createFilter,
  deleteFilter,
  getFilters,
  type FilterItem,
  withAuthenticatedSession,
} from "@/lib/api";

export default function FiltersPage() {
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFilters = async () => {
    await Promise.resolve();

    try {
      const response = await withAuthenticatedSession((token) =>
        getFilters(token),
      );
      setFilters(response.items);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to load filters",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFilters();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = event.currentTarget;

    const formData = new FormData(form);
    const payload = {
      location: String(formData.get("location") ?? "").trim() || undefined,
      propertyType:
        String(formData.get("propertyType") ?? "").trim() === ""
          ? undefined
          : (String(
              formData.get("propertyType"),
            ) as FilterItem["propertyType"]),
      priceMin:
        String(formData.get("priceMin") ?? "").trim() === ""
          ? undefined
          : Number(formData.get("priceMin")),
      priceMax:
        String(formData.get("priceMax") ?? "").trim() === ""
          ? undefined
          : Number(formData.get("priceMax")),
      bedroomsMin:
        String(formData.get("bedroomsMin") ?? "").trim() === ""
          ? undefined
          : Number(formData.get("bedroomsMin")),
      keywords:
        String(formData.get("keywords") ?? "")
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean) || undefined,
    };

    try {
      await withAuthenticatedSession((token) => createFilter(token, payload));
      setMessage("Filter saved successfully.");
      form.reset();
      await loadFilters();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save filter",
      );
    }
  };

  const onDelete = async (filterId: string) => {
    try {
      await withAuthenticatedSession((token) => deleteFilter(token, filterId));
      setMessage("Filter removed.");
      await loadFilters();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to remove filter",
      );
    }
  };

  return (
    <div className="stack-lg">
      <section className="hero compact">
        <p className="eyebrow">Filter settings</p>
        <h1>Search preferences</h1>
        <p>
          Adjust your criteria and keep alerts aligned with your target market.
        </p>
      </section>

      <section className="panel stack-md">
        {(message || error) && (
          <p className={error ? "notice error" : "notice success"}>
            {error || message}
          </p>
        )}

        <form className="grid two-col" onSubmit={onSubmit}>
          <label className="field">
            Location
            <input name="location" type="text" placeholder="Douglas" />
          </label>
          <label className="field">
            Property type
            <select name="propertyType" defaultValue="">
              <option value="">Any</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="bungalow">Bungalow</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="field">
            Min price
            <input name="priceMin" type="number" placeholder="100000" />
          </label>
          <label className="field">
            Max price
            <input name="priceMax" type="number" placeholder="300000" />
          </label>
          <label className="field">
            Min bedrooms
            <input name="bedroomsMin" type="number" placeholder="2" />
          </label>
          <label className="field">
            Keywords
            <input name="keywords" type="text" placeholder="garden, parking" />
          </label>
          <div>
            <button type="submit">Save filter</button>
          </div>
        </form>
      </section>

      <section className="panel stack-sm">
        <h2>Your filters</h2>
        {isLoading && <p className="notice">Loading filters...</p>}
        {!isLoading && filters.length === 0 && (
          <p className="muted">No filters created yet.</p>
        )}
        <ul className="list">
          {filters.map((filter) => (
            <li key={filter.id} className="saved-row">
              <div>
                <p className="saved-title">
                  {filter.location ?? "Any location"} ·{" "}
                  {filter.propertyType ?? "Any type"}
                </p>
                <p className="muted">
                  Price {filter.priceMin ?? 0} - {filter.priceMax ?? "any"} ·
                  Bedrooms min {filter.bedroomsMin ?? 0}
                </p>
              </div>
              <button type="button" onClick={() => void onDelete(filter.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
