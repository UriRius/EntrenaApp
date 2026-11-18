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

Normalment no cal: els canvis arriben sols (vegeu *Actualitzacions*). Només cal un APK
nou quan canvia la part nativa.

## Actualitzacions (sense APK nou)

L'app porta [EAS Update](https://docs.expo.dev/eas-update/introduction/): el codi
JavaScript (pantalles, textos, càlculs, migracions) s'actualitza sol.

1. Es fa `git push` a `master`.
2. GitHub Actions ([update.yml](.github/workflows/update.yml)) passa `npm run check` i,
   si tot és correcte, publica l'actualització al canal `production`.
3. En obrir l'app, el mòbil la baixa en segon pla. **S'aplica la vegada següent que
   s'obre.** Sense cobertura, l'app funciona igual amb l'última versió que tingui.

**Quan cal un APK nou:** llibreria nativa nova, permisos, plugins o icona a `app.json`,
o pujar d'SDK. Ho detecta l'empremta (`runtimeVersion: fingerprint`): l'APK vell
simplement no rep les actualitzacions que ja no són compatibles. Fes un APK nou i
torna a quedar al dia.

Publicar a mà (sense passar per GitHub):

```bash
npx eas-cli@latest update --channel production --environment production --platform android --message "què canvia"
```

Tornar a l'actualització anterior si una surt malament:

```bash
npx eas-cli@latest update:rollback --platform android   # republica la versió d'abans
```

Configuració d'un sol cop: el secret `EXPO_TOKEN` a GitHub (Settings › Secrets and
variables › Actions), amb un token creat a expo.dev › Account settings › Access tokens.
Sense el secret, GitHub comprova el codi però no publica res.

## Desenvolupament

```bash
npm run check          # typecheck + lint + tests
npm test               # tests de src/lib (Vitest)
npm run web            # versió web, només per a proves visuals
npm run fetch-catalog  # torna a descarregar el catàleg d'ExerciseDB
```
