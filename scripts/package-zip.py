import os
import zipfile
import sys

def create_zip():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    output_zip = os.path.join(base_dir, 'dasara-zone-app.zip')
    
    exclude_dirs = {
        'node_modules', 
        'dist', 
        '.git', 
        '.aistudio', 
        '__pycache__', 
        '.cache',
        '.vscode'
    }
    exclude_files = {
        'dasara-zone-app.zip', 
        'dasara_zone.db-shm', 
        'dasara_zone.db-wal'
    }
    
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            for file in files:
                if file in exclude_files or file.endswith('.pyc') or file.endswith('.tmp'):
                    continue
                full_path = os.path.join(root, file)
                arcname = os.path.relpath(full_path, base_dir)
                zipf.write(full_path, arcname)

    print(f"Project ZIP created: {output_zip} ({os.path.getsize(output_zip)} bytes)")
    return output_zip

if __name__ == '__main__':
    create_zip()
