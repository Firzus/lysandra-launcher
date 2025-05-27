import { memo } from 'react'
import { Button } from '@heroui/button'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { LuTriangle, LuRefreshCw } from 'react-icons/lu'

type ErrorFallbackProps = {
  error?: Error
  resetErrorBoundary?: () => void
}

const ErrorFallbackComponent: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader className="flex items-center gap-3">
          <LuTriangle className="text-danger" size={24} />
          <div>
            <h3 className="text-lg font-semibold">Erreur</h3>
            <p className="text-sm text-default-500">Une erreur est survenue</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {error && (
            <div className="rounded-md bg-danger-50 p-3">
              <p className="text-sm text-danger-700">{error.message}</p>
            </div>
          )}
          {resetErrorBoundary && (
            <Button
              className="w-full"
              color="primary"
              startContent={<LuRefreshCw size={16} />}
              variant="flat"
              onPress={resetErrorBoundary}
            >
              Réessayer
            </Button>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export const ErrorFallback = memo(ErrorFallbackComponent)
ErrorFallback.displayName = 'ErrorFallback'
