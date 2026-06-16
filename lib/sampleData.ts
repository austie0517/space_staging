/**
 * @deprecated Compatibility barrel. Mock data now lives in `@/mock` (split by
 * domain) and types in `@/types`. New code should import from `@/services`
 * (data access) or `@/types` (shapes). This re-export keeps existing screens
 * working during the gradual migration.
 */
export * from "@/mock";
export type * from "@/types";
