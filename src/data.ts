import { type Pokemon, statKeys } from "./types.ts";

const asNumber = (value: string | undefined): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const displayName = (name: string): string =>
  name.includes("(")
    ? name.replace("(", " (").replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    : name;

export const parsePokemonXml = (source: string): Pokemon[] => {
  const document = new DOMParser().parseFromString(source, "application/xml");
  const parserError = document.querySelector("parsererror");
  if (parserError)
    throw new Error(
      `Invalid Pokémon data: ${parserError.textContent ?? "parse error"}`,
    );

  return [...document.querySelectorAll("pokemon")].flatMap((node) => {
    const name = node.querySelector("name")?.textContent?.trim();
    const fields = node.querySelector("evs")?.textContent?.trim().split("/");
    if (
      !name ||
      fields?.length !== 8 ||
      fields.some((field) => !/^\d+$/.test(field))
    )
      return [];

    const values = fields.map(asNumber);
    const dex = fields[7];
    if (!dex) return [];
    return [
      {
        name: displayName(name),
        dex,
        exp: values[0] ?? 0,
        evs: Object.fromEntries(
          statKeys.map((key, index) => [key, values[index + 1] ?? 0]),
        ) as Pokemon["evs"],
      },
    ];
  });
};

export const loadPokemon = async (): Promise<Pokemon[]> => {
  const response = await fetch(`${import.meta.env.BASE_URL}pokemon.xml`);
  if (!response.ok)
    throw new Error(`Could not load Pokémon data (${response.status})`);
  const pokemon = parsePokemonXml(await response.text());
  if (pokemon.length === 0) throw new Error("Pokémon data is empty");
  return pokemon;
};

export const primaryPokemon = (pokemon: readonly Pokemon[]): Pokemon[] =>
  pokemon.filter(({ name }) => !name.includes("("));

export const totalYield = ({ evs }: Pokemon): number =>
  statKeys.reduce((total, stat) => total + evs[stat], 0);

export const spriteUrl = ({ dex }: Pokemon): string =>
  `${import.meta.env.BASE_URL}img/${dex}MS.png`;
