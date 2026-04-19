"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  getSavedListings,
  removeSavedListing,
  saveListing,
  type SavedListingItem,
  withAuthenticatedSession,
} from "@/lib/api";

export default function SavedListingsPage() {
  const [items, setItems] = useState<SavedListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSaved = async () => {
    await Promise.resolve();

    try {
      const response = await withAuthenticatedSession((token) =>
        getSavedListings(token),
      );
      setItems(response.items);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to load saved listings",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSaved();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const propertyId = String(formData.get("propertyId") ?? "").trim();

    try {
      await withAuthenticatedSession((token) => saveListing(token, propertyId));
      setMessage("Listing saved.");
      event.currentTarget.reset();
      await loadSaved();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save listing",
      );
    }
  };

  const onRemove = async (propertyId: string) => {
    try {
      await withAuthenticatedSession((token) =>
        removeSavedListing(token, propertyId),
      );
      setMessage("Listing removed.");
      await loadSaved();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to remove listing",
      );
    }
  };

  return (
    <div className="stack-lg">
      <section className="hero compact">
        <p className="eyebrow">Saved listings</p>
        <h1>Bookmarks</h1>
        <p>
          Review saved properties and remove listings you no longer want to
          track.
        </p>
      </section>

      <section className="panel stack-sm">
        <form className="stack-sm" onSubmit={onSave}>
          {(message || error) && (
            <p className={error ? "notice error" : "notice success"}>
              {error || message}
            </p>
          )}
          <label className="field">
            Save by property ID
            <input
              name="propertyId"
              type="text"
              placeholder="6bf9032e-d7fb-405a-9df8-7281d5f6f3e6"
              required
            />
          </label>
          <button type="submit">Save listing</button>
        </form>

        <ul className="list">
          {isLoading && <li className="notice">Loading saved listings...</li>}
          {!isLoading && items.length === 0 && (
            <li className="muted">No saved listings yet.</li>
          )}
          {items.map((item) => (
            <li key={item.id} className="saved-row">
              <div>
                <p className="saved-title">{item.property.title}</p>
                <p className="muted">
                  {item.property.price ?? "n/a"} · status:{" "}
                  {item.property.status} ·{" "}
                  {item.property.location ?? "Unknown location"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void onRemove(item.propertyId)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
