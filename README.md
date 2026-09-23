# weatherinfo-web

Lítil, innfellanleg veðurgræja fyrir vef Reykjanesbæjar. Engin byggingarskref,
engir pakkar, enginn API-lykill — bara statískar skrár sem hægt er að hýsa á
GitHub Pages og fella inn hvar sem er, þar á meðal í Payload CMS.

**Forskoðun og kóðasmiður:** <https://reykjanesbaer.github.io/weatherinfo-web/>

---

## Innfelling í Payload CMS

### 1. Með iframe (mælt með)

Öruggasta leiðin. Virkar alls staðar þar sem HTML er leyft og krefst ekki
`<script>`. Límdu þetta í HTML-reit eða `Code`/`HTML` blokk í Payload:

```html
<iframe
  src="https://reykjanesbaer.github.io/weatherinfo-web/widget/?stadur=reykjanesbaer"
  title="Veður"
  loading="lazy"
  scrolling="no"
  style="width:100%;max-width:420px;height:240px;border:0;display:block;margin-left:0;margin-right:auto">
</iframe>
```

Spássíurnar ráða staðsetningunni á síðunni: `margin-left:0;margin-right:auto`
setur kortið vinstra megin, `margin-left:auto;margin-right:auto` í miðju og
`margin-left:auto;margin-right:0` hægra megin. Auto-spássíur yfirskrifa miðjun
sem kemur úr umlykjandi gámi, bæði með `text-align` og flex.

Hæðin er fast gildi hér, svo veldu hana eftir útgáfu:

| Útgáfa | Dæmigerð hæð |
| --- | --- |
| `view=mini` | `120px` |
| `view=compact` (sjálfgefið) | `240px` |
| `view=full&days=3` | `340px` |
| `view=full&days=3&sun=1` | `395px` |
| `hours=12` (bætist við) | `+90px` |

### 2. Með skriftu (sjálfvirk hæð)

Ef Payload-uppsetningin leyfir `<script>` stillir þessi útgáfa hæðina sjálf
eftir innihaldi — ekkert autt svæði og ekkert afklippt:

```html
<script
  src="https://reykjanesbaer.github.io/weatherinfo-web/embed.js"
  data-stadur="reykjanesbaer"
  data-view="full"
  data-days="3"
  data-align="left"
  data-max-width="420px">
</script>
```

Allar `data-*` færibreytur samsvara færibreytunum í töflunni hér að neðan
(`data-stadur` → `?stadur=`, `data-credit-size` → `?creditSize=`).

Tvær eru undantekning: **`data-align`** (`left`, `center`, `right` —
sjálfgefið `left`) og **`data-max-width`** eru ekki sendar áfram á græjuna,
heldur stýra þær aðeins iframe-inum sjálfum — staðsetningu hans á síðunni og
hámarksbreidd.

> **Ath.** Margar Payload-uppsetningar hreinsa `<script>` úr ritlinum
> (`lexical`/`slate` sanitizing). Ef skriftan skilar engu skaltu nota
> iframe-leiðina — hún gefur sömu útkomu, bara með fastri hæð.

### 3. Sem eigin Payload-blokk

Ef þið viljið gefa ritstjórum val í stað þess að líma HTML er tilbúin blokk í
[`payload/`](payload/) — afritið möppuna inn í verkefnið og fylgið
[`payload/README.md`](payload/README.md). Í stuttu máli lítur hún svona út:

```ts
// blocks/Vedur.ts
import type { Block } from 'payload'

export const Vedur: Block = {
  slug: 'vedur',
  labels: { singular: 'Veður', plural: 'Veður' },
  fields: [
    {
      name: 'stadur',
      type: 'select',
      label: 'Staður',
      defaultValue: 'reykjanesbaer',
      options: [
        { label: 'Reykjanesbær', value: 'reykjanesbaer' },
        { label: 'Njarðvík', value: 'njardvik' },
        { label: 'Ásbrú', value: 'asbru' },
        { label: 'Hafnir', value: 'hafnir' },
        { label: 'Garður', value: 'gardur' },
        { label: 'Sandgerði', value: 'sandgerdi' },
        { label: 'Vogar', value: 'vogar' },
        { label: 'Grindavík', value: 'grindavik' },
        { label: 'Keflavíkurflugvöllur', value: 'keflavikurflugvollur' },
        { label: 'Bláa lónið', value: 'blaalonid' },
      ],
    },
    {
      name: 'utgafa',
      type: 'select',
      label: 'Útgáfa',
      defaultValue: 'compact',
      options: [
        { label: 'Lítil', value: 'mini' },
        { label: 'Venjuleg', value: 'compact' },
        { label: 'Með spá', value: 'full' },
      ],
    },
    { name: 'gegnsaer', type: 'checkbox', label: 'Gegnsær bakgrunnur' },
  ],
}
```

Og samsvarandi React-íhlutur í framendanum:

```tsx
const HEIGHTS = { mini: 120, compact: 240, full: 340 } as const

export function Vedur({ stadur, utgafa = 'compact', gegnsaer }: Props) {
  const q = new URLSearchParams({ stadur, view: utgafa })
  if (gegnsaer) q.set('bg', 'transparent')

  return (
    <iframe
      src={`https://reykjanesbaer.github.io/weatherinfo-web/widget/?${q}`}
      title="Veður"
      loading="lazy"
      scrolling="no"
      style={{
        width: '100%', maxWidth: 420, border: 0,
        display: 'block', height: HEIGHTS[utgafa],
      }}
    />
  )
}
```

---

## Stillingar

Allar stillingar eru færibreytur í slóðinni.

| Færibreyta | Gildi | Sjálfgefið | Lýsing |
| --- | --- | --- | --- |
| `stadur` | lykill (sjá neðar) | `reykjanesbaer` | Forstilltur staður |
| `lat`, `lon` | tölur | — | Eigin hnit; hafa forgang á `stadur` |
| `name` | texti | heiti staðar | Yfirskrift efst á kortinu |
| `view` | `mini`, `compact`, `full` | `compact` | Stærð og umfang |
| `days` | `0`–`7` | `3` í `full`, annars `0` | Fjöldi spádaga |
| `hours` | `0`–`24` | `0` | Klukkustundaspá |
| `details` | `0`, `1` | `1` | Vindur, raki, úrkoma, hitatilfinning |
| `sun` | `0`, `1` | `0` | Sólarupprás og sólsetur |
| `theme` | `auto`, `light`, `dark` | `auto` | Litaþema |
| `lang` | `is`, `en` | `is` | Tungumál |
| `accent` | hex án `#` | `0b6fb8` | Áherslulitur |
| `radius` | `0`–`99` | `14` | Hornarúnnun í px |
| `bg` | `transparent` | — | Fellir kortið inn í síðuna |
| `credit` | `0`, `1` | `1` | Heimild í fæti |
| `creditSize` | `9`–`16` | `10.5` | Leturstærð heimildar í px (9–16, sjálfgefið 10.5). |
| `refresh` | `5`–`180` | `15` | Endurnýjun í mínútum |
| `link` | slóð | — | Gerir kortið smellanlegt |

### Staðir

`reykjanesbaer`, `keflavik`, `njardvik`, `innrinjardvik`, `asbru`, `hafnir`,
`gardur`, `sandgerdi`, `vogar`, `grindavik`, `keflavikurflugvollur`,
`blaalonid`, `reykjanesviti`, `reykjavik`

Nýjum stöðum er bætt við í `PLACES` í [`widget/config.js`](widget/config.js).

### Dæmi

```
widget/?view=mini&stadur=grindavik
widget/?view=full&days=5&sun=1
widget/?bg=transparent&credit=0&accent=c2410c
widget/?lat=63.99&lon=-22.60&name=Flugstöðin&lang=en
```

---

## Veðurgögn

Gögnin koma frá [Open-Meteo](https://open-meteo.com/) — ókeypis fyrir
opinbera notkun, enginn API-lykill, og með CORS-hausum svo hægt sé að kalla
beint úr vafra notandans. Ekkert bakendakerfi þarf því að vera til staðar.

**Af hverju ekki Veðurstofan?** XML-þjónusta Veðurstofunnar
(`xmlweather.vedur.is`) sendir ekki CORS-hausa, svo vafrinn hafnar kalli frá
annarri slóð. Til að nota hana þyrfti milliþjón (serverless-fall eða
Payload-endapunkt) sem sækir XML-ið og skilar því áfram sem JSON. Gagnalagið
í [`widget/widget.js`](widget/widget.js) er afmarkað í föllunum `buildUrl`
og `fetchWeather`, svo skipti yfir í slíkan milliþjón snerta ekki teikninguna.

Gögn frá Open-Meteo eru birt undir CC BY 4.0. Heimildin í fæti kortsins
uppfyllir það skilyrði — slökkvið aðeins á henni (`credit=0`) ef heimildin
kemur fram annars staðar á síðunni.

---

## Uppbygging

```
index.html          Forskoðun og kóðasmiður fyrir ritstjóra
embed.js            Innfellingarskrifta með sjálfvirkri hæð
widget/
  index.html        Sjálf græjan (það sem iframe vísar á)
  widget.css        Útlit, þemu og viðbrögð við þröngu plássi
  widget.js         Gagnasókn og teikning
  config.js         Staðir, veðurkóðar, þýðingar
  icons.js          SVG-veðuríkon
payload/            Tilbúin Payload 3 blokk (afritast inn í vefverkefnið)
  blocks/Vedur/config.ts
  blocks/Vedur/Component.tsx
.github/workflows/
  deploy.yml        Sjálfvirk birting á GitHub Pages
```

Engin dependencies, ekkert build. Til að keyra staðbundið dugar hvaða
statíski þjónn sem er:

```bash
npx http-server . -p 8080
# opnaðu http://127.0.0.1:8080/
```

### Hýsing

`deploy.yml` birtir `main` á GitHub Pages sjálfkrafa. Til að virkja þetta í
fyrsta sinn: **Settings → Pages → Source → GitHub Actions**.

Græjan er líka hægt að hýsa annars staðar — það er ekkert sem bindur hana við
GitHub Pages. Afritið bara skrárnar og uppfærið slóðirnar í
innfellingarkóðanum.

### Aðgengi

Kortið er merkt sem svæði (`role="region"`) og er með faldri
textasamantekt fyrir skjálesara
(t.d. „Reykjanesbær: Skúrir, 6 stig, vindur suðvestan 11 m/s (kaldi)“), notar
íslenskan tugastaf og virðir `prefers-reduced-motion` og `prefers-color-scheme`.
