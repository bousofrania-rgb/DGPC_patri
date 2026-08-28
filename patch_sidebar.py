import re

with open('src/components/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I need to add 'databases' to the sidebar tabs, right after 'settings'
if "renderItem('databases'" not in content:
    content = content.replace(
        "{renderItem('settings', Settings, 'Paramètres')}",
        "{renderItem('settings', Settings, 'Paramètres')}\n            {renderItem('databases', Database, 'Bases de données')}"
    )

with open('src/components/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Sidebar patched.")
