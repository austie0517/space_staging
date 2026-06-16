export type ResourceCategoryValue = "venue" | "parking" | "storage";
export type ResourceTypeValue =
  | "space"
  | "floor"
  | "room"
  | "seat"
  | "booth"
  | "parking"
  | "locker"
  | "shelf"
  | "zone";
export type CapacityUnitValue = "person" | "car" | "box";

export const RESOURCE_CATEGORIES: Array<{
  value: ResourceCategoryValue;
  label: string;
  icon: string;
  capacityUnit: CapacityUnitValue;
  resourceTypes: ResourceTypeValue[];
}> = [
  {
    value: "venue",
    label: "店舗・スペース",
    icon: "storefront",
    capacityUnit: "person",
    resourceTypes: ["space", "room", "seat", "booth", "floor"],
  },
  {
    value: "parking",
    label: "駐車場",
    icon: "local_parking",
    capacityUnit: "car",
    resourceTypes: ["parking"],
  },
  {
    value: "storage",
    label: "荷物置き場",
    icon: "inventory_2",
    capacityUnit: "box",
    resourceTypes: ["locker", "shelf", "zone"],
  },
] ;

export const RESOURCE_TYPES: Array<{
  value: ResourceTypeValue;
  label: string;
  icon: string;
}> = [
  { value: "space", label: "全体貸し", icon: "domain" },
  { value: "floor", label: "フロア", icon: "view_quilt" },
  { value: "room", label: "個室", icon: "meeting_room" },
  { value: "seat", label: "席・セット面", icon: "event_seat" },
  { value: "booth", label: "ブース", icon: "chair" },
  { value: "parking", label: "駐車スペース", icon: "local_parking" },
  { value: "locker", label: "ロッカー", icon: "lock" },
  { value: "shelf", label: "棚", icon: "shelves" },
  { value: "zone", label: "区画", icon: "crop_square" },
] ;

export const CAPACITY_UNITS: Array<{
  value: CapacityUnitValue;
  label: string;
}> = [
  { value: "person", label: "人" },
  { value: "car", label: "台" },
  { value: "box", label: "箱" },
] ;

export function resourceCategoryLabel(value: string) {
  return RESOURCE_CATEGORIES.find((category) => category.value === value)?.label ?? value;
}

export function resourceTypeLabel(value: string) {
  return RESOURCE_TYPES.find((type) => type.value === value)?.label ?? value;
}

export function capacityUnitLabel(value: string) {
  return CAPACITY_UNITS.find((unit) => unit.value === value)?.label ?? value;
}

export function defaultCapacityUnit(category: string) {
  return (
    RESOURCE_CATEGORIES.find((item) => item.value === category)?.capacityUnit ??
    "person"
  );
}
