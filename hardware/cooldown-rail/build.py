"""Generate millimetre-scale printable parts with Blender's bundled Python.

Run: /Applications/Blender.app/Contents/MacOS/Blender -b --python build.py
No add-ons or Python packages required. Prototype: physical fit remains untested.
"""
import bpy, bmesh, math, json, struct, zipfile
from pathlib import Path
from mathutils import Vector, Matrix
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parent
LENGTH = 88.9
WIDTH = 20.0
PITCH = 5.1
FIRST = 16.0
HEIGHT = 5.2
PARTS = {}
REPORT = {}
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def mesh(name, verts, faces):
    m = bpy.data.meshes.new(name)
    m.from_pydata(verts, [], faces); m.update()
    ob = bpy.data.objects.new(name, m); bpy.context.collection.objects.link(ob)
    bm = bmesh.new(); bm.from_mesh(m)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces)); bm.to_mesh(m); bm.free()
    return ob

def box(name, x0, x1, y0, y1, z0, z1):
    return mesh(name, [(x,y,z) for z in (z0,z1) for y in (y0,y1) for x in (x0,x1)],
                [(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)])

def prism_xz(name, profile, y0, y1):
    n=len(profile)
    return mesh(name, [(x,y,z) for y in (y0,y1) for x,z in profile],
                [tuple(range(n-1,-1,-1)),tuple(range(n,2*n))] +
                [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)])

def cylinder(name,x,y,z0,z1,r):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=r, depth=z1-z0, location=(x,y,(z0+z1)/2))
    ob=bpy.context.object; ob.name=name
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    return ob

def boolean(a,b,op='UNION',remove=True):
    bpy.context.view_layer.objects.active=a
    mod=a.modifiers.new('solid','BOOLEAN'); mod.operation=op; mod.solver='EXACT'; mod.object=b
    bpy.ops.object.modifier_apply(modifier=mod.name)
    if remove: bpy.data.objects.remove(b,do_unlink=True)
    return a

def copy(ob,name):
    c=ob.copy(); c.data=ob.data.copy(); c.name=name; bpy.context.collection.objects.link(c); return c

def translate(ob,x=0,y=0,z=0):
    ob.data.transform(Matrix.Translation((x,y,z))); ob.data.update(); return ob

def engrave(ob,label,x,y,size=3.4):
    cv=bpy.data.curves.new('label','FONT'); cv.body=label; cv.size=size
    cv.align_x='CENTER'; cv.align_y='CENTER'; cv.extrude=.5; cv.resolution_u=4
    t=bpy.data.objects.new('label',cv); bpy.context.collection.objects.link(t)
    t.location=(x,y,HEIGHT-.45)
    bpy.ops.object.select_all(action='DESELECT'); t.select_set(True); bpy.context.view_layer.objects.active=t
    bpy.ops.object.convert(target='MESH'); bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    return boolean(ob,t,'DIFFERENCE')

def rail(name,length,count):
    ob=box(name,0,WIDTH,0,length,0,HEIGHT)
    # Rectangular lower race; two 45-degree upper retaining lips.
    channel=prism_xz('channel',[(7.2,1.2),(17.8,1.2),(17.8,3.2),(15.8,5.2),
                                  (15.8,7),(9.2,7),(9.2,5.2),(7.2,3.2)],-1,length-1.6)
    boolean(ob,channel,'DIFFERENCE')
    for i in range(count):
        y=FIRST+i*PITCH
        # Recess terminates below the retaining lip; slider flexes horizontally.
        boolean(ob,cylinder('detent',17.6,y,1.19,2.95,.95),'DIFFERENCE')
        engrave(ob,'R' if i==0 else str(i),3.5,y)
    return ob

def slider(name,soft=False):
    # Coordinates are in assembled position with the pointer at y=0.
    ob=prism_xz(name,[(7.55,1.5),(14.8,1.5),(14.8,2.9),(13.45,4.25),
                     (13.45,5.45),(9.55,5.45),(9.55,4.9),(7.55,2.9)],-12,6.5)
    # Long planar cantilever: 0.8 mm thick, 1.3 mm high, ~11 mm effective length.
    boolean(ob,box('anchor',13.0,17.6,-12,-10.4,1.5,2.8))
    beam_outer=17.6
    beam_inner=16.8
    boolean(ob,box('spring',beam_inner,beam_outer,-10.8,.6,1.5,2.8))
    boolean(ob,cylinder('pawl',17.55,0,1.5,2.8,.65 if not soft else .55))
    # A 45-degree underside carries the pointer above the number strip.
    boolean(ob,prism_xz('thumb',[(9.55,5.15),(13.45,5.15),(15.4,7.1),
                               (15.4,8.6),(6.2,8.6),(6.2,8.5)],-1.8,1.8))
    for yy in (-1.0,0,1.0):
        boolean(ob,box('grip',10.1,14.8,yy-.2,yy+.2,8.55,9.0))
    return ob

def stop():
    # Glue-in stop: no uncertain press-fit is needed for reliable retention.
    ob=box('end-stop',0,20,-1.2,0.05,0,5.2)
    boolean(ob,prism_xz('key',[(7.5,1.5),(17.5,1.5),(17.5,3.0),
                             (15.6,4.9),(9.4,4.9),(7.5,3.0)],-.1,3.0))
    return ob

def clip(name,gap,right=False):
    # Cross-section is constant along Y; export on the Y end for support-free slots.
    ob=box(name,-1.5,21.5,0,5,-1.4,-.2)
    for x0,x1 in ((-1.5,-.15),(20.15,21.5)):
        boolean(ob,box('wall',x0,x1,0,5,-1.3,6.6))
    boolean(ob,box('lip',-1.5,1.1,0,5,5.35,6.6))
    boolean(ob,box('lip',19.0,21.5,0,5,5.35,6.6))
    # Small rounded contact beads take up vertical play; broad C body can flex.
    bead=prism_xz('contact',[(.1,5.36),(.45,5.10),(.8,5.36)],0,5)
    boolean(ob,bead)
    # External card slot. Card rests at z=-.2. Flared mouth eases insertion.
    boolean(ob,box('card-base',-8.5,-1.4,0,5,-1.4,-.2))
    boolean(ob,prism_xz('card-jaw',[(-8.5,gap+.1),(-7.5,gap-.2),
                                   (-1.4,gap-.2),(-1.4,gap+1.0),(-8.5,gap+1.0)],0,5))
    # Rounded contact rib reduces the nominal slot gap by 0.30 mm, so the
    # outer jaw bends slightly to grip a card rather than merely surrounding it.
    rib=[(-6.2+.4*math.cos(a*math.tau/32),gap-.1+.4*math.sin(a*math.tau/32)) for a in range(32)]
    boolean(ob,prism_xz('card-contact',rib,0,5))
    if right:
        ob.data.transform(Matrix.Translation((20,0,0)) @ Matrix.Diagonal((-1,1,1,1)))
        bm=bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(ob.data); bm.free()
    return ob

def analyze(ob):
    bm=bmesh.new(); bm.from_mesh(ob.data)
    bad=sum(not e.is_manifold for e in bm.edges)
    vol=bm.calc_volume(signed=True)
    seen=set(); components=0
    for v in bm.verts:
        if v in seen: continue
        components+=1; stack=[v]; seen.add(v)
        while stack:
            u=stack.pop()
            for e in u.link_edges:
                nxt=e.other_vert(u)
                if nxt not in seen: seen.add(nxt); stack.append(nxt)
    bm.free()
    coords=[v.co for v in ob.data.vertices]
    dims=[max(v[i] for v in coords)-min(v[i] for v in coords) for i in range(3)]
    return dict(nonmanifold_edges=bad,connected_components=components,volume_mm3=round(vol,3),dimensions_mm=[round(d,3) for d in dims])

def export(ob,name,orient=None):
    c=copy(ob,name+' print')
    if orient=='clip': c.data.transform(Matrix.Rotation(math.pi/2,4,'X'))
    if orient=='stop': c.data.transform(Matrix.Rotation(math.pi/2,4,'X'))
    mins=[min(v.co[i] for v in c.data.vertices) for i in range(3)]
    translate(c,*[-v for v in mins])
    info=analyze(c); REPORT[name]=info
    assert info['nonmanifold_edges']==0 and info['connected_components']==1 and info['volume_mm3']>0,(name,info)
    c.data.calc_loop_triangles()
    with (OUT/'stl'/f'{name}.stl').open('wb') as f:
        f.write(b'DCC cooldown rail, mm; physical prototype'.ljust(80,b'\0'))
        f.write(struct.pack('<I',len(c.data.loop_triangles)))
        for t in c.data.loop_triangles:
            verts=[c.data.vertices[i].co for i in t.vertices]
            normal=(verts[1]-verts[0]).cross(verts[2]-verts[0]).normalized()
            f.write(struct.pack('<12fH',*normal,*verts[0],*verts[1],*verts[2],0))
    c.hide_render=True; c.hide_viewport=True
    PARTS[name]=c
    return c

full=rail('rail',LENGTH,13)
test=rail('test rail',FIRST+2*PITCH+9,3)
standard=slider('standard slider')
gentle=slider('gentle slider',True)
end=stop()
clip_plain=clip('bare card clip',.5)
clip_sleeve=clip('sleeved card clip',.85)
clip_right=clip('right bare card clip',.5,True)
clip_right_sleeve=clip('right sleeved card clip',.85,True)
export(full,'rail-89mm')
export(test,'test-rail-3-stops')
export(standard,'slider-standard')
export(gentle,'slider-gentle')
export(end,'end-stop','stop')
export(clip_plain,'clip-card-left-0.50mm','clip')
export(clip_sleeve,'clip-sleeve-left-0.85mm','clip')
export(clip_right,'clip-card-right-0.50mm','clip')
export(clip_right_sleeve,'clip-sleeve-right-0.85mm','clip')

# Measure actual solid intersections at every resting position.
clearance=[]
for i in range(13):
    c=copy(standard,'clearance'); translate(c,y=FIRST+i*PITCH)
    boolean(c,full,'INTERSECT',remove=False)
    clearance.append(analyze(c)['volume_mm3'] if len(c.data.vertices) else 0)
    bpy.data.objects.remove(c,do_unlink=True)
REPORT['resting_intersections_mm3']=clearance
assert max(clearance)<.001,clearance

# Check travel at 20 substeps per click, including the spring bent inward by
# 0.42 mm. A cubic cantilever shape approximates the displaced beam for a
# geometric envelope check only; it does not predict force or service life.
travel=[]
for step in range(21):
    c=copy(standard,'travel clearance')
    for v in c.data.vertices:
        if v.co.x >= 16.79:
            t=max(0,min(1,(v.co.y+10.4)/10.4))
            v.co.x-=.42*t*t*(3-t)/2
    translate(c,y=FIRST+step*PITCH/20)
    boolean(c,full,'INTERSECT',remove=False)
    travel.append(analyze(c)['volume_mm3'] if len(c.data.vertices) else 0)
    bpy.data.objects.remove(c,do_unlink=True)
REPORT['deflected_travel_intersections_mm3']=travel
assert max(travel)<.001,travel

# Check that the installed end stop cannot intersect a slider parked at READY.
c=copy(standard,'stop clearance'); translate(c,y=FIRST)
boolean(c,end,'INTERSECT',remove=False)
REPORT['ready_stop_intersection_mm3']=analyze(c)['volume_mm3'] if len(c.data.vertices) else 0
assert REPORT['ready_stop_intersection_mm3']<.001
bpy.data.objects.remove(c,do_unlink=True)

def make_3mf(filename,placements):
    resources=[]; build=[]
    for idx,(name,dx,dy) in enumerate(placements,1):
        ob=PARTS[name]; ob.data.calc_loop_triangles()
        vs=''.join(f'<vertex x="{v.co.x:.5f}" y="{v.co.y:.5f}" z="{v.co.z:.5f}"/>' for v in ob.data.vertices)
        ts=''.join(f'<triangle v1="{t.vertices[0]}" v2="{t.vertices[1]}" v3="{t.vertices[2]}"/>' for t in ob.data.loop_triangles)
        resources.append(f'<object id="{idx}" type="model" name="{escape(name)}"><mesh><vertices>{vs}</vertices><triangles>{ts}</triangles></mesh></object>')
        build.append(f'<item objectid="{idx}" transform="1 0 0 0 1 0 0 0 1 {dx} {dy} 0"/>')
    model='<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">Cooldown rail prototype</metadata><resources>'+''.join(resources)+'</resources><build>'+''.join(build)+'</build></model>'
    with zipfile.ZipFile(OUT/filename,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
        z.writestr('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
        z.writestr('3D/3dmodel.model',model)

make_3mf('01-test-fit.3mf',[('test-rail-3-stops',20,20),('slider-standard',48,20),('slider-gentle',65,20)])
make_3mf('02-full-tracker.3mf',[('rail-89mm',20,20),('slider-standard',48,20),('end-stop',65,20),('clip-card-left-0.50mm',48,50),('clip-card-left-0.50mm',48,64)])
(OUT/'validation'/'geometry.json').write_text(json.dumps(REPORT,indent=2)+'\n')

# Render the actual manufacturing meshes, arranged beside a poker-size card.
for ob in bpy.data.objects: ob.hide_render=True
def material(name,color,rough=.5):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Roughness'].default_value=rough
    return m
dark=material('charcoal plastic',(.09,.12,.15)); orange=material('orange plastic',(.96,.29,.07)); paper=material('card',(.81,.77,.65)); ground=material('table',(.16,.19,.22))
def show(ob,mat):
    ob.hide_render=False; ob.data.materials.clear(); ob.data.materials.append(mat)
show(full,dark); show(standard,orange); translate(standard,y=FIRST+4*PITCH)
show(end,dark)
show(clip_plain,dark); translate(clip_plain,y=6)
c2=copy(clip_plain,'second clip'); translate(c2,y=77); show(c2,dark)
card=box('poker card',-69.6,-6.1,0,88.9,-.18,.12); show(card,paper)
def label(s,x,y,size):
    cv=bpy.data.curves.new('card text','FONT'); cv.body=s; cv.size=size; cv.align_x='CENTER'; cv.align_y='CENTER'
    ob=bpy.data.objects.new('card text',cv); bpy.context.collection.objects.link(ob); ob.location=(x,y,.14); cv.materials.append(dark)
label('POKE',-38,68,6)
label('COOLDOWN 4',-38,51,3.2)
label('2.5 × 3.5 in',-38,29,3)
label('CARD SIZE',-38,23,2)
floor=box('surface',-300,300,-200,300,-3,-1.42); show(floor,ground)
bpy.ops.object.camera_add(location=(100,-100,220)); camera=bpy.context.object
target=Vector((-24,43,0)); camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'; camera.data.ortho_scale=155; bpy.context.scene.camera=camera
for location,power,size in [((-50,-20,150),160000,120),((80,100,100),90000,100)]:
    bpy.ops.object.light_add(type='AREA',location=location); light=bpy.context.object; light.data.energy=power; light.data.shape='DISK'; light.data.size=size
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=48
scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=.001
scene.unit_settings.length_unit='MILLIMETERS'
scene.world.color=(.3,.3,.3); scene.render.resolution_x=1400; scene.render.resolution_y=1400; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.filepath=str(OUT/'previews'/'assembled.png')
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cooldown-rail.blend'))
bpy.ops.render.render(write_still=True)
print('COMPLETE',json.dumps(REPORT))
