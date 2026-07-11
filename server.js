require("dotenv").config();
const path = require("path");
const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const SYSTEM_PROMPT = `Tu es un agent de recherche documentaire. On te donne le nom d'une créatrice de contenu (Instagram/TikTok). Tu recherches uniquement des SOURCES PUBLIQUES (ses propres contenus, interviews, articles de presse, pages officielles) et tu remplis une fiche structurée.

RÈGLES STRICTES :
- N'invente RIEN. Si une information n'est pas trouvable dans des sources publiques, mets la valeur exacte "non vérifié".
- Sois concis : phrases courtes ou groupes nominaux, ~15 mots max par champ.
- Les scores de leviers (0–100) reflètent l'importance de chaque levier dans SA stratégie observable.
- replicabilite : entier 1 à 5 (5 = facilement reproductible aujourd'hui).
- statut : "actif", "déclin" ou "pivot".
- Renvoie UNIQUEMENT un objet JSON valide, sans texte avant/après, sans balises Markdown.

Format JSON attendu (toutes les clés obligatoires) :
{
 "nom":"", "handle":"", "plateforme_principale":"", "plateformes_secondaires":"",
 "regime_tag":"", "statut":"",
 "background":"", "audience_amorce":"", "avantages_injustes":"",
 "breakthrough_vecteur":"", "breakthrough_type":"", "facteur_chance":"", "replicabilite":0,
 "archetype_primaire":"", "archetype_secondaire":"", "construction_persona":"", "lane":"", "angle_unique":"",
 "formats":"", "cadence":"", "codes_visuels":"",
 "audience_cible":"", "contrat_emotionnel":"",
 "monetisation":"", "conversion_statut":"", "empreinte":"",
 "leviers":{"attention":0,"identite":0,"recit":0,"preuve":0,"psychologie":0,"conversion":0},
 "sources":["url1","url2"],
 "confiance":"faible|moyenne|élevée",
 "champs_non_verifies":["clé1","clé2"]
}`;

app.post("/api/research", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const platform = typeof req.body?.platform === "string" ? req.body.platform.trim() : "";

  if (!name) {
    return res.status(400).json({ error: "Le champ 'name' est requis." });
  }

  const query = platform ? `${name} (créatrice ${platform})` : name;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Créatrice à documenter : ${query}. Recherche et renvoie la fiche JSON.` },
      ],
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start < 0 || end < 0) {
      return res.status(502).json({ error: "Réponse du modèle non exploitable (pas de JSON trouvé)." });
    }

    const dossier = JSON.parse(clean.slice(start, end + 1));
    return res.json(dossier);
  } catch (err) {
    console.error("research error:", err);
    return res.status(502).json({ error: "La recherche a échoué. Réessaie ou reformule le nom." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SIGNAL agent de dossier — écoute sur http://localhost:${PORT}`);
});
