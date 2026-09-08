from pathlib import Path
s=Path('/Users/nick/Code/dungeon/hardware/collapse-timer/click-v2/build.py').read_text().split('frame=make_frame(')[0]
exec(compile(s,'build.py','exec'))
f=make_frame('debug',40,166)
bm=bmesh.new();bm.from_mesh(f.data)
for e in bm.edges:
    if not e.is_manifold:
        print('BAD',len(e.link_faces),[tuple(round(c,6) for c in v.co) for v in e.verts], [round(p.calc_area(),9) for p in e.link_faces])
print(analyze(f))
