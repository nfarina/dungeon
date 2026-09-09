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
FIRST = 19.0
HEIGHT = 5.2
PARTS = {}
REPORT = {}
for folder in ("stl", "previews", "validation", "models"): (OUT/folder).mkdir(exist_ok=True)
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
    mod=a.modifiers.new('solid','BOOLEAN'); mod.operation=op; mod.solver='MANIFOLD'; mod.object=b
    modifier_name=mod.name
    bpy.ops.object.modifier_apply(modifier=modifier_name)
    assert modifier_name not in a.modifiers, (a.name,b.name,op)
    if remove: bpy.data.objects.remove(b,do_unlink=True)
    return a

def copy(ob,name):
    c=ob.copy(); c.data=ob.data.copy(); c.name=name; bpy.context.collection.objects.link(c); return c

def translate(ob,x=0,y=0,z=0):
    ob.data.transform(Matrix.Translation((x,y,z))); ob.data.update(); return ob

def lettering(label,x,y):
    cv=bpy.data.curves.new('raised numeral','FONT'); cv.body=label
    cv.font=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial Bold.ttf')
    cv.size=5.2; cv.offset=0; cv.align_x='CENTER'; cv.align_y='CENTER'
    cv.extrude=.30; cv.resolution_u=5
    ob=bpy.data.objects.new('raised '+label,cv); bpy.context.collection.objects.link(ob)
    ob.location=(x,y,HEIGHT+.30)
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active=ob
    bpy.ops.object.convert(target='MESH'); bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bm=bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
    bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=.000001)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(ob.data); bm.free()
    # Normalize exact thickness: Blender font extrusion extends both ways.
    zs=[v.co.z for v in ob.data.vertices]; lo=min(zs); hi=max(zs)
    for v in ob.data.vertices: v.co.z=HEIGHT+.6*(v.co.z-lo)/(hi-lo)
    xs=[v.co.x for v in ob.data.vertices]; ys=[v.co.y for v in ob.data.vertices]
    cx=(min(xs)+max(xs))/2; cy=(min(ys)+max(ys))/2
    scale=3.8/(max(ys)-min(ys))
    for v in ob.data.vertices:
        v.co.x=x+(v.co.x-cx)*scale
        v.co.y=y+(v.co.y-cy)*scale
    assert min(v.co.x for v in ob.data.vertices)>.35
    assert max(v.co.x for v in ob.data.vertices)<6.8
    return ob

def rail(name,length,labels):
    ob=box(name,0,WIDTH,0,length,0,HEIGHT)
    channel=prism_xz('channel',[(7.2,1.2),(17.8,1.2),(17.8,3.2),
        (15.8,5.2),(15.8,7),(9.2,7),(9.2,5.2),(7.2,3.2)],-1,length-1.6)
    boolean(ob,channel,'DIFFERENCE')
    letters=None
    for i,label in enumerate(labels):
        y=FIRST+i*PITCH
        boolean(ob,cylinder('detent pocket',17.8,y,1.19,3.15,1.25),'DIFFERENCE')
        # Leave space for the optional card collars to pass the widest labels.
        t=lettering(label,4.0,y)
        if letters is None: letters=t
        else: boolean(letters,t)
    return ob,letters

GUIDE=[(7.38,1.4),(17.62,1.4),(17.62,3.2),(15.62,5.2),
       (15.62,5.45),(9.38,5.45),(9.38,5.2),(7.38,3.2)]
def slider(name,firmer=False):
    ob=prism_xz(name,[(7.5,1.4),(14.6,1.4),(14.6,2.9),(13.45,4.25),
        (13.45,5.45),(9.5,5.45),(9.5,4.9),(7.5,2.9)],-16.5,6)
    # Full-width rigid bearings both before and after the free spring constrain
    # lateral motion to +/-0.18 mm. Raised bevels also reduce vertical play.
    boolean(ob,prism_xz('rear bearing',GUIDE,-16.5,-13.5))
    boolean(ob,prism_xz('front bearing',GUIDE,3.0,6))
    width=1.40 if firmer else 1.30
    boolean(ob,box('free spring',17.45-width,17.45,-13.9,.45,1.4,2.8))
    # A toe slightly larger than the pocket remains loaded against its two
    # shoulders at rest, instead of sitting freely inside the recess.
    boolean(ob,cylinder('rounded pawl',17.55,0,1.4,2.8,1.40))
    # Rounded root reinforcement at the transition from bearing to beam.
    boolean(ob,cylinder('spring root',17.45-width+.2,-13.5,1.4,2.8,.45))
    boolean(ob,prism_xz('thumb',[(9.65,5.15),(14.8,5.15),(15.4,5.75),
        (15.4,9.0),(6.2,9.0),(6.2,8.95),(9.65,5.5)],-1.8,1.8))
    # One rib = A / firm; two ribs = B / firmer. Guide fit is identical.
    for yy in ((0,) if not firmer else (-.65,.65)):
        boolean(ob,box('grip',9.7,14.6,yy-.25,yy+.25,8.9,9.4))
    return ob

def stop():
    ob=box('end cap',0,20,-1.6,.05,0,HEIGHT)
    # A short tapered press-fit key: easy-entry tip, then 0.08 mm interference
    # per side at the shoulder. User tested this cap: glue is needed to retain it.
    profiles=[(0,[(7.12,1.4),(17.88,1.4),(17.88,3.05),(15.93,5.0),(9.07,5.0),(7.12,3.05)]),
              (2.0,[(7.55,1.4),(17.45,1.4),(17.45,2.85),(15.45,4.85),(9.55,4.85),(7.55,2.85)])]
    n=6; verts=[(x,y,z) for y,profile in profiles for x,z in profile]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    boolean(ob,mesh('tapered key',verts,faces))
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

def export(ob,name,orient=None,keep_origin=False):
    c=copy(ob,name+' print')
    if orient=='clip': c.data.transform(Matrix.Rotation(math.pi/2,4,'X'))
    if orient=='stop': c.data.transform(Matrix.Rotation(math.pi/2,4,'X'))
    mins=[min(v.co[i] for v in c.data.vertices) for i in range(3)]
    if not keep_origin: translate(c,*[-v for v in mins])
    info=analyze(c); REPORT[name]=info
    assert info['nonmanifold_edges']==0 and info['volume_mm3']>0,(name,info)
    if 'numerals' not in name: assert info['connected_components']==1,(name,info)
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

full,full_letters=rail('rail',LENGTH,['R']+[str(i) for i in range(1,13)])
test,test_letters=rail('test rail',FIRST+4*PITCH+9,['R','1','2','10','12'])
standard=slider('A firm slider')
gentle=slider('B firmer slider',True)
end=stop()
clip_plain=clip('bare card clip',.5)
clip_sleeve=clip('sleeved card clip',.85)
clip_right=clip('right bare card clip',.5,True)
clip_right_sleeve=clip('right sleeved card clip',.85,True)
export(full,'rail-body')
export(full_letters,'rail-numerals',keep_origin=True)
export(test,'test-rail-body')
export(test_letters,'test-rail-numerals',keep_origin=True)
for body,letters,name in ((full,full_letters,'rail-one-color'),(test,test_letters,'test-rail-one-color')):
    merged=copy(body,name); boolean(merged,letters,remove=False)
    export(merged,name); bpy.data.objects.remove(merged,do_unlink=True)
export(standard,'slider-A-firm')
export(gentle,'slider-B-firmer')
export(end,'end-cap','stop')
export(clip_plain,'clip-card-left-0.50mm','clip')
export(clip_sleeve,'clip-sleeve-left-0.85mm','clip')
export(clip_right,'clip-card-right-0.50mm','clip')
export(clip_right_sleeve,'clip-sleeve-right-0.85mm','clip')

def intersection(a,b):
    c=copy(a,'intersection check'); boolean(c,b,'INTERSECT',remove=False)
    vol=analyze(c)['volume_mm3'] if len(c.data.vertices) else 0
    bpy.data.objects.remove(c,do_unlink=True); return vol

def flex(ob,deflection):
    for v in ob.data.vertices:
        if v.co.x>15.0 and -13.5<v.co.y<2:
            t=max(0,min(1,(v.co.y+13.5)/13.5))
            v.co.x-=deflection*t*t*(3-t)/2
    return ob

# First establish the elastic displacement needed to fit each lateral pose.
# An unflexed toe must overlap the pocket shoulders: that is intentional preload.
preloads={}; raw=[]
for x in (-.179,0,.179):
    c=copy(standard,'raw rest'); translate(c,x=x,y=FIRST)
    raw.append(intersection(c,full)); bpy.data.objects.remove(c,do_unlink=True)
    low=0;high=1.5
    for iteration in range(12):
        d=(low+high)/2
        c=copy(standard,'preload search'); flex(c,d); translate(c,x=x,y=FIRST)
        v=intersection(c,full); bpy.data.objects.remove(c,do_unlink=True)
        if v>0: low=d
        else: high=d
    preloads[x]=high+.015
assert min(raw)>0,raw
assert .15<min(preloads.values())<max(preloads.values())<.75,preloads
REPORT['spring_preload']={'unflexed_rest_intersections_mm3':raw,'displacements_mm':preloads}

rests=[]
for original in (standard,gentle):
    for i in range(13):
        for x,d in preloads.items():
            for z in (-.199,0):
                c=copy(original,'loaded rest'); flex(c,d)
                translate(c,x=x,y=FIRST+i*PITCH,z=z)
                rests.append(intersection(c,full))
                assert intersection(c,full_letters)==0
                bpy.data.objects.remove(c,do_unlink=True)
assert max(rests)<.001,max(rests)
REPORT['rest_checks']={'poses':len(rests),'max_intersection_mm3':max(rests)}

crests=[];travel=[]
for original in (standard,gentle):
    for x in preloads:
        c=copy(original,'unflexed crest'); translate(c,x=x,y=FIRST+PITCH/2)
        crests.append(intersection(c,full)); bpy.data.objects.remove(c,do_unlink=True)
        # Conservative full retraction over the complete interval; validates the
        # motion envelope, not spring stress, restoring force or wear resistance.
        d=1.18+x
        for z in (-.199,0):
            for step in range(21):
                c=copy(original,'flexed travel'); flex(c,d)
                translate(c,x=x,y=FIRST+step*PITCH/20,z=z)
                travel.append(intersection(c,full)); bpy.data.objects.remove(c,do_unlink=True)
assert min(crests)>.01,crests
assert max(travel)<.001,max(travel)
REPORT['unflexed_crest_intersections_mm3']=crests
REPORT['deflected_travel']={'poses':len(travel),'max_intersection_mm3':max(travel)}
REPORT['bearing_total_lateral_clearance_mm']=.36
REPORT['spring_widths_mm']={'A_one_rib':1.30,'B_two_ribs':1.40}
REPORT['rail_and_lettering_unchanged_from']='v2'

c=copy(standard,'ready cap clearance'); translate(c,y=FIRST)
REPORT['ready_cap_intersection_mm3']=intersection(c,end)
assert REPORT['ready_cap_intersection_mm3']==0
bpy.data.objects.remove(c,do_unlink=True)
REPORT['cap_press_interference_mm3']=intersection(end,full)
assert REPORT['cap_press_interference_mm3']>0

def make_3mf(filename,placements):
    resources=[]; build=[]; next_id=1
    for names,dx,dy in placements:
        children=[]
        for name in names:
            idx=next_id; next_id+=1; children.append(idx)
            ob=PARTS[name]; ob.data.calc_loop_triangles()
            vs=''.join(f'<vertex x="{v.co.x:.5f}" y="{v.co.y:.5f}" z="{v.co.z:.5f}"/>' for v in ob.data.vertices)
            ts=''.join(f'<triangle v1="{t.vertices[0]}" v2="{t.vertices[1]}" v3="{t.vertices[2]}"/>' for t in ob.data.loop_triangles)
            resources.append(f'<object id="{idx}" type="model" name="{escape(name)}"><mesh><vertices>{vs}</vertices><triangles>{ts}</triangles></mesh></object>')
        if len(children)>1:
            idx=next_id; next_id+=1
            components=''.join(f'<component objectid="{j}"/>' for j in children)
            resources.append(f'<object id="{idx}" type="model" name="{escape(names[0])}"><components>{components}</components></object>')
        build.append(f'<item objectid="{idx}" transform="1 0 0 0 1 0 0 0 1 {dx} {dy} 0"/>')
    model='<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">Cooldown rail V3</metadata><resources>'+''.join(resources)+'</resources><build>'+''.join(build)+'</build></model>'
    with zipfile.ZipFile(OUT/'models'/filename,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
        z.writestr('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
        z.writestr('3D/3dmodel.model',model)

make_3mf('00-sliders-and-clip.3mf',[(('slider-A-firm',),40,35),(('slider-B-firmer',),60,35),(('clip-card-left-0.50mm',),80,35)])
make_3mf('01-test-fit.3mf',[(('test-rail-body','test-rail-numerals'),20,20),(('slider-A-firm',),48,20),(('slider-B-firmer',),65,20),(('end-cap',),85,20),(('clip-card-left-0.50mm',),48,55)])
make_3mf('02-full-tracker.3mf',[(('rail-body','rail-numerals'),20,20),(('slider-A-firm',),48,20),(('end-cap',),65,20),(('clip-card-left-0.50mm',),48,55),(('clip-card-left-0.50mm',),48,70)])
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
show(full,dark); show(full_letters,paper); show(standard,orange); flex(standard,preloads[0]); translate(standard,y=FIRST+4*PITCH)
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
