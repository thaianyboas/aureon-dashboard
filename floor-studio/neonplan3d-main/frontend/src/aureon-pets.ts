// AUREON: pet choices beyond the original lists in model.ts (that file stays as audited): the Golden Retriever and
// its coats. The pets accept any breed and coat string, so plans stay compatible both ways.
import { DOG_BREEDS, PET_FURS_OF, type Pet } from "./model.ts";

/** Dog breeds, small to large, with the Golden Retriever after the Labrador. */
export const AUREON_DOG_BREEDS = ["dachshund", "pug", "terrier", "labrador", "golden_retriever", "shepherd"] as const;
/** Every original breed stays offered (checked in aureon-pets.test.ts). */
export const ORIGINAL_DOG_BREEDS: readonly string[] = DOG_BREEDS;
/** The coats of each kind (the first is the default), the Golden Retriever's shades added for dogs. */
export const AUREON_PET_FURS_OF: Record<Pet["kind"], readonly string[]> = {
  ...PET_FURS_OF,
  dog: [PET_FURS_OF.dog[0], "red_golden", "light_golden", ...PET_FURS_OF.dog.slice(1)],
};
