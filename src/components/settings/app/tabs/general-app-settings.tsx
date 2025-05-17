import { Card, CardBody } from '@heroui/card'

import { CheckUpdateButton } from '@/components/settings/app/features/check-update-button'

export const GeneralAppSettings: React.FC = () => {
  return (
    <>
      {/* Actualiser */}
      <p className="text-muted-foreground mb-2">Actualiser le launcher</p>

      <Card shadow="none">
        <CardBody className="flex-row justify-between">
          <p>Vérifiez si une nouvelle version du launcher est disponible.</p>
          <CheckUpdateButton className="ml-6" />
        </CardBody>
      </Card>

      <div>{/* Langue du client */}</div>
      <div>{/* Paramètre de démarrage */}</div>
      <div>{/* Fermer le client */}</div>
    </>
  )
}
