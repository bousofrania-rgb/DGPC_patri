const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `          />
        )}

        {activeTab === 'verification' && (
          <VerificationTab />
        )}`;

code = code.replace(`          />\n        )}`, replacement);
fs.writeFileSync('src/App.tsx', code);
