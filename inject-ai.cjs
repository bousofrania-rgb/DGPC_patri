const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importStatement = `import { GoogleGenAI, Type } from "@google/genai";\n`;
if (!code.includes('@google/genai')) {
  code = importStatement + code;
}

const aiRoutes = `
  // AI Generate Technical Sheet Endpoint
  app.post("/api/ai/generate-technical-sheet", async (req, res) => {
    try {
      const { fileData, mimeType, textContent } = req.body;
      
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const parts = [];
      if (fileData && mimeType) {
        parts.push({
          inlineData: {
            data: fileData,
            mimeType: mimeType
          }
        });
      }
      if (textContent) {
        parts.push({ text: textContent });
      }

      parts.push({
        text: "Génère une fiche technique structurée à partir du document fourni. Extrais uniquement les informations pertinentes : Désignation, Marque, Modèle / référence, Caractéristiques techniques, Dimensions, Puissance, Tension, Capacité, Conditions d’utilisation, Normes ou certifications, Informations complémentaires utiles."
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              designation: { type: Type.STRING },
              marque: { type: Type.STRING },
              modele_reference: { type: Type.STRING },
              caracteristiques_techniques: { type: Type.STRING },
              dimensions: { type: Type.STRING },
              puissance: { type: Type.STRING },
              tension: { type: Type.STRING },
              capacite: { type: Type.STRING },
              conditions_utilisation: { type: Type.STRING },
              normes_certifications: { type: Type.STRING },
              informations_complementaires: { type: Type.STRING }
            }
          }
        }
      });

      const jsonStr = response.text.trim();
      res.json({ success: true, data: JSON.parse(jsonStr) });

    } catch (err) {
      console.error("[AI Error]", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // AI Compare Documents Endpoint
  app.post("/api/ai/compare-documents", async (req, res) => {
    try {
      const { documents, tolerance } = req.body;
      // documents is an array of { title: string, content: string }
      
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let prompt = "Compare ces documents pour le contrôle et vérification de commande.\\n";
      prompt += \`Degré de tolérance autorisé : \${tolerance}.\\n\\n\`;
      
      documents.forEach(doc => {
         prompt += \`--- \${doc.title} ---\\n\${doc.content}\\n\\n\`;
      });

      prompt += \`Analyse et identifie les informations communes, divergentes et absentes.
      Pour chaque article, compare la quantité, la désignation, les caractéristiques.
      Applique la tolérance (\${tolerance}) sur les écarts quantitatifs ou qualitatifs mineurs.
      Le statut doit être "Conforme", "Conforme avec tolérance", "Divergence mineure" ou "Divergence importante".
      Retourne un format JSON strict avec un tableau "comparaisons".\`

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              comparaisons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    article_demande: { type: Type.STRING },
                    article_commande: { type: Type.STRING },
                    article_livre: { type: Type.STRING },
                    quantite: { type: Type.STRING, description: "ex: Demande: 5, Commande: 5, Livré: 4" },
                    ecart: { type: Type.STRING, description: "Description de l'écart constaté" },
                    statut: { type: Type.STRING }
                  }
                }
              },
              resume: { type: Type.STRING, description: "Résumé général des constatations" }
            }
          }
        }
      });

      const jsonStr = response.text.trim();
      res.json({ success: true, data: JSON.parse(jsonStr) });

    } catch (err) {
      console.error("[AI Compare Error]", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
`;

code = code.replace('// Setup Vite middleware for development, or static files for production', aiRoutes + '\n  // Setup Vite middleware for development, or static files for production');

fs.writeFileSync('server.ts', code);
