#!/usr/bin/env python3
"""Resuelve actores de 0 A.D. (cuerpo + piezas + texturas + animaciones) a un manifiesto JSON.

Uso: python3 -I tools/resolve_units.py <ruta art de 0 A.D.> [--files]
Con --files imprime solo la lista de archivos necesarios (para el sparse-checkout).
El arte de 0 A.D. es de Wildfire Games, licencia CC BY-SA 3.0.
"""
import json
import os
import sys
import xml.etree.ElementTree as ET

# unidad del juego -> actor de 0 A.D. (jinete, montura)
UNITS = {
    'hastati': 'units/romans/infantry_swordsman_b.xml',
    'principes': 'units/romans/infantry_swordsman_a.xml',
    'triarii': 'units/romans/infantry_spearman_e.xml',
    'velites': 'units/romans/infantry_javelinist_b.xml',
    'vigiles': 'units/romans/infantry_javelinist_a.xml',
    'milicia': 'units/athenians/infantry_javelinist_b.xml',
    'hoplitas': 'units/athenians/infantry_spearman_a.xml',
    'falange': 'units/macedonians/infantry_pikeman_a.xml',
    'peltastas': 'units/macedonians/infantry_javelinist_a.xml',
    'honderos': 'units/iberians/infantry_slinger_a.xml',
    'libios': 'units/carthaginians/infantry_spearman_a.xml',
    'iberos': 'units/iberians/infantry_swordsman_a.xml',
    'galos': 'units/gauls/infantry_spearman_b.xml',
    'sagrada': 'units/carthaginians/infantry_spearman_e.xml',
    # civiles para las calles de la ciudad
    'ciudadana': 'units/romans/female_citizen.xml',
    'sacerdote': 'units/romans/healer.xml',
    # caballería y elefantes: el actor es la montura; el jinete cuelga de ella
    'equites': 'units/romans/cavalry_spearman_b_m.xml',
    'general': 'units/romans/hero_cavalry_swordsman_scipio_m.xml',
    'jinetes': 'units/carthaginians/cavalry_spearman_a_m.xml',
    'numidas': 'units/carthaginians/cavalry_javelinist_b_m.xml',
    'tesalios': 'units/macedonians/cavalry_spearman_a_m.xml',
    'elefantes': 'units/carthaginians/elephantry_c_m.xml',
}
ANIMS = {'idle': 1, 'walk': 1, 'run': 1, 'attack_melee': 2, 'attack_ranged': 1, 'death': 1}  # nombres en minúsculas


def load(art, rel, kind):
    path = os.path.join(art, kind, rel)
    if not os.path.exists(path):
        return None
    return ET.parse(path).getroot()


def variant_content(art, v, out, take_all, seen=None):
    """Mezcla en `out` el contenido de un <variant>, siguiendo los file= heredados."""
    seen = seen or set()
    f = v.get('file')
    if f and f not in seen:
        seen.add(f)
        base = load(art, f, 'variants')
        if base is not None:
            variant_content(art, base, out, take_all, seen)
    for a in v.findall('animations/animation'):
        nm = (a.get('name') or '').lower()
        out['anims'].setdefault(nm, [])
        fn = a.get('file')
        if fn and fn not in out['anims'][nm]:
            out['anims'][nm].append(fn)
    if not take_all:
        return
    m = v.find('mesh')
    if m is not None and m.text:
        out['mesh'] = m.text.strip()
    for t in v.findall('textures/texture'):
        if t.get('name') == 'baseTex':
            out['tex'] = t.get('file')
        elif t.get('name') in ('aoTex', 'normTex', 'specTex') and not (t.get('file') or '').startswith('default'):
            out[t.get('name')[:-3]] = t.get('file')   # ao, norm, spec (solo los usan los edificios)
    for p in v.findall('props/prop'):
        ap = p.get('attachpoint')
        if p.get('actor'):
            out['props'][ap] = p.get('actor')
        else:
            out['props'].pop(ap, None)


def resolve(art, rel, depth=0):
    root = load(art, rel, 'actors')
    out = {'actor': rel, 'mesh': None, 'tex': None, 'props': {}, 'anims': {}}
    if root is None:
        out['missing'] = True
        return out
    for g in root.findall('group'):
        vs = g.findall('variant')
        chosen = None
        for v in vs:  # la variante más frecuente (la primera en caso de empate)
            fr = float(v.get('frequency', '1') or 1)
            if fr > 0 and (chosen is None or fr > float(chosen.get('frequency', '1') or 1)):
                chosen = v
        for v in vs:
            variant_content(art, v, out, v is chosen)
    mat = root.find('material')
    out['material'] = mat.text.strip() if mat is not None and mat.text else ''
    props = []
    for ap, actor in out['props'].items():
        if depth > 3 or ap in ('projectile', 'loaded-projectile'):
            continue
        sub = resolve(art, actor, depth + 1)
        sub['attach'] = ap
        props.append(sub)
    out['props'] = props
    out['anims'] = {k: v[:ANIMS[k]] for k, v in out['anims'].items() if k in ANIMS and v}
    return out


def files(node, acc):
    if node.get('mesh'):
        acc.add('meshes/' + node['mesh'])
    if node.get('tex'):
        acc.add('textures/skins/' + node['tex'])
    if node.get('maps'):
        for k in ('ao', 'norm', 'spec'):
            if node.get(k):
                acc.add('textures/skins/' + node[k])
    for fs in node.get('anims', {}).values():
        for f in fs:
            acc.add('animation/' + f)
    for p in node.get('props', []):
        files(p, acc)


def main():
    art = sys.argv[1]
    manifest = {k: resolve(art, v) for k, v in UNITS.items()}
    if '--files' in sys.argv:
        acc = set()
        for n in manifest.values():
            files(n, acc)
        print('\n'.join(sorted(acc)))
    else:
        json.dump(manifest, sys.stdout, indent=1)


if __name__ == '__main__':
    main()
