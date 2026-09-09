"""Resolve installed Bambu profiles and slice locally; never sends to a printer."""
import json, subprocess, zipfile, xml.etree.ElementTree as ET
from pathlib import Path

ROOT=Path(__file__).resolve().parent
PROFILES=Path('/Applications/BambuStudio.app/Contents/Resources/profiles/BBL')
BIN='/Applications/BambuStudio.app/Contents/MacOS/BambuStudio'
files={p.stem:p for p in PROFILES.rglob('*.json')}
def resolve(name,chain=()):
    assert name not in chain,(name,chain)
    data=json.loads(files[name].read_text()); result={}
    parent=data.get('inherits')
    if parent: result.update(resolve(parent,chain+(name,)))
    for template in data.get('include',[]): result.update(resolve(template,chain+(name,)))
    result.update(data)
    for key in ('inherits','include'): result.pop(key,None)
    return result

folder=ROOT/'validation'/'profiles'; folder.mkdir(exist_ok=True)
settings={
    'machine':resolve('Bambu Lab A1 mini 0.4 nozzle'),
    'process':resolve('0.20mm Standard @BBL A1M'),
    'filament':resolve('Bambu PLA Basic @BBL A1M')
}
settings['machine']['curr_bed_type']='Textured PEI Plate'
settings['process'].update(layer_height='0.20',wall_loops='3',sparse_infill_density='20%',
    enable_support='0',elefant_foot_compensation='0.15',wall_generator='arachne',
    brim_type='no_brim',outer_wall_speed='50',inner_wall_speed='80',
    small_perimeter_speed='30',initial_layer_speed='25')
for name,data in settings.items(): (folder/f'{name}.json').write_text(json.dumps(data,indent=2))
# First let Bambu generate its native project metadata from the compound model.
for source in ('00-sliders-and-clip','01-test-fit','02-full-tracker'):
    dest=ROOT/'validation'/('native-'+source); dest.mkdir(exist_ok=True)
    cmd=[BIN,'--datadir','/private/tmp/dcc-cooldown-v3-bambu','--load-settings',
        str(folder/'machine.json')+';'+str(folder/'process.json'),
        '--load-filaments',str(folder/'filament.json'),'--orient','0','--arrange','0',
        '--outputdir',str(dest),'--export-3mf','native.3mf',str(ROOT/'models'/(source+'.3mf'))]
    result=subprocess.run(cmd,capture_output=True,text=True,cwd=dest)
    (dest/'export.log').write_text(result.stdout+result.stderr)
    assert result.returncode==0,(source,result.stderr,result.stdout)
    assert (dest/'native.3mf').exists()
print('Native projects exported')

reports={}
for source in ('00-sliders-and-clip','01-test-fit','02-full-tracker'):
    dest=ROOT/'validation'/('native-'+source)
    with zipfile.ZipFile(dest/'native.3mf') as z:
        contents={n:z.read(n) for n in z.namelist()}
    config=json.loads(contents['Metadata/project_settings.config'])
    filament_keys=set(settings['filament'])|{k for k in config if k.startswith('filament_')}
    for key in filament_keys:
        value=config.get(key)
        if isinstance(value,list) and len(value)==1: config[key]=value*2
    config.update(filament_colour=['#FF7C24','#FFFFFF'],filament_self_index=['1','2'],
        flush_volumes_matrix=['0','600','280','0'],flush_volumes_vector=['140']*4,
        wipe_tower_x=['115'],wipe_tower_y=['95'])
    if source.startswith('00-'):
        for key in filament_keys:
            if isinstance(config.get(key),list) and len(config[key])==2:
                config[key]=config[key][:1]
        config.update(filament_colour=['#FF7C24'],filament_self_index=['1'],
            flush_volumes_matrix=['0'],flush_volumes_vector=['140','140'])
    contents['Metadata/project_settings.config']=json.dumps(config,indent=2).encode()
    tree=ET.fromstring(contents['Metadata/model_settings.config'])
    colored=0
    for obj in tree.findall('object'):
        parts=obj.findall('part')
        if len(parts)==2:
            parts[1].find("metadata[@key='name']").set('value','Raised numerals')
            ET.SubElement(parts[1],'metadata',key='extruder',value='2')
            colored+=1
    assert colored==(0 if source.startswith('00-') else 1)
    contents['Metadata/model_settings.config']=ET.tostring(tree,encoding='utf-8',xml_declaration=True)
    with zipfile.ZipFile(dest/'colored.3mf','w',zipfile.ZIP_DEFLATED) as z:
        for n,data in contents.items():z.writestr(n,data)
    # Round-trip through Bambu itself to save normalized project metadata.
    command=[BIN,'--datadir','/private/tmp/dcc-cooldown-v3-bambu','--orient','0',
        '--arrange','0','--outputdir',str(ROOT),'--export-3mf',source+'.3mf',str(dest/'colored.3mf')]
    result=subprocess.run(command,capture_output=True,text=True,cwd=dest)
    (dest/'color-export.log').write_text(result.stdout+result.stderr)
    assert result.returncode==0,(source,result.stderr,result.stdout)
    with zipfile.ZipFile(ROOT/(source+'.3mf')) as z:
        saved=json.loads(z.read('Metadata/project_settings.config'))
        assert saved['nozzle_diameter']==['0.4'] and saved['layer_height']=='0.2'
        assert saved['printer_model']=='Bambu Lab A1 mini'
        assert len(saved['filament_colour'])==(1 if source.startswith('00-') else 2)
        objects=ET.fromstring(z.read('Metadata/model_settings.config'))
        assert len(objects.findall(".//part/metadata[@key='extruder'][@value='2']"))==(0 if source.startswith('00-') else 1)
    sliced=ROOT/'validation'/('sliced-'+source); sliced.mkdir(exist_ok=True)
    command=[BIN,'--datadir','/private/tmp/dcc-cooldown-v3-bambu','--orient','0',
        '--arrange','0','--slice','0','--outputdir',str(sliced),str(ROOT/(source+'.3mf'))]
    result=subprocess.run(command,capture_output=True,text=True,cwd=sliced)
    (sliced/'slice.log').write_text(result.stdout+result.stderr)
    assert result.returncode==0,(source,result.stderr,result.stdout)
    report=json.loads((sliced/'result.json').read_text())
    assert report['return_code']==0,report
    assert len(report['sliced_plates'])==1
    plate=report['sliced_plates'][0]
    assert len(plate['filaments'])==(1 if source.startswith('00-') else 2),plate
    reports[source]={k:report[k] for k in ('return_code','layer_height','wall_loops')}
    reports[source].update(warnings=plate.get('warning_message',''),seconds=plate['total_predication'],filaments=plate['filaments'])
    print(source,json.dumps(reports[source]),flush=True)
(ROOT/'validation'/'slicing-summary.json').write_text(json.dumps(reports,indent=2)+'\n')
