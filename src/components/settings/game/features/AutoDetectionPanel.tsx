import React, { useState } from 'react'
import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { Progress } from '@heroui/progress'
import { Badge } from '@heroui/badge'
import { Tooltip } from '@heroui/tooltip'
import { LuSearch, LuCheck, LuX, LuFolderOpen, LuInfo, LuHardDrive } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import {
    searchGameByName,
    validateGameInstallation,
    formatLauncherName,
    getConfidenceColor,
    getLauncherIcon,
    formatDirectorySize,
    getInstallationStats,
    groupInstallationsByLauncher,
} from '../../../../utils/game-auto-detection'
import type { GameInstallation, ValidationResult } from '../../../../types/game-detection'

type Props = {
    gameNameToSearch?: string
    onInstallationSelected: (path: string, executable?: string) => void
    isSearching?: boolean
}

export const AutoDetectionPanel: React.FC<Props> = ({
    gameNameToSearch = 'Lysandra',
    onInstallationSelected,
    isSearching: isExternalSearching = false,
}) => {
    const { t } = useTranslation()

    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<GameInstallation[]>([])
    const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map())
    const [validatingPaths, setValidatingPaths] = useState<Set<string>>(new Set())
    const [searchError, setSearchError] = useState<string | null>(null)
    const [searchStats, setSearchStats] = useState<ReturnType<typeof getInstallationStats> | null>(null)
    const [hasSearched, setHasSearched] = useState(false)

    const handleAutoSearch = async () => {
        try {
            setIsSearching(true)
            setSearchError(null)
            setSearchResults([])
            setValidationResults(new Map())
            setSearchStats(null)
            setHasSearched(false)

            console.log('🔍 Starting auto-detection for:', gameNameToSearch)

            // Minimum de 1.5 secondes pour l'animation
            const searchPromise = searchGameByName(gameNameToSearch)
            const minimumDelayPromise = new Promise(resolve => setTimeout(resolve, 1500))

            const [installations] = await Promise.all([searchPromise, minimumDelayPromise])

            console.log(`✅ Found ${installations.length} potential installations`)
            setSearchResults(installations)
            setHasSearched(true)

            // Calculer les statistiques
            const stats = getInstallationStats(installations)
            setSearchStats(stats)

            // Valider automatiquement les meilleures installations
            if (installations.length > 0) {
                await validateTopInstallations(installations.slice(0, 3)) // Valider les 3 meilleures
            }
        } catch (error) {
            console.error('❌ Auto-detection failed:', error)
            setSearchError(error instanceof Error ? error.message : 'Unknown error')
            setHasSearched(true)
        } finally {
            setIsSearching(false)
        }
    }

    const validateTopInstallations = async (installations: GameInstallation[]) => {
        for (const installation of installations) {
            await validateSingleInstallation(installation.path)
        }
    }

    const validateSingleInstallation = async (path: string) => {
        try {
            setValidatingPaths(prev => new Set(prev).add(path))

            const result = await validateGameInstallation(path)

            setValidationResults(prev => new Map(prev).set(path, result))
        } catch (error) {
            console.error(`❌ Validation failed for ${path}:`, error)

            // Créer un résultat d'erreur
            setValidationResults(prev => new Map(prev).set(path, {
                is_valid: false,
                executable_exists: false,
                path_accessible: false,
                is_game_directory: false,
            }))
        } finally {
            setValidatingPaths(prev => {
                const newSet = new Set(prev)
                newSet.delete(path)
                return newSet
            })
        }
    }

    const handleSelectInstallation = (installation: GameInstallation) => {
        const validation = validationResults.get(installation.path)
        const executable = validation?.suggested_executable || installation.executable

        console.log('✅ Selected installation:', installation.path, 'executable:', executable)
        onInstallationSelected(installation.path, executable)
    }

    const getInstallationStatusIcon = (installation: GameInstallation) => {
        const isValidating = validatingPaths.has(installation.path)
        const validation = validationResults.get(installation.path)

        if (isValidating) {
            return <Progress size="sm" isIndeterminate className="w-4" />
        }

        if (validation) {
            return validation.is_valid ? (
                <LuCheck className="text-success" size={16} />
            ) : (
                <LuX className="text-danger" size={16} />
            )
        }

        return null
    }

    const getInstallationStatusText = (installation: GameInstallation) => {
        const isValidating = validatingPaths.has(installation.path)
        const validation = validationResults.get(installation.path)

        if (isValidating) {
            return t('game.install_modal.validation_in_progress')
        }

        if (validation) {
            return validation.is_valid
                ? t('game.install_modal.validation_success')
                : t('game.install_modal.validation_failed')
        }

        return null
    }

    const getCurrentSearchState = () => {
        return isSearching || isExternalSearching
    }

    // Grouper les résultats par launcher pour un affichage organisé
    const groupedResults = groupInstallationsByLauncher(searchResults)

    return (
        <div className="space-y-4">
            {/* En-tête de recherche automatique */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-medium">
                            {t('game.install_modal.auto_search')}
                        </h4>
                        <p className="text-muted-foreground text-xs">
                            {t('game.install_modal.auto_search_desc')}
                        </p>
                    </div>

                    <Button
                        color="primary"
                        size="sm"
                        startContent={<LuSearch size={16} />}
                        onPress={handleAutoSearch}
                        isLoading={getCurrentSearchState()}
                        isDisabled={getCurrentSearchState()}
                    >
                        {getCurrentSearchState()
                            ? t('game.install_modal.auto_search_progress')
                            : t('game.install_modal.auto_search_button')
                        }
                    </Button>
                </div>
            </div>

            {/* Barre de progression pendant la recherche */}
            {getCurrentSearchState() && (
                <Progress
                    size="sm"
                    isIndeterminate
                    label={t('game.install_modal.auto_search_progress')}
                    className="w-full"
                />
            )}

            {/* Statistiques de recherche */}
            {searchStats && searchResults.length > 0 && (
                <Card className="bg-primary-50 border-primary-200">
                    <CardBody className="py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LuInfo className="text-primary" size={16} />
                                <span className="text-sm font-medium text-primary">
                                    {t('game.install_modal.search_stats')}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-primary">
                                <span>{t('game.install_modal.total_found', { count: searchStats.total })}</span>
                                <span>{t('game.install_modal.high_confidence', { count: searchStats.highConfidenceCount })}</span>
                                <span>{t('game.install_modal.avg_confidence', { score: Math.round(searchStats.averageConfidence) })}</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Résultats de recherche ou message d'absence */}
            {hasSearched && searchResults.length === 0 && !searchError && (
                <Card className="border-warning-200 bg-warning-50">
                    <CardBody className="py-3">
                        <div className="flex items-center gap-2">
                            <LuInfo className="text-warning-600" size={16} />
                            <span className="text-sm text-warning-800">
                                {t('game.install_modal.auto_search_no_results')}
                            </span>
                        </div>
                        <p className="text-xs text-warning-700 mt-1">
                            {t('game.install_modal.auto_search_tip')}
                        </p>
                    </CardBody>
                </Card>
            )}

            {/* Erreur de recherche */}
            {searchError && (
                <Card className="border-danger-200 bg-danger-50">
                    <CardBody className="py-3">
                        <div className="flex items-center gap-2">
                            <LuX className="text-danger-600" size={16} />
                            <span className="text-sm text-danger-800">
                                {t('game.install_modal.auto_search_error')}: {searchError}
                            </span>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Résultats de recherche groupés par launcher */}
            {Object.keys(groupedResults).length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium">
                            {t('game.install_modal.auto_search_results', { count: searchResults.length })}
                        </h5>
                    </div>

                    {Object.entries(groupedResults).map(([launcher, installations]) => (
                        <div key={launcher} className="space-y-2">
                            {/* En-tête du launcher */}
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{getLauncherIcon(launcher)}</span>
                                <span className="text-sm font-medium">{launcher}</span>
                                <Badge size="sm" variant="flat" color="default">
                                    {installations.length}
                                </Badge>
                            </div>

                            {/* Liste des installations pour ce launcher */}
                            <div className="space-y-2 max-h-60 overflow-y-auto pl-6">
                                {installations.map((installation) => (
                                    <Card
                                        key={installation.path}
                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                        isPressable
                                        onPress={() => handleSelectInstallation(installation)}
                                    >
                                        <CardBody className="py-3">
                                            <div className="space-y-2">
                                                {/* Ligne principale avec nom et statut */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <LuFolderOpen size={16} className="text-default-500 flex-shrink-0" />
                                                        <span className="text-sm font-medium truncate">
                                                            {installation.metadata.folder_name || 'Dossier'}
                                                        </span>
                                                        {getInstallationStatusIcon(installation)}
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Chip
                                                            size="sm"
                                                            color={getConfidenceColor(installation.confidence)}
                                                            variant="flat"
                                                        >
                                                            {t('game.install_modal.confidence_score', { score: installation.confidence })}
                                                        </Chip>
                                                    </div>
                                                </div>

                                                {/* Informations détaillées */}
                                                <div className="space-y-1 text-xs text-muted-foreground">
                                                    <div className="flex items-center justify-between">
                                                        <Tooltip content={installation.path}>
                                                            <span className="truncate flex-1 cursor-help">
                                                                {installation.path}
                                                            </span>
                                                        </Tooltip>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span>
                                                            {t('game.install_modal.launcher_detected', {
                                                                launcher: formatLauncherName(installation.launcher)
                                                            })}
                                                        </span>

                                                        {/* Affichage de la taille du dossier si disponible */}
                                                        {installation.metadata.directory_size && (
                                                            <div className="flex items-center gap-1">
                                                                <LuHardDrive size={12} />
                                                                <span>
                                                                    {formatDirectorySize(parseInt(installation.metadata.directory_size))}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Exécutable suggéré */}
                                                    {validationResults.get(installation.path)?.suggested_executable && (
                                                        <div className="pt-1">
                                                            <span className="text-primary">
                                                                {t('game.install_modal.suggested_executable', {
                                                                    executable: validationResults.get(installation.path)?.suggested_executable
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Statut de validation */}
                                                    {getInstallationStatusText(installation) && (
                                                        <div className="pt-1">
                                                            <span className={
                                                                validationResults.get(installation.path)?.is_valid
                                                                    ? 'text-success'
                                                                    : 'text-danger'
                                                            }>
                                                                {getInstallationStatusText(installation)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
} 