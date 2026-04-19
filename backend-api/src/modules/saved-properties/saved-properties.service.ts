import type { SavePropertyBody, SavedPropertyListQuery } from "./saved-properties.schemas";
import {
  SavePropertyTargetNotFoundError,
  SavedPropertyNotFoundError,
} from "./saved-properties.errors";
import { SavedPropertiesRepository } from "./saved-properties.repository";
import type { SavePropertyResult, SavedProperty } from "./saved-properties.types";

export class SavedPropertiesService {
  constructor(private readonly savedPropertiesRepository: SavedPropertiesRepository) {}

  async saveProperty(userId: string, payload: SavePropertyBody): Promise<SavePropertyResult> {
    const propertyExists = await this.savedPropertiesRepository.propertyExists(payload.propertyId);
    if (!propertyExists) {
      throw new SavePropertyTargetNotFoundError();
    }

    const result = await this.savedPropertiesRepository.saveProperty(userId, payload.propertyId);
    if (!result) {
      throw new SavePropertyTargetNotFoundError();
    }

    return result;
  }

  async listSavedProperties(
    userId: string,
    query: SavedPropertyListQuery,
  ): Promise<SavedProperty[]> {
    return this.savedPropertiesRepository.listSavedByUser(userId, query);
  }

  async removeSavedProperty(userId: string, propertyId: string): Promise<void> {
    const removed = await this.savedPropertiesRepository.removeSavedByUserAndProperty(
      userId,
      propertyId,
    );

    if (!removed) {
      throw new SavedPropertyNotFoundError();
    }
  }
}
