import re

with open('src/components/DatabasesTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "derniereMaj: new Date().toLocaleDateString('fr-FR')\n            };",
    "derniereMaj: new Date().toLocaleDateString('fr-FR'),\n              marque: '',\n              rowIndex: totalItems.length + 2\n            };"
)

with open('src/components/DatabasesTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

