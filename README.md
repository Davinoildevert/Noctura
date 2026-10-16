# NOCTURA — Porquerolles 3D

Prototype de jumeau numérique visuel du port de Porquerolles pour Ocean Hackathon 2026.

## Objectif

Créer une représentation 3D immersive du port de Porquerolles, pilotable par NOCTURA : scénarios d'éclairage, intensité des points lumineux, comparaison énergétique et environnementale, puis synchronisation possible avec une maquette ESP32.

## Philosophie de la V1

La première version vise déjà un rendu crédible : eau animée, quais, pontons, bâtiments méditerranéens, végétation, bateaux, éclairage jour/nuit et caméra immersive. La géométrie est structurée pour être remplacée progressivement par les données SIG/IGN et l'inventaire réel des luminaires sans refaire l'application.

**Important :** ce dépôt distingue explicitement les éléments visuels de démonstration et les données vérifiées. Tant que l'inventaire 2026 du port n'est pas fourni, les points lumineux sont des objets de simulation et ne doivent pas être présentés comme un relevé exhaustif actuel.

## Stack

- React + TypeScript + Vite
- Three.js
- React Three Fiber
- Drei
- Zustand

## Lancer le projet

```bash
npm install
npm run dev
```

## Sources de calibration à intégrer

- Inventaire général du patrimoine PACA — Port de Porquerolles : https://dossiersinventaire.maregionsud.fr/dossier/IA83001869
- Parc national de Port-Cros : https://www.portcros-parcnational.fr/
- Étude ANPCEN sur la qualité de la nuit à Porquerolles : https://www.anpcen.fr/docs/20170405100607_ot3s9z_doc210.pdf

## Feuille de route

1. V1 immersive procédurale et interactive.
2. Recalage SIG : emprises réelles, relief, quais, routes et pontons.
3. Reconstruction des bâtiments visibles à partir de photos/vidéos de référence.
4. Digitalisation puis remplacement des luminaires historiques par l'inventaire 2026 du port.
5. Connexion WebSocket/HTTP au backend NOCTURA.
6. Synchronisation ESP32/WS2812B pour la maquette physique.
