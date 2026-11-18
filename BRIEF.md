# Brief — Entrena

Data: 2026-11-09 · Estat: **acceptat (2026-11-10)**

## 1. El problema
Apuntar al gimnàs la rutina, els pesos, les sèries i les repeticions de cada
exercici, veure el GIF de l'exercici i saber si progresso, sense dependre de
cap servei extern.

## 2. Usuari 0
- Qui és: l'Oriol, ús personal. Potser algun amic més endavant (no a la v1).
- Telèfon: Android.
- Cada persona té les seves dades al seu telèfon: no hi ha comptes, ni
  servidor, ni dades compartides.

## 3. El moment d'ús
Al gimnàs, entre sèries, amb el mòbil a la mà i poc temps: obrir la rutina del
dia, veure què vaig fer l'última vegada, apuntar la sèrie, descansar amb el
temporitzador i bloquejar el mòbil. A casa, de tant en tant: muntar rutines i
mirar el progrés.

## 4. Les preguntes que l'app respon (v1)
| # | Pregunta (títol de pantalla) | Què faig diferent amb la resposta |
|---|---|---|
| 1 | Què em toca avui i què vaig fer l'última vegada? | Trio el pes de cada sèrie (les sèries es pre-omplen amb l'última vegada) |
| 2 | Quant em queda de descans? | Torno a la sèrie a temps (vibra amb el mòbil bloquejat) |
| 3 | Estic progressant en aquest exercici? | Pujo pes o canvio l'exercici |
| 4 | Quant pes he mogut aquest mes / any / sempre? | Motivació («portes 1.000 kg en press banca: com aixecar 10 neveres») |

## 5. Les dades
| Dada | D'on surt | Tipus | Pregunta |
|---|---|---|---|
| Catàleg d'exercicis (nom, músculs, material, instruccions, URL del GIF) | ExerciseDB gratuïta (1.500 exercicis, en anglès), descarregat un cop i inclòs a l'app | llista tancada | totes |
| Nom propi d'un exercici («Press banca») | l'usuari, opcional | text | 1 |
| GIF de l'exercici | es descarrega i es guarda al telèfon en afegir-lo a una rutina | fitxer | 1 |
| Rutina (nom, exercicis en ordre, nº de sèries previstes) | l'usuari | — | 1 |
| Sessió (rutina, data i hora d'inici i de fi) | automàtic en començar i acabar | — | 1, 4 |
| Sèrie (exercici, pes kg, repeticions) | l'usuari; pre-omplert amb l'última vegada | números | 1, 3, 4 |
| Temps de descans per defecte | ajustos (90 s), modificable per exercici | número | 2 |
| Perfil: sexe, any de naixement, pes corporal | l'usuari, opcional | enum / números | v2 (nivells) i pes corporal dels exercicis sense pes |
| Pes corporal del dia de la sessió | còpia del perfil en començar la sessió (l'històric no canvia si actualitzes el pes) | número | 4 |

Derivat, mai preguntat: pes total mogut (pes × reps), rècords, 1RM estimat,
última vegada.

## 6. El tenant
No n'hi ha: una sola persona per telèfon, sense comptes ni sincronització.

## 7. Fora de la v1 (ordre orientatiu)
1. **Nivells i mapa de músculs** (com strengthlevel.com): nivell per exercici a
   partir del 1RM estimat, pes corporal, sexe i edat; mapa del cos pintat per
   colors. Només els exercicis principals tindran nivell (calen taules
   d'estàndards); els músculs sense dades es veuran en gris.
2. Còpia de seguretat: exportar/importar un fitxer.
3. Exercicis propis (màquines que no són al catàleg, amb foto pròpia).
4. Registre periòdic del pes corporal amb gràfic.
5. Compartir l'app amb amics (APK).

## 8. Plataformes, idiomes, connexió
- **App nativa Android** (Expo + React Native), instal·lada amb un APK, sense
  Play Store. Les correccions arriben per l'app (EAS Update) sense reinstal·lar.
- Interfície en **català** (textos en fitxers de traducció des del primer dia).
  Catàleg en anglès, amb nom propi opcional per a cada exercici.
- **Funciona sense connexió**: només cal connexió per descarregar el GIF d'un
  exercici nou la primera vegada que l'afegeixes a una rutina.
- Notificacions: només la del final del descans (local, sense servidor).

## 9. Model de negoci / 10. Identitat legal
No aplica: ús personal, gratuïta, sense botiga.

## 11. Visió a llarg termini
Nivells i mapa muscular (v2). Per fer-los possibles, des de la v1 es guarda
neta cada sèrie (pes + reps), el pes corporal del dia de cada sessió i el
vincle de cada exercici amb els músculs del catàleg.

## 12. Disseny
Pendent (vegeu les decisions obertes). Per defecte: segueix el mode clar/fosc
del sistema, botons grans per fer-los servir amb una mà i amb suor, números
grans.

## Decisions preses (2026-11-09)
| Decisió | Triat |
|---|---|
| Tipus d'app | Nativa Android (Expo), APK |
| Imatges | ExerciseDB gratuïta; el GIF (180p) es descarrega quan l'exercici s'afegeix a una rutina |
| Idioma | Interfície en català; exercicis en anglès, reanomenables |
| Organització | Rutines plantilla + sessions (es pot afegir o treure un exercici el mateix dia) |
| Sèries | Pes i reps per a cada sèrie |
| v1 | Última vegada + temporitzador de descans + gràfic de progrés + estadístiques curioses |
| Nivells i mapa | v2 |
| Pes corporal | Un valor al perfil; cada sessió en guarda una còpia |
| Còpia de seguretat | No a la v1 (risc acceptat) |

## Criteris per defecte (canviables)
- Unitats: només kg.
- Exercicis de pes corporal (dominades, fons): s'apunta el pes **afegit** (0 per
  defecte). Al pes total mogut hi compta el pes corporal + l'afegit.
- Pes total mogut = Σ (pes × reps) de les sèries fetes, i la pantalla explica
  com es calcula.
- Gràfic de progrés: pes màxim de cada sessió i rècord. El 1RM estimat
  (fórmula d'Epley) es mostra a part i sempre marcat com a «estimat».
- Navegació: 4 pestanyes — **Entrenar**, **Historial**, **Progrés**, **Perfil**.
- El repo ha de ser **privat**: les condicions d'ús de les imatges d'ExerciseDB
  no s'han pogut llegir. Per a ús personal el risc és baix, però el catàleg no
  es pot redistribuir.

## Decisions preses (2026-11-10)
| Decisió | Triat |
|---|---|
| Unitats, pes corporal i pestanyes | Confirmats tal com estan als criteris per defecte |
| Abast | Només el MVP (v1) |
| Estil visual | Fosc (estètica de gimnàs) amb accent llima elèctrica `#C5F04A`; tot a `src/theme/tokens.ts` |
| APK | EAS Build al núvol, perfil `apk` (gratis, sense Android Studio) |
| Perfil a la v1 | Només pes corporal i descans per defecte. Sexe i any de naixement s'afegeixen amb els nivells (v2), quan tinguin una pantalla que els llegeixi |
| Identificador de l'app | `com.oriol.entrena` (no es pot canviar sense perdre les dades instal·lades) |
