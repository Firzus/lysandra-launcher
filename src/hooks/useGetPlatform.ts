export function getPlatform(): 'windows' | 'macos' | 'linux' | 'unknown' {
  const platform = navigator.userAgent.toLowerCase()

  if (platform.includes('win')) return 'windows'
  if (platform.includes('mac')) return 'macos'
  if (platform.includes('linux')) return 'linux'

  return 'unknown'
}
