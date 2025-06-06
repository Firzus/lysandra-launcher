import { Button, Card, CardBody } from '@heroui/react'

export const StyleTest = () => {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-primary text-2xl font-bold">Test des styles HeroUI + Tailwind V4</h1>

      {/* Test Tailwind classes de base */}
      <div className="rounded-lg bg-blue-500 p-4 text-white">
        Tailwind classes de base fonctionnent
      </div>

      {/* Test classes HeroUI theme */}
      <div className="bg-background text-foreground border-divider rounded-lg border p-4">
        Classes theme HeroUI fonctionnent
      </div>

      {/* Test composants HeroUI */}
      <Card className="max-w-sm">
        <CardBody>
          <p>Composant Card HeroUI</p>
          <Button color="primary" variant="solid">
            Bouton HeroUI
          </Button>
        </CardBody>
      </Card>

      {/* Test dark mode */}
      <div className="rounded bg-gray-100 p-4 dark:bg-gray-800 dark:text-white">
        Test dark mode (ajoutez class 'dark' au parent pour tester)
      </div>
    </div>
  )
}
