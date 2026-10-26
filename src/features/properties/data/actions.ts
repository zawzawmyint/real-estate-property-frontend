"use server";

import * as mutations from "./mutations";
import { runPropertyMutation } from "./action-boundary";
import {
  createPropertySchema,
  patchPropertySchema,
  photoFileSchema,
  photoOrderSchema,
  propertyIdSchema,
} from "./action-input";
import type { CreateProperty, PatchProperty } from "./types";

export async function createProperty(input: CreateProperty) {
  return runPropertyMutation(
    (headers) =>
      mutations.createProperty(createPropertySchema.parse(input), headers),
    { create: true },
  );
}

export async function updateProperty(id: string, input: PatchProperty) {
  return runPropertyMutation((headers) =>
    mutations.updateProperty(
      propertyIdSchema.parse(id),
      patchPropertySchema.parse(input),
      headers,
    ),
  );
}

export async function deleteProperty(id: string) {
  return runPropertyMutation(
    (headers) => mutations.deleteProperty(propertyIdSchema.parse(id), headers),
    { adminOnly: true },
  );
}

export async function uploadPropertyPhoto(id: string, file: File) {
  return runPropertyMutation((headers) =>
    mutations.uploadPropertyPhoto(
      propertyIdSchema.parse(id),
      photoFileSchema.parse(file),
      headers,
    ),
  );
}

export async function reorderPropertyPhotos(id: string, photoIds: string[]) {
  return runPropertyMutation((headers) =>
    mutations.reorderPropertyPhotos(
      propertyIdSchema.parse(id),
      photoOrderSchema.parse(photoIds),
      headers,
    ),
  );
}

export async function removePropertyPhoto(id: string, photoId: string) {
  return runPropertyMutation((headers) =>
    mutations.removePropertyPhoto(
      propertyIdSchema.parse(id),
      propertyIdSchema.parse(photoId),
      headers,
    ),
  );
}
