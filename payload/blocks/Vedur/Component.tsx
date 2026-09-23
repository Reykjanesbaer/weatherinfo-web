'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import type { VedurBlock } from '@/payload-types'

const WIDGET_ORIGIN = 'https://reykjanesbaer.github.io'
const WIDGET_URL = `${WIDGET_ORIGIN}/weatherinfo-web/widget/`

/** Sjálfgefin heimildarstærð í widget.css — sendum hana ekki með að óþörfu. */
const DEFAULT_CREDIT_SIZE = 10.5

/** Byrjunarhæð svo síðan hoppi sem minnst áður en græjan tilkynnir sína hæð. */
const INITIAL_HEIGHT: Record<string, number> = {
  mini: 120,
  compact: 240,
  full: 340,
}

function estimateHeight(utgafa: string, klukkustundir: string): number {
  const base = INITIAL_HEIGHT[utgafa] ?? INITIAL_HEIGHT.compact
  return base + (klukkustundir !== '0' ? 90 : 0)
}

function margins(jofnun: string): Pick<React.CSSProperties, 'marginLeft' | 'marginRight'> {
  if (jofnun === 'center') return { marginLeft: 'auto', marginRight: 'auto' }
  if (jofnun === 'right') return { marginLeft: 'auto', marginRight: 0 }
  return { marginLeft: 0, marginRight: 'auto' }
}

/*
 * Athugið: embed.js er vísvitandi EKKI notuð hér. Skriftur sem React setur
 * inn í gegnum dangerouslySetInnerHTML keyra ekki, og jafnvel þótt þær
 * gerðu það er document.currentScript null þegar skriftan er sett inn
 * eftir á — embed.js myndi þá ekki finna staðinn til að setja iframe-inn á.
 * Þess vegna er iframe-inn búinn til beint og hæðarskilaboðin meðhöndluð hér.
 */
export const VedurComponent: React.FC<VedurBlock> = ({
  stadur = 'reykjanesbaer',
  utgafa = 'compact',
  dagar = 3,
  klukkustundir = '0',
  jofnun = 'left',
  solargangur,
  gegnsaer,
  heimildStaerd,
  hlekkur,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(() =>
    estimateHeight(utgafa ?? 'compact', klukkustundir ?? '0'),
  )

  /*
   * React 19 skilar auðkennum á borð við «r0» úr useId(). Þau lifa ekki af
   * ferðina gegnum query-streng og postMessage, svo við hreinsum allt nema
   * bókstafi, tölur, undirstrik og bandstrik.
   */
  const rawId = useId()
  const frameId = `vedur-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`

  const params = new URLSearchParams()
  params.set('stadur', stadur ?? 'reykjanesbaer')
  params.set('view', utgafa ?? 'compact')
  /* Vefur Reykjanesbæjar er ljós — festum þemað svo kortið fylgi honum. */
  params.set('theme', 'light')
  params.set('frameId', frameId)
  if (utgafa === 'full' && dagar) params.set('days', String(dagar))
  if (klukkustundir && klukkustundir !== '0') params.set('hours', klukkustundir)
  if (solargangur) params.set('sun', '1')
  if (gegnsaer) params.set('bg', 'transparent')
  if (heimildStaerd && heimildStaerd !== DEFAULT_CREDIT_SIZE) {
    params.set('creditSize', String(heimildStaerd))
  }
  if (hlekkur) params.set('link', hlekkur)

  const src = `${WIDGET_URL}?${params.toString()}`

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      /* Tökum aðeins við skilaboðum frá græjunni sjálfri */
      if (event.origin !== WIDGET_ORIGIN) return
      if (event.source !== iframeRef.current?.contentWindow) return

      const data = event.data
      if (!data || data.type !== 'weatherinfo:height' || data.id !== frameId) return

      const h = parseInt(data.height, 10)
      if (Number.isFinite(h) && h > 0 && h < 2000) setHeight(h)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [frameId])

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title="Veður"
      loading="lazy"
      scrolling="no"
      style={{
        display: 'block',
        width: '100%',
        maxWidth: 420,
        height,
        border: 0,
        overflow: 'hidden',
        ...margins(jofnun ?? 'left'),
      }}
    />
  )
}

export default VedurComponent
