# NOCTURA — Port de Porquerolles

Le prototype repart sur une architecture simple et réaliste :

1. **Vue globale** : vraie orthophoto du port.
2. **Deux zones cliquables** : Panne G d'abord, zone technique/carénage ensuite.
3. **Scènes locales** : modèles `.glb` préparés dans Blender à partir des références vérifiées.
4. **Éclairage NOCTURA** : objets lumineux séparés et contrôlables dans l'application.

L'ancienne scène procédurale Three.js a été sauvegardée dans la branche `legacy-procedural-3d` puis retirée de `main`.

## Lancer le site

```bash
npm install
npm run dev
```

## Générer la scène Blender de base

```bash
blender -b --python blender/build_ponton_g.py
```

Cela crée :

- `blender/ponton_g.blend`
- `public/assets/models/ponton-g.glb`

Le script ne fabrique volontairement pas de géométrie détaillée inventée. La modélisation de Panne G est ajoutée uniquement à partir de l'orthophoto et des photos réelles collectées.

## Règle de données

- géométrie vérifiée ≠ hypothèse ;
- positions exactes des luminaires non revendiquées sans plan ou référence visuelle ;
- les photos externes ne sont pas commitées publiquement sans droit de redistribution confirmé.
