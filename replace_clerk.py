import os

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', '.expo']]
    for f in files:
        if f.endswith(('.tsx', '.ts', '.jsx', '.js')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
            except:
                continue
            new_content = content.replace('@clerk/clerk-expo', '@clerk/expo')
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print('Updated', path)
