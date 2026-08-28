import re

with open('src/types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

if 'export interface DatabaseImport' not in content:
    content += """

export interface DatabaseImport {
  id: string;
  fileName: string;
  importDate: string;
  recordCount: number;
  status: 'Succès' | 'Échec' | 'Partiel';
}
"""

with open('src/types.ts', 'w', encoding='utf-8') as f:
    f.write(content)
