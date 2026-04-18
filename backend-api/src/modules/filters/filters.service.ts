import { env } from "../../config/env";
import { FilterNotFoundError, MinimumFiltersConstraintError } from "./filters.errors";
import { FiltersRepository } from "./filters.repository";
import type { CreateFilterBody, UpdateFilterBody } from "./filters.schemas";
import type { SearchFilter } from "./filters.types";

export class FiltersService {
  constructor(private readonly filtersRepository: FiltersRepository) {}

  async createFilter(userId: string, payload: CreateFilterBody): Promise<SearchFilter> {
    return this.filtersRepository.createFilter(userId, payload);
  }

  async listFilters(userId: string): Promise<SearchFilter[]> {
    return this.filtersRepository.listFiltersByUser(userId);
  }

  async updateFilter(
    userId: string,
    filterId: string,
    payload: UpdateFilterBody,
  ): Promise<SearchFilter> {
    const filter = await this.filtersRepository.updateFilterById(userId, filterId, payload);

    if (!filter) {
      throw new FilterNotFoundError();
    }

    return filter;
  }

  async deleteFilter(userId: string, filterId: string): Promise<void> {
    if (env.ENFORCE_MIN_ONE_FILTER) {
      const count = await this.filtersRepository.countFiltersByUser(userId);
      if (count <= 1) {
        throw new MinimumFiltersConstraintError();
      }
    }

    const deleted = await this.filtersRepository.deleteFilterById(userId, filterId);

    if (!deleted) {
      throw new FilterNotFoundError();
    }
  }
}
