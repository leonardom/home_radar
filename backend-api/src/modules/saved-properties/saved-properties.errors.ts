export class SavedPropertyNotFoundError extends Error {
  constructor() {
    super("Saved property not found");
    this.name = "SavedPropertyNotFoundError";
  }
}

export class SavePropertyTargetNotFoundError extends Error {
  constructor() {
    super("Property not found");
    this.name = "SavePropertyTargetNotFoundError";
  }
}
