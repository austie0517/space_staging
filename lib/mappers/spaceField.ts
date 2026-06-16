import type { SpaceField, SpaceFieldType } from "@/types";
import type { SpaceField as PrismaSpaceField } from "@prisma/client";

/** Map a Prisma `SpaceField` row to the UI `SpaceField` shape. */
export function toUISpaceField(f: PrismaSpaceField): SpaceField {
  return {
    id: f.id,
    spaceId: f.spaceId,
    key: f.fieldKey,
    label: f.fieldLabel,
    value: f.fieldValue ?? "",
    isPublic: f.isPublic,
    order: f.displayOrder,
    type: f.fieldType as SpaceFieldType,
    options: Array.isArray(f.options)
      ? (f.options as unknown[]).map(String)
      : undefined,
  };
}
