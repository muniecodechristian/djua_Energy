# Revue produit — supervision solaire

## Intention
Transformer l’interface en poste de supervision : comprendre le périmètre observé, examiner une anomalie, consulter les résultats disponibles du modèle, préparer une action traçable.

## Problèmes constatés dans le code
- Tableau de bord : alertes, pourcentages de disponibilité et activité fictifs mélangés aux données réelles.
- Alertes : ajout systématique de faux incidents, dates et régions de secours inventées.
- Parc : statut contractuel assimilé à une priorité technique.
- Télémétrie : ancien format plat attendu, alors que le backend expose des objets battery, solar et environment.
- Maintenance : confirmation de transmission sans API ni persistance.
- Diagnostic : événement global de prédiction affiché sans vérifier le kit.
- Navigation : alertes et télémétrie absentes, accès morts Support / Documentation, identité utilisateur fixe.
- Styles : sélecteurs globaux forçant tous les gris au noir/blanc, ombres fortes et marges incohérentes.

## Livré
Navigation Supervision / Exploitation / Gestion ; pages Vue d’ensemble, Parc solaire, Alertes, Télémétrie, Diagnostic IA, Maintenance, Paramètres. Recherche pages/équipements, navigation mobile et réduite, liens de diagnostic et d’intervention contextualisés. Navigation libre conservée.

Surfaces sobres, accents orange, ombres modérées, cartes plus compactes, états hover/focus, thèmes clair/sombre, animations tenant compte du mouvement réduit. Police Geist locale. Chargement des pages à la demande.

Données métier explicites : zéro, indisponibilité et chargement différenciés ; alertes résolues exclues des priorités ; mesures absentes non remplacées par zéro dans les courbes ; prédictions filtrées par identité ; brouillons locaux persistants, sans annonce d’envoi.

## Critères d’accessibilité visés
Structure de titres, labels de champs, liens de navigation, état actif, focus visible, lien d’évitement, dialogue natif pour la recherche, mouvement réduit, états non communiqués uniquement par couleur.
Référence : [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
Il s’agit de critères de conception, pas d’une certification de conformité.

## Limites à traiter avant une mise en production
- Le backend expose les 100 dernières mesures et alertes globales : ce n’est pas un bilan exhaustif du parc. Cette limite est indiquée dans les vues.
- Les résultats IA arrivent par événement : leur historique persistant, la version du modèle, l’explication et la calibration de confiance nécessitent un contrat de données complet.
- Les brouillons de maintenance sont locaux au navigateur. Planification partagée, techniciens, dispatch et historique nécessitent un service backend.
- L’ancienne vue OperationsOverview reste une démonstration explicitement signalée.
- Navigation sans connexion et exemption du limiteur login conservées conformément aux demandes précédentes ; aucune certification de sécurité n’est revendiquée.
- La commande envoyée à un équipement n’est pas une preuve d’exécution.
- La carte dépend des tuiles OpenStreetMap.
- Aucun navigateur pilotable disponible dans cette session : revue visuelle réelle, clavier sur appareils et audit de contraste complet restent à faire.

## Validation
Compilation Vite, lint ciblé et tests des règles métier : sélection de la mesure récente, priorités, données manquantes, coordonnées et isolation des prédictions. Les endpoints locaux /api/telemetry et /api/alerts ont répondu avec succès, sans enregistrements lors de la vérification.

Résultat : 7 tests métier réussis, compilation réussie, contrôle lint ciblé sans erreur. Le bundle principal passe de 1 444,97 ko à 544,70 ko avant compression ; Vite signale encore un chunk supérieur à 500 ko. Les vérifications ne remplacent pas une recette visuelle dans un navigateur.
