import os
import glob
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

logs_dir = r"j:\IDriveLocal\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\.playwright-mcp"
log_files = glob.glob(os.path.join(logs_dir, "*.log"))

for file_path in log_files:
    filename = os.path.basename(file_path)
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            for idx, line in enumerate(lines):
                if "reading '0'" in line:
                    print(f"=== Found in {filename} at line {idx+1} ===")
                    start = max(0, idx - 5)
                    end = min(len(lines), idx + 15)
                    for i in range(start, end):
                        # Replace emojis or non-ascii to be safe
                        safe_line = lines[i].encode('ascii', errors='replace').decode('ascii')
                        print(f"{i+1}: {safe_line.strip()}")
                    print("=" * 50)
    except Exception as e:
        print(f"Error reading {filename}: {e}")
