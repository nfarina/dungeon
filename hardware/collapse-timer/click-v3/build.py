"""Descending ceiling timer; millimetres. Blender background Python, no add-ons.
V3 prototype: bidirectional rounded spring detent, 0–40 rounds, three parts.
"""
import bpy, bmesh, math, json, struct, zipfile
from pathlib import Path
from mathutils import Vector, Matrix
from xml.sax.saxutils import escape

OUT=Path(__file__).resolve().parent
MAX_ROUNDS=40
PITCH=3.2
FLOOR=8.0
INDEX=12.0
FRAME_TOP=166.0
PARTS={}; REPORT={}
for folder in ("stl","models","previews","validation"): (OUT/folder).mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def mesh(name,verts,faces):
    m=bpy.data.meshes.new(name); m.from_pydata(verts,[],faces); m.update()
    ob=bpy.data.objects.new(name,m); bpy.context.collection.objects.link(ob)
    bm=bmesh.new(); bm.from_mesh(m); bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(m); bm.free()
    return ob

def box(name,x0,x1,y0,y1,z0,z1):
    return mesh(name,[(x,y,z) for z in (z0,z1) for y in (y0,y1) for x in (x0,x1)],
      [(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)])

def prism(name,profile,y0,y1):
    n=len(profile)
    return mesh(name,[(x,y,z) for y in (y0,y1) for x,z in profile],
      [tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)])

def boolean(a,b,op='UNION',remove=True):
    bpy.context.view_layer.objects.active=a
    mod=a.modifiers.new('solid','BOOLEAN'); mod.operation=op; mod.solver='MANIFOLD'; mod.object=b
    modifier_name=mod.name
    bpy.ops.object.modifier_apply(modifier=modifier_name)
    assert modifier_name not in a.modifiers,('Boolean did not apply',a.name,b.name,op)
    if remove:bpy.data.objects.remove(b,do_unlink=True)
    return a

def copy(ob,name):
    c=ob.copy(); c.data=ob.data.copy(); c.name=name; bpy.context.collection.objects.link(c); return c

def shift(ob,x=0,y=0,z=0):
    ob.data.transform(Matrix.Translation((x,y,z))); ob.data.update(); return ob

def text_mesh(label,location,size,vertical=False,depth=.35):
    cv=bpy.data.curves.new('lettering','FONT'); cv.body=label; cv.size=size
    cv.align_x='CENTER'; cv.align_y='CENTER'; cv.extrude=depth; cv.resolution_u=3
    ob=bpy.data.objects.new('lettering',cv); bpy.context.collection.objects.link(ob)
    ob.location=location
    if vertical:ob.rotation_euler.x=math.pi/2
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active=ob
    bpy.ops.object.convert(target='MESH'); bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    # Font conversion duplicates vertices at cap/side boundaries. Weld those
    # boundaries so the lettering cutters are closed solids for the solver.
    bm=bmesh.new();bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
    bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=.000001)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    assert all(e.is_manifold for e in bm.edges),('Invalid lettering cutter',label)
    bm.to_mesh(ob.data);bm.free()
    return ob

def inlaid_number(label,z):
    cv=bpy.data.curves.new('flush numeral','FONT');cv.body=label
    cv.font=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial Bold.ttf')
    cv.size=4;cv.align_x='CENTER';cv.align_y='CENTER';cv.extrude=.3;cv.resolution_u=5
    ob=bpy.data.objects.new('flush '+label,cv);bpy.context.collection.objects.link(ob)
    ob.rotation_euler.x=math.pi/2
    bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
    bpy.ops.object.convert(target='MESH');bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bm=bmesh.new();bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
    bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=.000001)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
    bounds=[(min(v.co[i] for v in ob.data.vertices),max(v.co[i] for v in ob.data.vertices)) for i in range(3)]
    scale=2.5/(bounds[2][1]-bounds[2][0])
    for v in ob.data.vertices:
        v.co.x=18.65+(v.co.x-sum(bounds[0])/2)*scale
        v.co.z=z+(v.co.z-sum(bounds[2])/2)*scale
        v.co.y=4+.6*(v.co.y-bounds[1][0])/(bounds[1][1]-bounds[1][0])
    return ob

def make_frame(name,maximum,top):
    ob=box(name,6,106,4,12,0,8)
    boolean(ob,box('socket tongue',22,90,4,12,-8,.2))
    # Build the entire scalloped pillar as one outline. This avoids coplanar
    # Boolean seams from joining dozens of individual rounded crests.
    profile=[(14,7.8),(24,7.8)]
    angle=math.acos((24-24.5)/1.1)
    for n in range(-1,maximum+1):
        z=FLOOR+INDEX+(n+.5)*PITCH
        profile.extend((24.5+1.1*math.cos(-angle+2*angle*a/48),z+1.1*math.sin(-angle+2*angle*a/48)) for a in range(49))
    profile.extend([(24,top),(14,top)])
    boolean(ob,prism('scalloped numbered pillar',profile,4,12))
    boolean(ob,box('plain guide',88,98,4,12,7.8,top))
    letters=None
    for n in range(maximum+1):
        t=inlaid_number(str(n),FLOOR+INDEX+n*PITCH)
        if letters is None:letters=t
        else:boolean(letters,t)
    boolean(ob,letters,'DIFFERENCE',remove=False)
    # Shallow mortar grooves stay away from the rack and sliding side faces.
    for z in range(14,int(top)-1,12):
        boolean(ob,box('stone joint',89,97,3.9,4.25,z-.2,z+.2),'DIFFERENCE')
    return ob,letters

def make_ceiling(light=False):
    ob=box('ceiling light' if light else 'ceiling standard',11,101,1,25,0,6)
    boolean(ob,box('left guide collar',11,30.4,1,15,0,31))
    boolean(ob,box('right guide collar',85,101,1,15,0,31))
    boolean(ob,box('spring support',33,36,1,15,0,31))
    boolean(ob,box('spring root bridge',25,36,1,15,28,31))
    # Reduce both guiding clearances to 0.20 mm per side; retain the cam and spring.
    boolean(ob,box('left bore',13.8,26.0,3.8,12.2,-1,33),'DIFFERENCE')
    boolean(ob,box('right bore',87.8,98.2,3.8,12.2,-1,33),'DIFFERENCE')
    # Open spring relief and a front window centered exactly on the engaged tooth.
    boolean(ob,box('spring relief',24.05,31.6,.9,15.1,8,27.9),'DIFFERENCE')
    # Flared viewing window reduces parallax without exposing adjacent numbers.
    rings=[(13.5,24.1,.9,8.9,15.1),(14.2,23.4,3.8,9.9,14.1),(14.2,23.4,4.05,9.9,14.1)]
    verts=[(x,y,z) for x0,x1,y,z0,z1 in rings for x,z in ((x0,z0),(x1,z0),(x1,z1),(x0,z1))]
    faces=[(3,2,1,0),(8,9,10,11)]+[(k+i,k+(i+1)%4,k+4+(i+1)%4,k+4+i) for k in (0,4) for i in range(4)]
    boolean(ob,mesh('flared number window',verts,faces),'DIFFERENCE')
    # Planar spring and rounded follower flex automatically over each crest.
    # Standard beam is 1.4 mm; light is 1.2 mm. Both have identical guide fit.
    boolean(ob,box('spring',27.8,29.0 if light else 29.2,1,15,10.3,28.3))
    boolean(ob,box('follower neck',25.3,28.5,1,15,11.5,12.5))
    circle=[(25.3+.65*math.cos(a*math.tau/48),12+.65*math.sin(a*math.tau/48)) for a in range(48)]
    boolean(ob,prism('round follower',circle,1,15))
    # Internal travel stop, not a release control: 1.35 mm to the rigid post.
    boolean(ob,box('internal stop',28.8,31.65,1,15,11.5,12.5))
    # Front pointer is recessed; no unsupported decorative islands.
    boolean(ob,prism('pointer',[(11.7,11.35),(13.35,12),(11.7,12.65)],.9,1.4),'DIFFERENCE')
    # Plain stone seams on the beam face, with no special range colors.
    for x in (44,61,78):
        boolean(ob,box('ceiling joint',x-.18,x+.18,.9,1.35,.9,5.1),'DIFFERENCE')
    return ob

def make_base():
    ob=box('base',0,112,-12,38,-10,0)
    boolean(ob,box('room floor',10,102,0,26,-.1,8))
    # Stepped blind socket: narrow tongue below, wider U-frame crossbar above.
    boolean(ob,box('tongue socket',21.65,90.35,3.8,12.2,-8.3,.1),'DIFFERENCE')
    boolean(ob,box('crossbar seat',5.65,106.35,3.8,12.2,0,8.1),'DIFFERENCE')
    for x in range(20,100,10):
        if x in (50,60):continue
        boolean(ob,box('floor seam',x-.16,x+.16,13,25,7.65,8.1),'DIFFERENCE')
    for x0,x1 in ((11,49),(63,101)):
        boolean(ob,box('floor seam',x0,x1,18.85,19.15,7.65,8.1),'DIFFERENCE')
    # A tiny engraved crawler disappears under the ceiling at zero. It adds
    # no loose part and cannot obstruct the closing mechanism.
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=1.05,depth=.5,location=(56,15.6,7.85))
    cut=bpy.context.object;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    boolean(ob,cut,'DIFFERENCE')
    def stroke(x0,y0,x1,y1):
        length=math.hypot(x1-x0,y1-y0);px=-(y1-y0)/length*.35;py=(x1-x0)/length*.35
        corners=[(x0+px,y0+py),(x1+px,y1+py),(x1-px,y1-py),(x0-px,y0-py)]
        vs=[(x,y,z) for z in (7.55,8.1) for x,y in corners]
        return mesh('crawler engraving',vs,[(3,2,1,0),(4,5,6,7)]+[(i,(i+1)%4,(i+1)%4+4,i+4) for i in range(4)])
    for seg in ((56,17,56,20.8),(56,18,53.5,19.3),(56,18,58.4,17.2),(56,20.8,53.8,23.5),(56,20.8,59,22.8)):
        boolean(ob,stroke(*seg),'DIFFERENCE')
    boolean(ob,text_mesh('FLOOR COLLAPSE',(56,-6,-.18),4.8,False,.35),'DIFFERENCE')
    return ob

def analyze(ob):
    if not len(ob.data.vertices):return dict(nonmanifold_edges=0,components=0,volume_mm3=0,dimensions_mm=[0,0,0])
    bm=bmesh.new(); bm.from_mesh(ob.data)
    bad=sum(not e.is_manifold for e in bm.edges); volume=bm.calc_volume(signed=True)
    components=0; visited=set()
    for v in bm.verts:
        if v in visited:continue
        components+=1; visited.add(v); queue=[v]
        while queue:
            q=queue.pop()
            for e in q.link_edges:
                nxt=e.other_vert(q)
                if nxt not in visited:visited.add(nxt);queue.append(nxt)
    bm.free()
    coords=[v.co for v in ob.data.vertices]
    dims=[max(v[i] for v in coords)-min(v[i] for v in coords) for i in range(3)]
    return dict(nonmanifold_edges=bad,components=components,volume_mm3=round(volume,4),dimensions_mm=[round(d,4) for d in dims])

def export(ob,name,flat=False,back=False,origin_min=None):
    # Weld numerical slivers from repeated coplanar cam unions, at 0.00001 mm.
    bm=bmesh.new();bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
    bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=.000001)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
    c=copy(ob,name+' print')
    # y=1/4 front face on bed: X stays horizontal; assembly Z becomes print Y.
    if flat:c.data.transform(Matrix.Rotation(-math.pi/2 if back else math.pi/2,4,'X'))
    mins=origin_min if origin_min is not None else [min(v.co[i] for v in c.data.vertices) for i in range(3)]
    shift(c,*[-v for v in mins])
    info=analyze(c); REPORT[name]=info
    assert info['nonmanifold_edges']==0 and info['volume_mm3']>0,(name,info)
    if 'numerals' not in name:assert info['components']==1,(name,info)
    assert all(d<=180 for d in info['dimensions_mm']),(name,'exceeds build volume')
    c.data.calc_loop_triangles()
    with (OUT/'stl'/(name+'.stl')).open('wb') as f:
        f.write(b'Descending ceiling prototype; mm'.ljust(80,b'\0'));f.write(struct.pack('<I',len(c.data.loop_triangles)))
        for tri in c.data.loop_triangles:
            vs=[c.data.vertices[i].co for i in tri.vertices]
            normal=(vs[1]-vs[0]).cross(vs[2]-vs[0]).normalized()
            f.write(struct.pack('<12fH',*normal,*vs[0],*vs[1],*vs[2],0))
    c.hide_render=True;c.hide_viewport=True;PARTS[name]=c
    return c

def intersection(a,b):
    c=copy(a,'interference');boolean(c,b,'INTERSECT',False)
    volume=analyze(c)['volume_mm3'];bpy.data.objects.remove(c,do_unlink=True);return volume

frame,frame_letters=make_frame('full frame',MAX_ROUNDS,FRAME_TOP)
test,test_letters=make_frame('test frame',4,56)
ceiling=make_ceiling()
light_ceiling=make_ceiling(True)
base=make_base()
export(frame,'frame-body-0-to-40',True,True)
export(frame_letters,'frame-numerals',True,True,origin_min=(6,-8,-12))
export(test,'test-frame-body-0-to-4',True,True)
export(test_letters,'test-frame-numerals',True,True,origin_min=(6,-8,-12))
export(ceiling,'ceiling-click-standard',True)
export(light_ceiling,'ceiling-click-light',True)
export(base,'base')
# Flush inlays share the cut boundary without overlap or protrusion.
assert intersection(frame,frame_letters)<.001
assert all(3.99999<=v.co.y<=4.60001 for v in frame_letters.data.vertices)
for body,letters,name in ((frame,frame_letters,'frame-one-color'),(test,test_letters,'test-frame-one-color')):
    c=copy(body,name);boolean(c,letters,remove=False)
    combined=analyze(c)
    assert combined['nonmanifold_edges']==0 and combined['components']==1
    REPORT[name+'_union_check']=combined
    bpy.data.objects.remove(c,do_unlink=True)
REPORT['number_inlay_depth_mm']=.6
REPORT['number_height_mm']=2.5
REPORT['guide_clearance_per_side_mm']=.2

rest=[]
for n in range(MAX_ROUNDS+1):
    c=copy(ceiling,'rest check');shift(c,z=FLOOR+n*PITCH)
    rest.append(intersection(c,frame));assert intersection(c,frame_letters)<.001;bpy.data.objects.remove(c,do_unlink=True)
REPORT['resting_intersections_mm3']=rest
assert max(rest)<.001,rest
REPORT['frame_base_intersection_mm3']=intersection(frame,base)
assert REPORT['frame_base_intersection_mm3']<.001
c=copy(ceiling,'zero check');shift(c,z=FLOOR)
REPORT['zero_ceiling_base_intersection_mm3']=intersection(c,base)
assert REPORT['zero_ceiling_base_intersection_mm3']<.001
bpy.data.objects.remove(c,do_unlink=True)

# An unflexed follower must encounter each crest in BOTH directions.
blocked=[]
for offset in (-PITCH/2,PITCH/2):
    c=copy(ceiling,'crest check');shift(c,z=FLOOR+PITCH+offset)
    blocked.append(intersection(c,frame));bpy.data.objects.remove(c,do_unlink=True)
REPORT['unflexed_crest_intersections_mm3']=blocked
assert min(blocked)>.1,blocked

# Required follower clearance comes from the two circular cam surfaces.
# Apply an approximate bent-beam envelope and inspect both spring variants.
# This is geometry only, not a holding-force, fatigue, or sound prediction.
all_travel={}; displacements=[]
for variant,source in (('standard',ceiling),('light',light_ceiling)):
    travel=[]
    for sx in (-.199,0,.199):
        for sy in (-.199,0,.199):
            for step in range(65):
                offset=PITCH*step/64
                dz=abs(PITCH/2-offset)
                delta=max(0,24.5+math.sqrt(max(0,(1.1+.65+.04)**2-dz**2))-(25.3+sx))
                displacements.append(delta)
                c=copy(source,'cam travel')
                for v in c.data.vertices:
                    x,z=v.co.x,v.co.z
                    if 24.64<=x<=31.66 and 10.29<=z<27.9:
                        if x<27.8 or z<=12.65:factor=1.0
                        else:
                            t=max(0,min(1,(27.9-z)/(27.9-12.65)))
                            factor=t*t*(3-t)/2
                        v.co.x+=delta*factor
                shift(c,x=sx,y=sy,z=FLOOR+PITCH+offset)
                travel.append(intersection(c,frame))
                assert intersection(c,frame_letters)<.001
                bpy.data.objects.remove(c,do_unlink=True)
    all_travel[variant]={'poses':len(travel),'maximum_intersection_mm3':max(travel)}
    assert max(travel)<.001,(variant,max(travel))
REPORT['flexed_travel_checks']=all_travel
REPORT['maximum_approximate_follower_travel_mm']=max(displacements)
assert max(displacements)<1.35

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
    model='<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">Descending ceiling V3 - flush numerals</metadata><resources>'+''.join(resources)+'</resources><build>'+''.join(build)+'</build></model>'
    with zipfile.ZipFile(OUT/'models'/filename,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
        z.writestr('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
        z.writestr('3D/3dmodel.model',model)

make_3mf('00-test-frame-only.3mf',[(('test-frame-body-0-to-4','test-frame-numerals'),6,20)])
make_3mf('01-ceiling-only.3mf',[(('ceiling-click-standard',),35,45)])
make_3mf('02-full-frame.3mf',[(('frame-body-0-to-40','frame-numerals'),6,3)])
make_3mf('03-base-and-ceiling.3mf',[(('base',),20,20),(('ceiling-click-standard',),20,85)])
(OUT/'validation'/'geometry.json').write_text(json.dumps(REPORT,indent=2)+'\n')

# Render the exact printable geometry in assembled position at round 22.
for ob in bpy.data.objects:ob.hide_render=True
def mat(name,color):
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.62
    return m
stone=mat('stone grey',(.27,.32,.34));moving=mat('sandstone ceiling',(.62,.57,.43));ground=mat('table',(.13,.16,.18))
def show(ob,material):ob.hide_render=False;ob.data.materials.clear();ob.data.materials.append(material)
show(frame,stone);show(frame_letters,mat('ivory numerals',(.95,.92,.83)));show(base,stone);show(ceiling,moving);shift(ceiling,z=FLOOR+22*PITCH)
table=box('table',-250,350,-250,300,-12,-10.03);show(table,ground)
bpy.ops.object.camera_add(location=(265,-325,225));camera=bpy.context.object;target=Vector((56,8,77))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=230
scene=bpy.context.scene;scene.camera=camera
for loc,power,size in [((-80,-100,250),240000,180),((200,60,210),170000,130)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=40;scene.world.color=(.3,.3,.3)
scene.render.resolution_x=1400;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG'
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=.001;scene.unit_settings.length_unit='MILLIMETERS'
scene.render.filepath=str(OUT/'previews'/'assembled-round-22.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'collapse-timer.blend'))
bpy.ops.render.render(write_still=True)
print('COMPLETE',json.dumps(REPORT))
