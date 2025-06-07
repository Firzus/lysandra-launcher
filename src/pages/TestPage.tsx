import { WindowsPermissionsTest } from '@/components/test/WindowsPermissionsTest'

export default function TestPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Tests</h1>
        <p className="text-muted-foreground mt-2">
          Test Windows permissions and system integration features
        </p>
      </div>

      <WindowsPermissionsTest />
    </div>
  )
}
