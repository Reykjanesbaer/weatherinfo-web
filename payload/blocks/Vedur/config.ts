import type { Block } from 'payload'

/**
 * Veðurblokk — fellir veðurgræjuna inn á síðu.
 *
 * Græjan sjálf er hýst á GitHub Pages og birtist í iframe, svo hún dregur
 * engar dependencies inn í Payload-verkefnið. Sjá payload/README.md.
 *
 * Staðalyklarnir hér að neðan verða að haldast í takt við PLACES í
 * widget/config.js.
 */
export const Vedur: Block = {
  slug: 'vedur',
  interfaceName: 'VedurBlock',
  labels: {
    singular: 'Veður',
    plural: 'Veður',
  },
  fields: [
    {
      name: 'stadur',
      type: 'select',
      label: 'Staður',
      required: true,
      defaultValue: 'reykjanesbaer',
      options: [
        { label: 'Reykjanesbær', value: 'reykjanesbaer' },
        { label: 'Keflavík', value: 'keflavik' },
        { label: 'Njarðvík', value: 'njardvik' },
        { label: 'Innri-Njarðvík', value: 'innrinjardvik' },
        { label: 'Ásbrú', value: 'asbru' },
        { label: 'Hafnir', value: 'hafnir' },
        { label: 'Garður', value: 'gardur' },
        { label: 'Sandgerði', value: 'sandgerdi' },
        { label: 'Vogar', value: 'vogar' },
        { label: 'Grindavík', value: 'grindavik' },
        { label: 'Keflavíkurflugvöllur', value: 'keflavikurflugvollur' },
        { label: 'Bláa lónið', value: 'blaalonid' },
        { label: 'Reykjanesviti', value: 'reykjanesviti' },
        { label: 'Reykjavík', value: 'reykjavik' },
      ],
    },
    {
      name: 'utgafa',
      type: 'select',
      label: 'Útgáfa',
      required: true,
      defaultValue: 'compact',
      options: [
        { label: 'Lítil', value: 'mini' },
        { label: 'Venjuleg', value: 'compact' },
        { label: 'Með spá', value: 'full' },
      ],
    },
    {
      name: 'dagar',
      type: 'number',
      label: 'Fjöldi spádaga',
      defaultValue: 3,
      min: 1,
      max: 7,
      admin: {
        condition: (_, siblingData) => siblingData?.utgafa === 'full',
        description: 'Aðeins notað í útgáfunni „Með spá“.',
      },
    },
    {
      name: 'klukkustundir',
      type: 'select',
      label: 'Klukkustundaspá',
      defaultValue: '0',
      options: [
        { label: 'Engin', value: '0' },
        { label: 'Næstu 6', value: '6' },
        { label: 'Næstu 12', value: '12' },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.utgafa !== 'mini',
      },
    },
    {
      name: 'jofnun',
      type: 'radio',
      label: 'Staðsetning á síðu',
      defaultValue: 'left',
      options: [
        { label: 'Vinstri', value: 'left' },
        { label: 'Miðja', value: 'center' },
        { label: 'Hægri', value: 'right' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'solargangur',
      type: 'checkbox',
      label: 'Sýna sólarupprás og sólsetur',
      defaultValue: false,
      admin: {
        condition: (_, siblingData) => siblingData?.utgafa !== 'mini',
      },
    },
    {
      name: 'gegnsaer',
      type: 'checkbox',
      label: 'Gegnsær bakgrunnur',
      defaultValue: false,
      admin: {
        description: 'Fellir kortið inn í síðuna — án ramma og skugga.',
      },
    },
    {
      name: 'heimildStaerd',
      type: 'number',
      label: 'Leturstærð á heimild (px)',
      defaultValue: 10.5,
      min: 9,
      max: 16,
      admin: {
        description:
          'Heimildin á Open-Meteo er skilyrði fyrir notkun gagnanna (CC BY 4.0) ' +
          'og verður alltaf sýnileg. Hér má eingöngu stilla stærðina.',
      },
    },
    {
      name: 'hlekkur',
      type: 'text',
      label: 'Hlekkur af kortinu (valfrjálst)',
      admin: {
        description: 'Full slóð, t.d. á ítarlegri veðursíðu.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return true
        return value.startsWith('https://')
          ? true
          : 'Slóðin verður að byrja á https://'
      },
    },
  ],
}
