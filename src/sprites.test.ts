import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { spriteForDex } from "./sprites.ts";
import {
  spriteCellSize,
  spriteColumns,
  spriteSheets,
} from "./sprite-sheets.ts";

describe("sprite sheets", () => {
  it("covers each National Dex number once", () => {
    for (let number = 1; number <= 1025; number++) {
      const sprite = spriteForDex(String(number));
      expect(sprite).not.toBeNull();
      expect(sprite!.x).toBeGreaterThanOrEqual(0);
      expect(sprite!.y).toBeGreaterThanOrEqual(0);
      expect(sprite!.x + spriteCellSize).toBeLessThanOrEqual(sprite!.width);
      expect(sprite!.y + spriteCellSize).toBeLessThanOrEqual(sprite!.height);
    }
  });

  it("rejects malformed and out-of-range Dex numbers", () => {
    for (const dex of ["", "0", "1026", "1e2", "0x19", "25-form"])
      expect(spriteForDex(dex)).toBeNull();
  });

  it("matches the dimensions of every generated PNG", async () => {
    for (const sheet of spriteSheets) {
      const png = await readFile(
        new URL(
          `../public/sprites/gen${sheet.generation}.png`,
          import.meta.url,
        ),
      );
      expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      const count = sheet.end - sheet.start + 1;
      expect(png.readUInt32BE(16)).toBe(
        Math.min(count, spriteColumns) * spriteCellSize,
      );
      expect(png.readUInt32BE(20)).toBe(
        Math.ceil(count / spriteColumns) * spriteCellSize,
      );
    }
  });
});
