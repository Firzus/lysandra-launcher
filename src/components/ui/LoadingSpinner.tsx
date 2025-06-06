import { memo } from 'react'
import { Spinner } from '@heroui/react'

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const LoadingSpinnerComponent: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Chargement...',
  className = '',
}) => {
  return (
    <div className={`flex h-full w-full items-center justify-center ${className}`}>
      <Spinner label={label} size={size} />
    </div>
  )
}

export const LoadingSpinner = memo(LoadingSpinnerComponent)
LoadingSpinner.displayName = 'LoadingSpinner'
