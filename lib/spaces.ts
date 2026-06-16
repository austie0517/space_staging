/**
 * @deprecated Compatibility barrel. The `Space` type now lives in `@/types`,
 * the sample data in `@/mock`, and reads go through `@/services`. New code
 * should use `spaceService` from `@/services` directly.
 */
import { spaceService } from "@/services";

export type { Space } from "@/types";
export { SAMPLE_SPACES } from "@/mock";

/** @deprecated use `spaceService.list()` */
export const fetchSpaces = () => spaceService.list();

/** @deprecated use `spaceService.get(id)` */
export const fetchSpace = (id: string) => spaceService.get(id);
