import { describe, expect, it, vi } from "vitest";

import {
  SavePropertyTargetNotFoundError,
  SavedPropertyNotFoundError,
} from "../src/modules/saved-properties/saved-properties.errors";
import { SavedPropertiesService } from "../src/modules/saved-properties/saved-properties.service";

describe("SavedPropertiesService", () => {
  it("saves property when target exists", async () => {
    const repository = {
      propertyExists: vi.fn().mockResolvedValue(true),
      saveProperty: vi.fn().mockResolvedValue({
        item: {
          id: "2b8893e5-fd5a-4cbc-a4db-5f6de1d98a41",
          userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
          propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
          savedAt: new Date("2026-04-18T12:30:00.000Z"),
          property: {
            id: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
            source: "chrystals",
            externalListingId: "listing-123",
            title: "Modern apartment in Douglas",
            price: 250000,
            bedrooms: 2,
            bathrooms: 1,
            location: "Douglas",
            propertyType: "apartment",
            url: "https://example.com/listing-123",
            status: "active",
            lastSeenAt: new Date("2026-04-18T12:00:00.000Z"),
          },
        },
        created: true,
      }),
      listSavedByUser: vi.fn(),
      removeSavedByUserAndProperty: vi.fn(),
    };

    const service = new SavedPropertiesService(repository as never);

    const result = await service.saveProperty("01a4c5ea-7d51-4dc5-9ae2-7726a983eb30", {
      propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
    });

    expect(repository.propertyExists).toHaveBeenCalledWith("6bf9032e-d7fb-405a-9df8-7281d5f6f3e6");
    expect(repository.saveProperty).toHaveBeenCalledWith(
      "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
    );
    expect(result.created).toBe(true);
  });

  it("throws not found when target property does not exist", async () => {
    const repository = {
      propertyExists: vi.fn().mockResolvedValue(false),
      saveProperty: vi.fn(),
      listSavedByUser: vi.fn(),
      removeSavedByUserAndProperty: vi.fn(),
    };

    const service = new SavedPropertiesService(repository as never);

    await expect(
      service.saveProperty("01a4c5ea-7d51-4dc5-9ae2-7726a983eb30", {
        propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
      }),
    ).rejects.toBeInstanceOf(SavePropertyTargetNotFoundError);
  });

  it("lists saved properties by user", async () => {
    const repository = {
      propertyExists: vi.fn(),
      saveProperty: vi.fn(),
      listSavedByUser: vi.fn().mockResolvedValue([]),
      removeSavedByUserAndProperty: vi.fn(),
    };

    const service = new SavedPropertiesService(repository as never);

    const result = await service.listSavedProperties("01a4c5ea-7d51-4dc5-9ae2-7726a983eb30", {
      limit: 50,
      offset: 0,
      sortBy: "savedAt",
      sortOrder: "desc",
    });

    expect(repository.listSavedByUser).toHaveBeenCalledWith(
      "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      {
        limit: 50,
        offset: 0,
        sortBy: "savedAt",
        sortOrder: "desc",
      },
    );
    expect(result).toEqual([]);
  });

  it("removes saved property", async () => {
    const repository = {
      propertyExists: vi.fn(),
      saveProperty: vi.fn(),
      listSavedByUser: vi.fn(),
      removeSavedByUserAndProperty: vi.fn().mockResolvedValue(true),
    };

    const service = new SavedPropertiesService(repository as never);

    await service.removeSavedProperty(
      "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
    );

    expect(repository.removeSavedByUserAndProperty).toHaveBeenCalledWith(
      "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
    );
  });

  it("throws when removing unknown saved property", async () => {
    const repository = {
      propertyExists: vi.fn(),
      saveProperty: vi.fn(),
      listSavedByUser: vi.fn(),
      removeSavedByUserAndProperty: vi.fn().mockResolvedValue(false),
    };

    const service = new SavedPropertiesService(repository as never);

    await expect(
      service.removeSavedProperty(
        "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
      ),
    ).rejects.toBeInstanceOf(SavedPropertyNotFoundError);
  });
});
