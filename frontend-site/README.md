# Djua Energy — Site Vitrine (React + TypeScript)

Application vitrine moderne, autonome et indépendante pour Djua Energy, conçue avec React 19, TypeScript, Tailwind CSS et Vite.

## Structure du projet

- `src/` : Code source React TypeScript
  - `components/` : Composants modulaires (`Header`, `Hero`, `TrustMetrics`, `PartnersMarquee`, `EcosystemTabs`, `SupervisionSuite`, `Solutions`, `Pricing`, `Testimonials`, `ControlFeatures`, `Faq`, `Footer`, `PilotModal`)
  - `App.tsx` : Assemblage principal du site
  - `main.tsx` : Point d'entrée React
  - `index.css` : Styles personnalisés, micro-animations, halos et keyframes
- `index.html` : Shell HTML avec configuration Tailwind et typographies Google Fonts (Plus Jakarta Sans & Inter)
- `index.legacy.html` : Sauvegarde de la version HTML statique d'origine

## Démarrage rapide

Installez les dépendances :
```sh
npm install
```

Lancez le serveur de développement en local :
```sh
npm run dev
```

Par défaut, l'application est accessible sur [http://localhost:5174](http://localhost:5174).

## Build de production

Pour valider le typage TypeScript et créer le bundle de production optimisé :
```sh
npm run build
```

Pour prévisualiser le build généré :
```sh
npm run preview
```
