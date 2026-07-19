import os
import glob
import re
import sys

logs_dir = r"j:\IDriveLocal\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\.playwright-mcp"
log_files = glob.glob(os.path.join(logs_dir, "*.log"))

errors = set()
warnings = set()

for file_path in log_files:
    filename = os.path.basename(file_path)
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if "[ERROR]" in line or "error" in line.lower() or "failed" in line.lower():
                    # Clean timestamp/duration prefix to deduplicate
                    cleaned = re.sub(r"^\[\s*\d+m?s\s*\]\s*", "", line).strip()
                    errors.add((filename, cleaned))
                elif "[WARN]" in line or "warning" in line.lower():
                    cleaned = re.sub(r"^\[\s*\d+m?s\s*\]\s*", "", line).strip()
                    warnings.add((filename, cleaned))
    except Exception as e:
        pass

# Group errors
unique_errors = {}
for file, msg in errors:
    unique_errors.setdefault(msg, []).append(file)

# Group warnings
unique_warnings = {}
for file, msg in warnings:
    unique_warnings.setdefault(msg, []).append(file)

output_file = r"j:\IDriveLocal\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\scratch\analysis_report.txt"
with open(output_file, "w", encoding="utf-8") as out:
    out.write(f"Total Log Files Checked: {len(log_files)}\n\n")
    out.write("=========================================\n")
    out.write("UNIQUE ERRORS FOUND\n")
    out.write("=========================================\n")
    for msg, files in sorted(unique_errors.items()):
        out.write(f"Message: {msg}\n")
        out.write(f"Count: {len(files)}\n")
        out.write(f"Files: {', '.join(files[:5])}\n")
        out.write("-" * 50 + "\n")
        
    out.write("\n=========================================\n")
    out.write("UNIQUE WARNINGS FOUND\n")
    out.write("=========================================\n")
    for msg, files in sorted(unique_warnings.items()):
        out.write(f"Message: {msg}\n")
        out.write(f"Count: {len(files)}\n")
        out.write(f"Files: {', '.join(files[:5])}\n")
        out.write("-" * 50 + "\n")

print(f"Analysis written to {output_file}")
