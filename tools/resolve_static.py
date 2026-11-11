#!/usr/bin/env python3
"""Resuelve actores estáticos de 0 A.D. (edificios, murallas, árboles) a un manifiesto JSON.

Uso: python3 -I tools/resolve_static.py <ruta art de 0 A.D.> [--files]
El arte de 0 A.D. es de Wildfire Games, licencia CC BY-SA 3.0.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import resolve_units as R  # noqa: E402

R_ = 'structures/romans/'
STATIC = {
    # edificios de la ciudad (clave del juego -> actor)
    'aserradero': R_ + 'storehouse.xml', 'cantera': R_ + 'workshop.xml', 'mina': R_ + 'blacksmith.xml',
    'granja': R_ + 'farmstead.xml', 'foro': R_ + 'civic_centre.xml', 'almacen': R_ + 'corral.xml',
    'mercado': R_ + 'market.xml', 'puerto': R_ + 'dock.xml',
    'barco': R_ + 'merchantman.xml', 'trirreme': R_ + 'trireme.xml',
    'cuartel': R_ + 'barracks.xml', 'establo': R_ + 'stable.xml', 'templo': R_ + 'temple_mars.xml',
    # decorado y defensas
    'casa': R_ + 'house.xml', 'arco': R_ + 'triumphal_arch.xml', 'vesta': R_ + 'temple_vesta.xml',
    'muro': R_ + 'wall_long.xml', 'torre': R_ + 'wall_tower.xml', 'puerta': R_ + 'wall_gate.xml',
    # piezas por cultura (cartagineses, griegos, galos, íberos): centro de ciudad en el mapa y barcos
    'cart_templo': 'structures/carthaginians/temple_big.xml', 'cart_trirreme': 'structures/carthaginians/trireme.xml',
    'grie_templo': 'structures/hellenes/shrine_01.xml', 'grie_trirreme': 'structures/hellenes/trireme.xml',
    'galo_centro': 'structures/gauls/civic_centre.xml', 'iber_centro': 'structures/iberians/temple.xml',
    # anfiteatro (Pompeya, hacia 70 a.C.): lo aligera tools/aligerar_static.mjs; termas y acueducto son propios (tools/propio_static.mjs)
    'anfiteatro': R_ + 'amphitheater_pompeii.xml',
    # árboles mediterráneos
    'cipres': 'flora/trees/mediterranean_cypress.xml', 'olivo': 'flora/trees/olive.xml',
    'pino': 'flora/trees/aleppo_pine.xml', 'algarrobo': 'flora/trees/carob.xml',
}
# texturas sueltas: terreno mediterráneo y normales de agua (nombre en el juego -> archivo de 0 A.D.)
T_ = 'textures/terrain/types/aegean_anatolia/'
EXTRA = {
    'terr_grass': T_ + 'grass_01.png', 'terr_dry': T_ + 'grass_dirt_01.png', 'terr_dirt': T_ + 'dirt_01.png',
    'terr_paving': T_ + 'paving_01.png', 'terr_sand': T_ + 'sand_01.png', 'terr_farm': T_ + 'farmland_01.png',
    'terr_paving_norm': T_ + 'paving_01_norm.png', 'terr_dirt_norm': T_ + 'dirt_01_norm.png',
    'water_norm': 'textures/animated/water/lake/normal0001.png', 'water_norm2': 'textures/animated/water/lake/normal0011.png',
}
SKIP = ('decals', 'garrison', 'particle', 'smoke', 'fire', 'flag_', 'blood', 'props/units/')


def prune(n):
    n['props'] = [prune(p) for p in n['props'] if not any(s in p['actor'] for s in SKIP)]
    n['anims'] = {}
    n['maps'] = True
    return n


def main():
    art = sys.argv[1]
    manifest = {k: prune(R.resolve(art, v)) for k, v in STATIC.items()}
    if '--files' in sys.argv:
        acc = set()
        for n in manifest.values():
            R.files(n, acc)
        acc.update(EXTRA.values())
        print('\n'.join(sorted(acc)))
    else:
        manifest['__extra'] = EXTRA
        json.dump(manifest, sys.stdout, indent=1)


if __name__ == '__main__':
    main()
