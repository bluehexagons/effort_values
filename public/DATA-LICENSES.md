# Data licenses

## PokéAPI

Historical base stats and English species names in `public/data/gen1.json` and `gen2.json` are derived from PokéAPI CSV files at commit `168b1e89467054cda2e7df43ccebbb69b459497a`. The upstream license notice follows.

Copyright (c) © 2013–2023 Paul Hallett and PokéAPI contributors (https://github.com/PokeAPI/pokeapi#contributing). Pokémon and Pokémon character names are trademarks of Nintendo.

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

- Neither the name of PokéAPI nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Bulbapedia

Yield tables in `public/data/gen3.json` through `gen9.json` are derived from Bulbapedia table revisions pinned in `scripts/generate_data.py` and are shared under CC BY-NC-SA 2.5. Attribution and source links are in README.md.

## Pokémon sprites

`public/sprites/gen1.png` through `gen9.png` were generated from the default front sprites in [PokéAPI/sprites](https://github.com/PokeAPI/sprites) at commit `fb3512817b9c3f46952b3f89e82645e77bdcaf49`. See `scripts/generate_sprites.py` for the transformation. The upstream repository states that the images are owned by The Pokémon Company; some later pixel sprites were made by community artists credited in its [README](https://github.com/PokeAPI/sprites#credits). The repository's CC0 notice does not transfer third-party rights in the Pokémon images. These images are not licensed under this project's Apache license.
