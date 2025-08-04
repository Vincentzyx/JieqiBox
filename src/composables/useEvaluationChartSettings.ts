import { ref, watch } from 'vue'
import { useConfigManager } from './useConfigManager'

// Configuration manager
const configManager = useConfigManager()

/**
 * Get initial settings from the config manager
 * @returns {object} - Object containing initial values for evaluation chart settings
 */
const getInitialSettings = () => {
  // Only access in client environment
  if (typeof window === 'undefined') {
    return {
      showMoveLabels: true,
      useLinearYAxis: false,
      showOnlyLines: false,
      blackPerspective: false,
    }
  }

  try {
    const settings = configManager.getEvaluationChartSettings()
    return {
      showMoveLabels: settings.showMoveLabels !== false, // Default to true
      useLinearYAxis: !!settings.useLinearYAxis, // Default to false
      showOnlyLines: !!settings.showOnlyLines, // Default to false
      blackPerspective: !!settings.blackPerspective, // Default to false
      clampToThousand: !!settings.clampToThousand, // Default to false
    }
  } catch (e) {
    console.error('Failed to get evaluation chart settings:', e)
    // Return default values on error
    return {
      showMoveLabels: true,
      useLinearYAxis: false,
      showOnlyLines: false,
      blackPerspective: false,
      clampToThousand: false,
    }
  }
}

// Create reactive references shared across the application
const {
  showMoveLabels: initialShowMoveLabels,
  useLinearYAxis: initialUseLinearYAxis,
  showOnlyLines: initialShowOnlyLines,
  blackPerspective: initialBlackPerspective,
  clampToThousand: initialClampToThousand,
} = getInitialSettings()

const showMoveLabels = ref<boolean>(initialShowMoveLabels)
const useLinearYAxis = ref<boolean>(initialUseLinearYAxis)
const showOnlyLines = ref<boolean>(initialShowOnlyLines)
const blackPerspective = ref<boolean>(initialBlackPerspective)
const clampToThousand = ref<boolean>(initialClampToThousand ?? false)

// Flag to track if config is loaded
const isConfigLoaded = ref(false)

// Watch for changes and persist to config file
watch(
  [showMoveLabels, useLinearYAxis, showOnlyLines, blackPerspective, clampToThousand],
  async ([
    newShowMoveLabels,
    newUseLinearYAxis,
    newShowOnlyLines,
    newBlackPerspective,
    newClampToThousand,
  ]) => {
    // Only save if config is already loaded to avoid overwriting during initialization
    if (!isConfigLoaded.value) return

    const settings = {
      showMoveLabels: newShowMoveLabels,
      useLinearYAxis: newUseLinearYAxis,
      showOnlyLines: newShowOnlyLines,
      blackPerspective: newBlackPerspective,
      clampToThousand: newClampToThousand,
    }

    try {
      await configManager.updateEvaluationChartSettings(settings)
    } catch (error) {
      console.error('Failed to save evaluation chart settings:', error)
    }
  }
)

// Evaluation chart settings composable
export function useEvaluationChartSettings() {
  // Load configuration and update reactive refs
  const loadSettings = async () => {
    try {
      await configManager.loadConfig()
      const settings = configManager.getEvaluationChartSettings()

      // Update reactive refs
      showMoveLabels.value = settings.showMoveLabels !== false
      useLinearYAxis.value = !!settings.useLinearYAxis
      showOnlyLines.value = !!settings.showOnlyLines
      blackPerspective.value = !!settings.blackPerspective
      clampToThousand.value = !!settings.clampToThousand

      isConfigLoaded.value = true
    } catch (error) {
      console.error('Failed to load evaluation chart settings:', error)
      isConfigLoaded.value = true // Still mark as loaded to enable saving
    }
  }

  // Initialize settings on first import
  if (typeof window !== 'undefined') {
    loadSettings()
  }

  return {
    showMoveLabels,
    useLinearYAxis,
    showOnlyLines,
    blackPerspective,
    clampToThousand,
    loadSettings,
  }
}
