# Entrena

App personal de gimnàs per a Android: rutines, sèries (pes i repeticions), GIF de cada
exercici, temporitzador de descans, progrés i estadístiques. Les dades viuen només al
telèfon (SQLite); no hi ha servidor ni comptes.

Què fa i per què: [BRIEF.md](BRIEF.md). Regles per treballar-hi: [CLAUDE.md](CLAUDE.md).

## Provar-la al mòbil (sense compilar res)

1. Instal·la **Expo Go** des de la Play Store.
2. A l'ordinador: `npm install` (només la primera vegada) i `npx expo start`.
3. Escaneja el codi QR amb Expo Go (mòbil i ordinador a la mateixa wifi).

## Fer l'APK (gratis, al núvol d'Expo)

Només la primera vegada:

```bash
npx eas-cli@latest login        # compte gratuït a expo.dev
npx eas-cli@latest init         # vincula el projecte al teu compte
```

Cada vegada que vulguis un APK nou:

```bash
npx eas-cli@latest build --platform android --profile apk
```

En acabar (uns 10–20 min a la cua gratuïta) dona un enllaç i un QR per descarregar l'APK.
Obre'l al mòbil i accepta «instal·lar apps d'origen desconegut». Per actualitzar-la,
instal·la l'APK nou a sobre: **les dades es mantenen** (mateix `com.oriol.entrena`).

## Desenvolupament

```bash
npm run check          # typecheck + lint + tests
npm test               # tests de src/lib (Vitest)
npm run web            # versió web, només per a proves visuals
npm run fetch-catalog  # torna a descarregar el catàleg d'ExerciseDB
```
