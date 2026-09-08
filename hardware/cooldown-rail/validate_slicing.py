"""Resolve installed Bambu profiles and slice locally; never sends to a printer."""
import json, subprocess
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
    'process':resolve('0.16mm Optimal @BBL A1M'),
    'filament':resolve('Bambu PLA Basic @BBL A1M')
}
settings['process'].update(layer_height='0.16',wall_loops='3',sparse_infill_density='20%',
    enable_support='0',elefant_foot_compensation='0.15',wall_generator='arachne',
    brim_type='no_brim',outer_wall_speed='50',inner_wall_speed='80',
    small_perimeter_speed='30',initial_layer_speed='25')
for name,data in settings.items(): (folder/f'{name}.json').write_text(json.dumps(data,indent=2))
reports={}
for source in ('01-test-fit','02-full-tracker'):
    dest=ROOT/'validation'/('sliced-'+source); dest.mkdir(exist_ok=True)
    cmd=[BIN,'--datadir','/private/tmp/dcc-bambu-validation','--load-settings',
        str(folder/'machine.json')+';'+str(folder/'process.json'),
        '--load-filaments',str(folder/'filament.json'),'--orient','0','--arrange','1',
        '--slice','0','--outputdir',str(dest),str(ROOT/(source+'.3mf'))]
    result=subprocess.run(cmd,capture_output=True,text=True)
    (ROOT/'validation'/(source+'-slice.log')).write_text(result.stdout+result.stderr)
    assert result.returncode==0,(source,result.stderr,result.stdout)
    report=json.loads((dest/'result.json').read_text())
    assert report['return_code']==0,report
    plate=report['sliced_plates'][0]
    reports[source]={k:report[k] for k in ('return_code','layer_height','wall_loops')}
    reports[source].update(warnings=plate.get('warning_message',''),seconds=plate['total_predication'],filaments=plate['filaments'])
    # Keep only reports. Deliver models, not machine-specific executable G-code.
    for p in dest.glob('*.gcode'): p.unlink()
(ROOT/'validation'/'slicing-summary.json').write_text(json.dumps(reports,indent=2)+'\n')
print(json.dumps(reports,indent=2))
