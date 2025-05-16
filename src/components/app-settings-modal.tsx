import { Modal, ModalContent } from '@heroui/modal'
import { Tabs, Tab } from '@heroui/tabs'
import { Button } from '@heroui/button'

import { checkAppUpdates } from '@/utils/check-app-update'

type AppSettingsModalProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export default function AppSettingsModal({ isOpen, onOpenChange }: AppSettingsModalProps) {
  return (
    <Modal className="dark" isOpen={isOpen} size="3xl" onOpenChange={onOpenChange}>
      <ModalContent>
        <p className="text-muted-foreground absolute left-8 top-6 text-xl">
          Paramètres du launcher
        </p>

        <Tabs
          fullWidth
          isVertical
          aria-label="Settings"
          classNames={{
            tabWrapper: 'text-foreground size-full h-[500px]',
            base: 'px-4 py-6 w-[280px]',
            panel: 'p-6 w-full flex-1 bg-default',
            tabList: 'mt-12',
            tab: 'justify-start',
            tabContent: '',
          }}
          variant="light"
        >
          <Tab key="general" title="Général">
            <p className="text-lg font-semibold">Général</p>

            <div className="mt-4 size-full overflow-y-auto">
              <p className="text-foreground">Try Update Launcher</p>
              <Button onPress={() => checkAppUpdates(true)}>Vérifier les mises à jour</Button>
              <div>{/* Langue du client */}</div>
              <div>{/* Paramètre de démarrage */}</div>
              <div>{/* Fermer le client */}</div>
            </div>
          </Tab>

          <Tab key="download" title="Téléchargement">
            <p className="text-lg font-semibold">Téléchargement</p>

            <div className="mt-4 size-full overflow-y-auto">
              <p>{/* Vitesse de téléchargement : illimité / limité */}</p>
            </div>
          </Tab>

          <Tab key="notifications" title="Notifications">
            <p className="text-lg font-semibold">Notifications</p>

            <div className="mt-4 size-full overflow-y-auto">
              <p>{/* Autoriser les notifications sur le bureau */}</p>
            </div>
          </Tab>

          <Tab key="legal" title="Légal">
            <p className="text-lg font-semibold">Légal</p>

            <div className="mt-4 size-full overflow-y-auto">
              <p>{/* Accord utilisateurs */}</p>
              <p>{/* Politique de confidentialité */}</p>
            </div>
          </Tab>
        </Tabs>
      </ModalContent>
    </Modal>
  )
}
