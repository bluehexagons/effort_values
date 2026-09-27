"""Regenerate pinned generation yield tables; run with python3 scripts/generate_data.py.

Bulbapedia tables: CC BY-NC-SA 2.5. PokéAPI CSV: BSD 3-Clause.
"""
import csv
import io
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WIKI = {3: 4081751, 4: 4081750, 5: 4320818, 6: 4320818, 7: 4320879, 8: 4324514, 9: 4575864}
LIMIT = {3: 386, 4: 493, 5: 649, 6: 721, 7: 807, 8: 898, 9: 1025}
POKEAPI_REV = '168b1e89467054cda2e7df43ccebbb69b459497a'
HEADERS = {'User-Agent': 'EffortValuesPlanner/1.0 (historical data regeneration)'}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30).read().decode()


def csv_rows(filename):
    url = f'https://raw.githubusercontent.com/PokeAPI/pokeapi/{POKEAPI_REV}/data/v2/csv/{filename}'
    return list(csv.DictReader(io.StringIO(get(url))))


def templates(source):
    token = '{{lop/ev|'
    offset = 0
    while (start := source.find(token, offset)) >= 0:
        depth = 1
        index = start + 2
        while depth and index < len(source):
            if source.startswith('{{', index):
                depth += 1
                index += 2
            elif source.startswith('}}', index):
                depth -= 1
                index += 2
            else:
                index += 1
        if depth:
            raise ValueError('Unclosed wiki template')
        yield source[start + len(token):index - 2]
        offset = index


def fields(template):
    result = []
    depth = 0
    start = 0
    index = 0
    while index < len(template):
        if template.startswith('{{', index):
            depth += 1
            index += 2
        elif template.startswith('}}', index):
            depth -= 1
            index += 2
        elif template[index] == '|' and depth == 0:
            result.append(template[start:index])
            start = index + 1
            index += 1
        else:
            index += 1
    result.append(template[start:])
    return result


def write(generation, rows):
    path = ROOT / 'public' / 'data' / f'gen{generation}.json'
    path.write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'Generation {generation}: {len(rows)} Pokémon')


names = {int(row['pokemon_species_id']): row['name'] for row in csv_rows('pokemon_species_names.csv') if row['local_language_id'] == '9'}
current = {(int(row['pokemon_id']), int(row['stat_id'])): int(row['base_stat']) for row in csv_rows('pokemon_stats.csv') if int(row['pokemon_id']) <= 251}
past = {}
for row in csv_rows('pokemon_stats_past.csv'):
    pokemon_id = int(row['pokemon_id'])
    if pokemon_id <= 251:
        past.setdefault((pokemon_id, int(row['stat_id'])), []).append((int(row['generation_id']), int(row['base_stat'])))


def base_stat(pokemon_id, stat_id, generation):
    historical = sorted((gen, value) for gen, value in past.get((pokemon_id, stat_id), []) if gen >= generation)
    if historical:
        return historical[0][1]
    return current[(pokemon_id, stat_id)]

for generation, maximum in [(1, 151), (2, 251)]:
    rows = []
    for dex in range(1, maximum + 1):
        # Gen I has one Special stat. Gen II awards Special stat experience
        # from the defeated species' Special Attack base stat.
        special_id = 9 if generation == 1 else 4
        yields = [base_stat(dex, stat, generation) for stat in (1, 2, 3, special_id, 6)]
        rows.append({'id': f'{dex:03}', 'dex': f'{dex:03}', 'name': names[dex], 'yields': yields})
    write(generation, rows)

for generation, revision in WIKI.items():
    source = json.loads(get(f'https://bulbapedia.bulbagarden.net/w/api.php?action=parse&oldid={revision}&prop=wikitext&format=json'))['parse']['wikitext']['*']
    rows = []
    seen = set()
    for template in templates(source):
        parts = fields(template)
        parameters = [part for part in parts if '=' in part and not part.startswith('{{')]
        game = next((part[5:] for part in parameters if part.startswith('game=')), '')
        if game == 'PE':
            continue
        positional = [part for part in parts if not re.match(r'^[a-zA-Z_]+=.*', part)]
        if len(positional) < 9 or not positional[0].isdigit():
            continue
        dex = int(positional[0])
        if dex > LIMIT[generation]:
            continue
        name = positional[1]
        yields = positional[3:9]
        if not all(value.isdigit() for value in yields):
            raise ValueError((generation, dex, yields))
        form = next((part[5:] for part in parameters if part.startswith('form=')), '')
        if generation == 8 and 'Hisuian' in (positional[9] if len(positional) > 9 else ''):
            continue  # Legends: Arceus uses effort levels, not normal EVs.
        if form:
            # Keep distinct battle yields only. Alternative forms with identical
            # yields are represented by the species row.
            base = next((row for row in rows if row['dex'] == f'{dex:03}'), None)
            if base and base['yields'] == list(map(int, yields)):
                continue
            label = positional[9] if len(positional) > 9 else form
            name = f'{name} ({label})'
            slug = re.sub('[^a-z0-9]+', '-', form.lower()).strip('-')
            identifier = f'{dex:03}-{slug}' if f'{dex:03}' in seen else f'{dex:03}'
        else:
            identifier = f'{dex:03}'
        if identifier in seen:
            continue
        seen.add(identifier)
        rows.append({'id': identifier, 'dex': f'{dex:03}', 'name': name, 'yields': list(map(int, yields))})
    base = {row['dex'] for row in rows if row['id'] == row['dex']}
    expected = {f'{dex:03}' for dex in range(1, LIMIT[generation] + 1)}
    if base != expected:
        raise ValueError(f'Generation {generation}: missing base entries {sorted(expected - base)[:20]}')
    write(generation, rows)
