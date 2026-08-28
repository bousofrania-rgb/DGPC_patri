import re

with open('src/lib/permissions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'settings'", "'settings', 'databases'")

with open('src/lib/permissions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Permissions patched.")
