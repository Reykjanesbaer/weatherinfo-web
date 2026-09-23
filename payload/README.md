# Veðurblokk fyrir Payload 3

Blokk sem lætur ritstjóra setja veðurgræjuna inn á síðu án þess að líma HTML.
Græjan sjálf er hýst á GitHub Pages og birtist í iframe, svo hér bætast engar
dependencies við verkefnið — bara tvær skrár.

```
payload/blocks/Vedur/
  config.ts       Skilgreining blokkarinnar (svið sem ritstjóri fyllir út)
  Component.tsx   Framendinn sem teiknar iframe-inn
```

## Uppsetning

### 1. Afritaðu möppuna

Settu `blocks/Vedur/` inn í verkefnið þar sem aðrar blokkir eru, t.d.
`src/blocks/Vedur/`.

### 2. Bættu blokkinni við `layout` á Pages

```ts
// src/collections/Pages/index.ts
import { Vedur } from '../../blocks/Vedur/config'

export const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        // … blokkirnar sem fyrir eru
        Vedur,
      ],
    },
  ],
}
```

### 3. Skráðu íhlutinn í `RenderBlocks.tsx`

```tsx
// src/blocks/RenderBlocks.tsx
import { VedurComponent } from '@/blocks/Vedur/Component'

const blockComponents = {
  // … það sem fyrir er
  vedur: VedurComponent,
}
```

Lykillinn `vedur` verður að vera sá sami og `slug` í `config.ts`.

### 4. Búðu til týpur

```bash
pnpm payload generate:types
```

Þetta býr til `VedurBlock` í `payload-types.ts` (nafnið kemur úr
`interfaceName`), sem `Component.tsx` flytur inn.

### 5. Migration — aðeins ef Postgres er undir

Postgres-adapterinn býr til töflur fyrir nýjar blokkir, svo breytingin þarf
migration:

```bash
pnpm payload migrate:create vedur_block
pnpm payload migrate
```

MongoDB þarf ekkert af þessu.

## CSP

Ef framendinn keyrir með `Content-Security-Policy` þarf að hleypa græjunni í
gegn, annars birtist tómur rammi:

```
frame-src https://reykjanesbaer.github.io;
```

## Hvað ritstjóri stillir

| Svið | Lýsing |
| --- | --- |
| Staður | Einn af forstilltu stöðunum á Suðurnesjum |
| Útgáfa | Lítil, Venjuleg eða Með spá |
| Fjöldi spádaga | 1–7, birtist aðeins í útgáfunni „Með spá“ |
| Klukkustundaspá | Engin, 6 eða 12 — falið í „Lítil“ |
| Staðsetning á síðu | Vinstri, miðja eða hægri |
| Sólarupprás og sólsetur | Bætir sólargangi við smáatriðin |
| Gegnsær bakgrunnur | Fellir kortið inn í síðuna, án ramma og skugga |
| Leturstærð á heimild | 9–16 px, sjálfgefið 10.5 |
| Hlekkur af kortinu | Valfrjáls slóð, verður að byrja á `https://` |

Heimildin á Open-Meteo er **ekki** stillanleg í burtu: gögnin eru birt undir
CC BY 4.0 og tilvísunin er skilyrði fyrir notkun þeirra. Ritstjóri getur breytt
leturstærðinni en ekki falið hana.

## Af hverju ekki `embed.js`?

Skriftan `embed.js` í rót verkefnisins gerir sama gagn á venjulegum vefsíðum,
en hún virkar ekki inni í React:

- Skriftur sem React setur inn (t.d. gegnum `dangerouslySetInnerHTML`) eru
  ekki keyrðar af vafranum.
- `document.currentScript` er `null` þegar skrifta er sett inn eftir á, svo
  `embed.js` fyndi ekki staðinn til að setja iframe-inn á.

`Component.tsx` býr því til iframe-inn beint og hlustar sjálfur á
hæðarskilaboðin frá græjunni.

## Öryggi

`Component.tsx` tekur aðeins við `postMessage` sem uppfyllir allt eftirfarandi:

- `event.origin` er `https://reykjanesbaer.github.io`
- `event.source` er `contentWindow` þessa tiltekna iframe
- `data.type === 'weatherinfo:height'`
- `data.id` er `frameId` þessa íhlutar
- hæðin er tala á bilinu 0–2000

Þannig getur hvorki önnur síða né annar rammi á sömu síðu breytt hæðinni.
