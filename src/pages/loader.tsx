import { Spinner } from '@heroui/react'

type Props = {
  message: string
}

export const Loader: React.FC<Props> = ({ message }) => {
  return (
    <div className="flex size-full">
      <Spinner className="m-auto" />

      <p className="text-muted-foreground absolute bottom-4 left-6">{message}</p>
    </div>
  )
}
