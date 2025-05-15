import { useState, useEffect } from 'react'
import { Alert } from '@heroui/alert'
import { Button } from '@heroui/button'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

interface UpdateStatus {
  isChecking: boolean
  isAvailable: boolean
  isDownloading: boolean
  isReady: boolean
  version: string | null
  error: string | null
}

export function UpdateBanner() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    isChecking: false,
    isAvailable: false,
    isDownloading: false,
    isReady: false,
    version: null,
    error: null,
  })
  const [isVisible, setIsVisible] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const checkForUpdates = async () => {
    try {
      setUpdateStatus((prev) => ({ ...prev, isChecking: true, error: null }))

      const update = await check()

      if (update) {
        setUpdateStatus({
          isChecking: false,
          isAvailable: true,
          isDownloading: false,
          isReady: false,
          version: update.version,
          error: null,
        })
        setIsVisible(true)
      } else {
        setUpdateStatus({
          isChecking: false,
          isAvailable: false,
          isDownloading: false,
          isReady: false,
          version: null,
          error: null,
        })
        setIsVisible(false)
      }
    } catch (error) {
      setUpdateStatus({
        isChecking: false,
        isAvailable: false,
        isDownloading: false,
        isReady: false,
        version: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  const downloadAndInstallUpdate = async () => {
    try {
      setUpdateStatus((prev) => ({ ...prev, isDownloading: true }))
      setDownloadProgress(0)

      const update = await check()

      if (update) {
        let totalBytes = 0
        let downloadedBytes = 0

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              totalBytes = event.data.contentLength || 0
              break
            case 'Progress':
              downloadedBytes += event.data.chunkLength || 0
              if (totalBytes > 0) {
                const progress = Math.min((downloadedBytes / totalBytes) * 100, 100)
                setDownloadProgress(progress)
              }
              break
            case 'Finished':
              setDownloadProgress(100)
              setUpdateStatus((prev) => ({ ...prev, isDownloading: false, isReady: true }))
              break
          }
        })
      }
    } catch (error) {
      setUpdateStatus((prev) => ({
        ...prev,
        isDownloading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }

  const restartApp = async () => {
    await relaunch()
  }

  useEffect(() => {
    // Check for updates when the component mounts
    checkForUpdates()

    // Set up a periodic check for updates (every hour)
    const intervalId = setInterval(checkForUpdates, 60 * 60 * 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  if (updateStatus.error) {
    return (
      <Alert color="danger" isVisible={isVisible} onVisibleChange={setIsVisible} isClosable>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium">Error checking for updates</h4>
          <p className="text-xs">{updateStatus.error}</p>
        </div>
      </Alert>
    )
  }
  if (updateStatus.isAvailable && !updateStatus.isDownloading && !updateStatus.isReady) {
    return (
      <Alert
        color="primary"
        isVisible={isVisible}
        onVisibleChange={setIsVisible}
        isClosable
        endContent={
          <Button
            color="primary"
            size="sm"
            onClick={downloadAndInstallUpdate}
            isLoading={updateStatus.isChecking}
          >
            Update
          </Button>
        }
      >
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium">Update Available</h4>
          <p className="text-xs">Version {updateStatus.version} is available for download.</p>
        </div>
      </Alert>
    )
  }
  if (updateStatus.isDownloading) {
    return (
      <Alert color="warning" isVisible={true} isClosable={false}>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium">Downloading Update</h4>
          <p className="text-xs">Please wait while the update is downloading...</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-warning-100">
            <div
              className="h-full bg-warning-500 transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p className="text-right text-xs">{downloadProgress.toFixed(0)}%</p>
        </div>
      </Alert>
    )
  }

  if (updateStatus.isReady) {
    return (
      <Alert
        color="success"
        isVisible={true}
        isClosable={false}
        endContent={
          <Button color="primary" size="sm" onClick={restartApp}>
            Restart Now
          </Button>
        }
      >
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium">Update Ready</h4>
          <p className="text-xs">
            The update has been downloaded. Restart the application to apply it.
          </p>
        </div>
      </Alert>
    )
  }

  return null
}
