import {
  spriteCellSize,
  spriteColumns,
  spriteSheets,
} from "./sprite-sheets.ts";

export const spriteForDex = (dex: string) => {
  const number = Number(dex);
  const sheet = spriteSheets.find(
    ({ start, end }) => number >= start && number <= end,
  );
  if (!sheet || !Number.isInteger(number)) return null;
  const index = number - sheet.start;
  const count = sheet.end - sheet.start + 1;
  return {
    url: `${import.meta.env.BASE_URL}sprites/gen${sheet.generation}.png`,
    width: Math.min(count, spriteColumns) * spriteCellSize,
    height: Math.ceil(count / spriteColumns) * spriteCellSize,
    x: (index % spriteColumns) * spriteCellSize,
    y: Math.floor(index / spriteColumns) * spriteCellSize,
  };
};
