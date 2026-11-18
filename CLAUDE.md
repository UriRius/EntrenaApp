# CLAUDE.md — Entrena

> Document viu. Cada regla porta el seu perquè. S'actualitza en el mateix canvi que el
> codi. Origen: skill app-playbook (lliçons de My Shop Diary), adaptada a una app
> personal sense servidor. Convencions d'Expo: [AGENTS.md](AGENTS.md).

## Descripció
App de gimnàs per a ús personal de l'Oriol (Android). Al gimnàs, entre sèries: obrir la
rutina, veure què va fer l'última vegada, apuntar pes × reps, descansar amb el
temporitzador. Idea completa i decisions: [BRIEF.md](BRIEF.md).

**Visió (v2):** nivells per exercici i mapa de músculs (estil strengthlevel.com). Per
això cada sèrie es guarda neta (pes + reps), cada sessió guarda el pes corporal del dia i
cada exercici manté el vincle amb els músculs del catàleg.

## Stack
| Capa | Tria |
|---|---|
| App | Expo SDK 58 + Expo Router (`src/app/`) + TypeScript estricte, React Compiler |
| Dades | `expo-sqlite`, local. Sense servidor, sense comptes |
| Catàleg | `assets/catalog.json` (ExerciseDB gratuïta, 1.500 exercicis, anglès) |
| GIF | `expo-file-system`: es descarreguen a `documents/gifs/` en afegir l'exercici |
| Temporitzador | `expo-notifications` (notificació local programada) + `expo-haptics` |
| Gràfics | SVG propi (`src/ui/LineChart.tsx`) amb `react-native-svg` |
| Icones | `@expo/vector-icons` (Ionicons) |
| APK | EAS Build, perfil `apk` (`eas.json`) |

## Estructura
```
src/app/        rutes: (tabs)/ index·history·progress·profile, routine/[id], session/[id],
                exercise/[id], pick-exercise
src/lib/        lògica PURA + tests Vitest (cap import de React Native)
src/db/         schema.ts (migracions) · queries.ts (tot l'SQL)
src/catalog/    accés al catàleg i als GIF
src/rest/       temporitzador de descans
src/ui/         components; dialogs.ts (Alert natiu / confirm del navegador)
src/theme/      tokens.ts (colors semàntics, contrast provat)
src/i18n/       ca.ts — tots els textos
scripts/        fetch-catalog.mjs
```

## Regles
- **Migracions**: `src/db/schema.ts`, `PRAGMA user_version`. Una migració publicada no es
  modifica mai: un canvi = una entrada nova al final. Les dades només són al telèfon i no
  hi ha còpia de seguretat: una migració trencada pot fer perdre l'historial real.
- **Additiu sempre**: afegir columnes/taules sí; esborrar-ne o reanomenar-ne, no (l'APK
  instal·lat pot ser vell).
- **Mai perdre una sèrie**: cada canvi d'un camp de la sessió es desa a l'instant.
- **Sèrie comptada = reps > 0.** Els valors suggerits (última vegada) són *placeholders*,
  no dades: només es desen si l'usuari escriu o marca la sèrie com a feta.
- **Pes corporal**: als exercicis `bodyweight`/`weighted` s'apunta només el llast; el
  pes total hi suma el pes corporal guardat a la sessió.
- **Càlculs només a `src/lib/`** (volum, rècords, 1RM, sèries del gràfic, equivalències).
  Cap pantalla recalcula res pel seu compte. Funció nova → test nou.
- **Gràfics honestos**: un punt per sessió real, eix X en temps real, mai zeros
  inventats. El 1RM sempre marcat com a «estimat».
- **Colors**: només tokens de `src/theme/tokens.ts`; el test de contrast ha de passar.
- **Textos**: tots a `src/i18n/ca.ts`.
- **Cada camp té un lector.** Sexe i any de naixement NO es demanen fins que la v2
  (nivells) els llegeixi.
- **Diàlegs**: `confirm`/`inform` de `src/ui/dialogs.ts`, mai `Alert` directe (a web no
  es mostra i les proves visuals es fan al navegador).

## Verificar
- `npm run check` (typecheck + lint + tests) abans de donar res per fet.
- Visual: `npx expo start --web --clear` i captures amb viewport de mòbil. **Sempre
  `--clear`**: el 2026-11-10 un Metro sense netejar va servir codi vell i va amagar una
  correcció de maquetació.
- Real: Expo Go o l'APK al mòbil (notificacions i vibració només es poden provar aquí).

## Treballar amb l'Oriol
- Comunicació i interfície en català.
- Mai `git commit`/`push` sense que ho demani en aquell missatge.
- Decisions obertes: pregunta amb recomanació, no decideixis per ell.
