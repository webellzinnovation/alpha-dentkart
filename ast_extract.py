import sys, json
from graphify.extract import collect_files, extract
from pathlib import Path

# Use utf-8-sig to handle the BOM added by PowerShell Out-File
detect_path = Path('.graphify_detect.json')
with detect_path.open('r', encoding='utf-8-sig') as f:
    detect = json.load(f)

code_files = []
for f in detect.get('files', {}).get('code', []):
    p = Path(f)
    if p.is_dir():
        code_files.extend(collect_files(p))
    else:
        code_files.append(p)

if code_files:
    result = extract(code_files)
    with Path('.graphify_ast.json').open('w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)
    print(f'AST: {len(result["nodes"])} nodes, {len(result["edges"])} edges')
else:
    with Path('.graphify_ast.json').open('w', encoding='utf-8') as f:
        json.dump({'nodes':[],'edges':[]}, f, indent=2)
    print('No code files found')
