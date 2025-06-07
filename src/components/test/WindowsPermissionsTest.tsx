import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Button, Card, CardBody, CardHeader, Chip, Divider } from '@heroui/react'
import { ScrollArea } from '@/components/ui/scroll-area'

type TestResult = {
  function: string
  status: 'idle' | 'loading' | 'success' | 'error'
  result?: any
  error?: string
  timestamp?: string
}

export function WindowsPermissionsTest() {
  const [results, setResults] = useState<TestResult[]>([])

  const updateResult = (
    functionName: string,
    status: TestResult['status'],
    result?: any,
    error?: string,
  ) => {
    setResults((prev) => {
      const existing = prev.find((r) => r.function === functionName)
      const newResult: TestResult = {
        function: functionName,
        status,
        result,
        error,
        timestamp: new Date().toLocaleTimeString(),
      }

      if (existing) {
        return prev.map((r) => (r.function === functionName ? newResult : r))
      } else {
        return [...prev, newResult]
      }
    })
  }

  const testFunction = async (functionName: string, params?: any) => {
    updateResult(functionName, 'loading')
    try {
      const result = await invoke(functionName, params)
      updateResult(functionName, 'success', result)
    } catch (error) {
      updateResult(functionName, 'error', null, String(error))
    }
  }

  const clearResults = () => {
    setResults([])
  }

  const testAll = async () => {
    const tests = [
      // Permissions Windows disponibles
      { name: 'get_windows_permission_status' },
      { name: 'is_running_as_admin' },
      { name: 'is_uac_enabled' },
      { name: 'can_update_application' },

      // Paths & System
      { name: 'get_app_data_dir' },
      { name: 'get_huzstudio_root_path' },
      { name: 'get_games_directory' },
      { name: 'get_config_directory' },

      // Operations tests
      { name: 'requires_elevation', params: { operation: 'install_game' } },
      { name: 'can_perform_operation', params: { operation: 'write_config' } },

      // Version & Update info
      { name: 'read_version_file' },
      { name: 'is_elevated_update_mode' },
    ]

    for (const test of tests) {
      await testFunction(test.name, test.params)
      // Petit délai entre les tests
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return 'warning'
      case 'success':
        return 'success'
      case 'error':
        return 'danger'
      default:
        return 'default'
    }
  }

  return (
    <Card className="mx-auto flex max-h-[90vh] w-full max-w-6xl flex-col">
      <CardHeader className="flex flex-shrink-0 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Windows Permissions & System Test</h1>
          <p className="text-default-500 text-sm">
            Test des fonctions de permissions Windows et système
          </p>
        </div>
        <div className="flex gap-2">
          <Button onPress={testAll} color="primary">
            Test All
          </Button>
          <Button onPress={clearResults} variant="bordered">
            Clear Results
          </Button>
        </div>
      </CardHeader>

      <CardBody className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Panel des boutons de test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Individual Tests</h3>

            <div className="space-y-2">
              <h4 className="text-default-500 text-sm font-medium">Windows Permissions</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onPress={() => testFunction('get_windows_permission_status')}
                  variant="bordered"
                  size="sm"
                >
                  Get Permission Status
                </Button>
                <Button
                  onPress={() => testFunction('is_running_as_admin')}
                  variant="bordered"
                  size="sm"
                >
                  Check Admin Privileges
                </Button>
                <Button onPress={() => testFunction('is_uac_enabled')} variant="bordered" size="sm">
                  Check UAC Status
                </Button>
                <Button
                  onPress={() => testFunction('can_update_application')}
                  variant="bordered"
                  size="sm"
                >
                  Can Update Application
                </Button>
              </div>
            </div>

            <Divider />

            <div className="space-y-2">
              <h4 className="text-default-500 text-sm font-medium">System Paths</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onPress={() => testFunction('get_app_data_dir')}
                  variant="bordered"
                  size="sm"
                >
                  Get App Data Dir
                </Button>
                <Button
                  onPress={() => testFunction('get_huzstudio_root_path')}
                  variant="bordered"
                  size="sm"
                >
                  Get HuzStudio Root
                </Button>
                <Button
                  onPress={() => testFunction('get_games_directory')}
                  variant="bordered"
                  size="sm"
                >
                  Get Games Directory
                </Button>
                <Button
                  onPress={() => testFunction('get_config_directory')}
                  variant="bordered"
                  size="sm"
                >
                  Get Config Directory
                </Button>
              </div>
            </div>

            <Divider />

            <div className="space-y-2">
              <h4 className="text-default-500 text-sm font-medium">Operation Tests</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onPress={() => testFunction('requires_elevation', { operation: 'install_game' })}
                  variant="bordered"
                  size="sm"
                >
                  Requires Elevation (install_game)
                </Button>
                <Button
                  onPress={() =>
                    testFunction('can_perform_operation', { operation: 'write_config' })
                  }
                  variant="bordered"
                  size="sm"
                >
                  Can Perform Operation (write_config)
                </Button>
                <Button
                  onPress={() =>
                    testFunction('requires_elevation', { operation: 'system_registry' })
                  }
                  variant="bordered"
                  size="sm"
                >
                  Requires Elevation (registry)
                </Button>
              </div>
            </div>

            <Divider />

            <div className="space-y-2">
              <h4 className="text-default-500 text-sm font-medium">Version & Update Info</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onPress={() => testFunction('read_version_file')}
                  variant="bordered"
                  size="sm"
                >
                  Read Version File
                </Button>
                <Button
                  onPress={() =>
                    testFunction('fetch_manifest_from_github', {
                      url: 'https://huz-studio-api.up.railway.app/api/v1/manifests/launcher',
                    })
                  }
                  variant="bordered"
                  size="sm"
                >
                  Fetch External Manifest
                </Button>
                <Button
                  onPress={() => testFunction('is_elevated_update_mode')}
                  variant="bordered"
                  size="sm"
                >
                  Check Elevated Update Mode
                </Button>
              </div>
            </div>

            <Divider />

            <div className="space-y-2">
              <h4 className="text-default-500 text-sm font-medium">Actions (Use with Caution)</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onPress={() =>
                    testFunction('restart_as_admin', {
                      executable_path: 'HuzStudio.exe',
                      arguments: '--test-mode',
                    })
                  }
                  variant="bordered"
                  size="sm"
                  color="warning"
                >
                  ⚠️ Restart as Admin (Test Mode)
                </Button>
              </div>
            </div>
          </div>

          {/* Panel des résultats */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>

            <ScrollArea className="h-[600px] space-y-2">
              {results.length === 0 ? (
                <div className="text-default-400 p-4 text-center">
                  No tests run yet. Click a test button or "Test All" to start.
                </div>
              ) : (
                results.map((result, index) => (
                  <Card key={index} className="mb-3">
                    <CardBody className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <code className="font-mono text-sm">{result.function}</code>
                            <Chip size="sm" color={getStatusColor(result.status)}>
                              {result.status}
                            </Chip>
                            {result.timestamp && (
                              <span className="text-tiny text-default-400">{result.timestamp}</span>
                            )}
                          </div>

                          {result.status === 'success' && result.result !== undefined && (
                            <div className="mt-2">
                              <div className="text-tiny text-default-500 mb-1">Result:</div>
                              <pre className="text-tiny bg-default-100 max-h-32 overflow-auto rounded p-2">
                                {typeof result.result === 'object'
                                  ? JSON.stringify(result.result, null, 2)
                                  : String(result.result)}
                              </pre>
                            </div>
                          )}

                          {result.status === 'error' && result.error && (
                            <div className="mt-2">
                              <div className="text-tiny text-danger mb-1">Error:</div>
                              <div className="text-tiny bg-danger-50 text-danger rounded p-2">
                                {result.error}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </ScrollArea>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
