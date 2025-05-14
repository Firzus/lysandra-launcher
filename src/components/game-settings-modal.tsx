import { Modal, ModalContent } from '@heroui/modal'
import { Tabs, Tab } from '@heroui/tabs'

type AppSettingsModalProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export default function GameSettingsModal({ isOpen, onOpenChange }: AppSettingsModalProps) {
  return (
    <Modal className="dark" isOpen={isOpen} size="3xl" onOpenChange={onOpenChange}>
      <ModalContent>
        <p className="text-muted-foreground absolute left-8 top-6 text-xl">Paramètres du jeu</p>

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
          <Tab key="infos" title="Informations">
            <p className="text-lg font-semibold">Informations</p>

            <div className="mt-4 size-full overflow-y-auto">
              <div>{/* Taille */}</div>
              <div>{/* Répertoire */}</div>
              <div>{/* Vérifier les mises à jour */}</div>
              <div>{/* Réparer */}</div>
              <div>{/* Localiser le jeu */}</div>
              <div>{/* Désinstaller */}</div>
            </div>
          </Tab>

          <Tab key="logs" title="Journaux">
            <p className="text-lg font-semibold">Journaux</p>

            <div className="mt-4 size-full overflow-y-auto">
              <p>{/* logs */}</p>
            </div>
          </Tab>
        </Tabs>
      </ModalContent>
    </Modal>
  )
}
