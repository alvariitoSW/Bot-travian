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
    'granja': R_ + 'farmstead.xml', 'foro': R_ + 'civic_centre.xml', 'almacen': R_ + 'market.xml',
    'cuartel': R_ + 'barracks.xml', 'establo': R_ + 'stable.xml', 'templo': R_ + 'temple_mars.xml',
    # decorado y defensas
    'casa': R_ + 'house.xml', 'arco': R_ + 'triumphal_arch.xml', 'vesta': R_ + 'temple_vesta.xml',
    'muro': R_ + 'wall_long.xml', 'torre': R_ + 'wall_tower.xml', 'puerta': R_ + 'wall_gate.xml',
    # árboles mediterráneos
    'cipres': 'flora/trees/mediterranean_cypress.xml', 'olivo': 'flora/trees/olive.xml',
    'pino': 'flora/trees/aleppo_pine.xml', 'algarrobo': 'flora/trees/carob.xml',
}
SKIP = ('decals', 'garrison', 'particle', 'smoke', 'fire', 'flag_', 'blood', 'props/units/')


def prune(n):
    n['props'] = [prune(p) for p in n['props'] if not any(s in p['actor'] for s in SKIP)]
    n['anims'] = {}
    return n


def main():
    art = sys.argv[1]
    manifest = {k: prune(R.resolve(art, v)) for k, v in STATIC.items()}
    if '--files' in sys.argv:
        acc = set()
        for n in manifest.values():
            R.files(n, acc)
        print('\n'.join(sorted(acc)))
    else:
        json.dump(manifest, sys.stdout, indent=1)


if __name__ == '__main__':
    main()
