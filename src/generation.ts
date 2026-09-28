import { type Generation } from "./types.ts";

const notes: Record<Generation, string> = {
  1: "Red/Blue/Yellow: defeated Pokémon award base stats as stat experience. One Special stat; 65,535 per stat. Multiple battlers split the gain.",
  2: "Gold/Silver/Crystal: base stats award stat experience. Special uses the defeated Pokémon’s Special Attack. Multiple battlers split the gain; 65,535 per stat.",
  3: "Ruby/Sapphire/Emerald and FireRed/LeafGreen: 510 total EVs, 255 per stat. Level 100 Pokémon cannot gain battle EVs.",
  4: "Diamond/Pearl/Platinum and HeartGold/SoulSilver: 510 total EVs, 255 per stat. Level 100 Pokémon cannot gain battle EVs.",
  5: "Black 2/White 2 yield table; some Black/White yields differ. 510 total EVs, 255 per stat.",
  6: "X/Y and Omega Ruby/Alpha Sapphire: 510 total EVs, 252 per stat.",
  7: "Sun/Moon and Ultra Sun/Ultra Moon. Let’s Go uses a different training system. 510 total EVs, 252 per stat.",
  8: "Sword/Shield and Brilliant Diamond/Shining Pearl use EVs; Legends: Arceus uses effort levels.",
  9: "Scarlet/Violet: 510 total EVs, 252 per stat.",
};

export const generationNote = (generation: Generation): string =>
  notes[generation] +
  " Species and forms are not filtered by game availability. Battle bonuses, items, and Pokérus are not included.";
