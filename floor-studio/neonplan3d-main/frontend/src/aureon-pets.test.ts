import { test } from "node:test";
import assert from "node:assert/strict";
import { AUREON_DOG_BREEDS, AUREON_PET_FURS_OF, ORIGINAL_DOG_BREEDS } from "./aureon-pets.ts";
import { PET_FURS_OF } from "./model.ts";

test("AUREON pets keep every original breed and coat and add the Golden Retriever", () => {
  for (const b of ORIGINAL_DOG_BREEDS) assert.ok((AUREON_DOG_BREEDS as readonly string[]).includes(b), b);
  assert.ok(AUREON_DOG_BREEDS.includes("golden_retriever"));
  for (const k of ["cat", "dog", "rabbit"] as const) for (const f of PET_FURS_OF[k]) assert.ok(AUREON_PET_FURS_OF[k].includes(f), k + f);
  assert.equal(AUREON_PET_FURS_OF.dog[0], PET_FURS_OF.dog[0]);
  assert.ok(AUREON_PET_FURS_OF.dog.includes("red_golden") && AUREON_PET_FURS_OF.dog.includes("light_golden"));
});
