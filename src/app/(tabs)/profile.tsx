import Constants from 'expo-constants'

import { getProfile, setBodyweight, setDefaultRest } from '@/db/queries'
import { useData } from '@/hooks/useData'
import { t } from '@/i18n'
import { formatNumber, parseDecimal } from '@/lib/format'
import { Card, Heading, Muted, SavedField, Screen, SectionLabel, Stepper } from '@/ui'

export default function ProfileScreen() {
  const { data, reload, db } = useData(getProfile)

  if (!data) return <Screen>{null}</Screen>
  const weightText = data.bodyweightKg != null ? formatNumber(data.bodyweightKg) : ''

  async function saveWeight(text: string) {
    const kg = parseDecimal(text)
    await setBodyweight(db, kg && kg > 0 ? kg : null)
    await reload()
    return kg && kg > 0 ? formatNumber(kg) : ''
  }

  return (
    <Screen>
      <SectionLabel>{t('profile.bodyweight')}</SectionLabel>
      <SavedField
        key={weightText}
        initial={weightText}
        onSave={saveWeight}
        keyboardType="decimal-pad"
        placeholder="75"
        style={{ fontSize: 22, fontWeight: '700' }}
      />
      <Muted>{t('profile.bodyweightHelp')}</Muted>

      <SectionLabel>{t('profile.defaultRest')}</SectionLabel>
      <Card>
        <Stepper
          value={data.defaultRestS}
          min={15}
          max={600}
          step={15}
          format={v => `${v} s`}
          onChange={async v => {
            await setDefaultRest(db, v)
            await reload()
          }}
        />
      </Card>
      <Muted>{t('profile.defaultRestHelp')}</Muted>

      <SectionLabel>{t('profile.about')}</SectionLabel>
      <Card>
        <Heading>Entrena</Heading>
        <Muted>{t('profile.aboutBody')}</Muted>
        <Muted>{t('profile.version', { version: Constants.expoConfig?.version ?? '?' })}</Muted>
      </Card>
    </Screen>
  )
}
