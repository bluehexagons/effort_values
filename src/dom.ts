export const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing #${id}`);
  return element as T;
};

export const setInput = (id: string, value: string | boolean): void => {
  const input = byId<HTMLInputElement>(id);
  if (typeof value === "boolean") input.checked = value;
  else input.value = value;
};
