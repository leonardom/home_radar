export class FilterNotFoundError extends Error {
  constructor() {
    super("Filter not found");
    this.name = "FilterNotFoundError";
  }
}

export class MinimumFiltersConstraintError extends Error {
  constructor() {
    super("At least one filter must be kept");
    this.name = "MinimumFiltersConstraintError";
  }
}
