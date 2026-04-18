import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FilterNotFoundError,
  MinimumFiltersConstraintError,
} from "../src/modules/filters/filters.errors";

const envState = vi.hoisted(() => ({
  ENFORCE_MIN_ONE_FILTER: false,
}));

vi.mock("../src/config/env", () => {
  return {
    env: envState,
  };
});

import { FiltersService } from "../src/modules/filters/filters.service";

describe("FiltersService", () => {
  const createFilter = vi.fn();
  const listFiltersByUser = vi.fn();
  const updateFilterById = vi.fn();
  const deleteFilterById = vi.fn();
  const countFiltersByUser = vi.fn();
  const dispatchFilterCreated = vi.fn();

  const repository = {
    createFilter,
    listFiltersByUser,
    updateFilterById,
    deleteFilterById,
    countFiltersByUser,
  };

  const service = new FiltersService(repository as never, {
    dispatchPropertyCreated: vi.fn(),
    dispatchPropertyUpdated: vi.fn(),
    dispatchFilterCreated,
  });

  beforeEach(() => {
    createFilter.mockReset();
    listFiltersByUser.mockReset();
    updateFilterById.mockReset();
    deleteFilterById.mockReset();
    countFiltersByUser.mockReset();
    dispatchFilterCreated.mockReset();
    envState.ENFORCE_MIN_ONE_FILTER = false;
  });

  it("dispatches filter created trigger on create", async () => {
    createFilter.mockResolvedValue({ id: "filter-1" });

    const result = await service.createFilter("user-1", { location: "Douglas" });

    expect(result).toEqual({ id: "filter-1" });
    expect(dispatchFilterCreated).toHaveBeenCalledWith({
      filterId: "filter-1",
      userId: "user-1",
    });
  });

  it("updates existing filter", async () => {
    updateFilterById.mockResolvedValue({ id: "filter-1" });

    const result = await service.updateFilter("user-1", "filter-1", { location: "Douglas" });

    expect(result).toEqual({ id: "filter-1" });
  });

  it("throws when filter is not found on update", async () => {
    updateFilterById.mockResolvedValue(null);

    await expect(
      service.updateFilter("user-1", "filter-1", { location: "Douglas" }),
    ).rejects.toBeInstanceOf(FilterNotFoundError);
  });

  it("deletes existing filter", async () => {
    deleteFilterById.mockResolvedValue(true);

    await expect(service.deleteFilter("user-1", "filter-1")).resolves.toBeUndefined();
  });

  it("throws when filter is not found on delete", async () => {
    deleteFilterById.mockResolvedValue(false);

    await expect(service.deleteFilter("user-1", "filter-1")).rejects.toBeInstanceOf(
      FilterNotFoundError,
    );
  });

  it("enforces minimum filter constraint when enabled", async () => {
    envState.ENFORCE_MIN_ONE_FILTER = true;
    countFiltersByUser.mockResolvedValue(1);

    await expect(service.deleteFilter("user-1", "filter-1")).rejects.toBeInstanceOf(
      MinimumFiltersConstraintError,
    );
  });
});
