/* ====== TrustGen — Post Processing Pipeline ====== */
import {
    EffectComposer, Bloom, Noise, Vignette,
    ChromaticAberration, SSAO, DepthOfField,
    BrightnessContrast, HueSaturation
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import type { PostProcessingState } from '../types'

interface Props {
    settings: PostProcessingState
}

export function PostProcessingPipeline({ settings }: Props) {
    const hasAny =
        settings.bloom.enabled || settings.ssao.enabled || settings.dof.enabled ||
        settings.vignette.enabled || settings.filmGrain.enabled ||
        settings.chromaticAberration.enabled || settings.colorGrading.enabled

    if (!hasAny) return null

    // Build effects array to avoid conditional JSX children type issues
    const effects: React.JSX.Element[] = []

    if (settings.bloom.enabled) {
        effects.push(
            <Bloom key="bloom"
                intensity={settings.bloom.intensity}
                luminanceThreshold={settings.bloom.threshold}
                luminanceSmoothing={0.9}
                mipmapBlur
            />
        )
    }
    if (settings.ssao.enabled) {
        effects.push(
            <SSAO key="ssao"
                intensity={settings.ssao.intensity * 30}
                radius={settings.ssao.radius * 0.1}
                luminanceInfluence={0.6}
                bias={0.035}
            />
        )
    }
    if (settings.dof.enabled) {
        effects.push(
            <DepthOfField key="dof"
                focusDistance={settings.dof.focusDistance * 0.01}
                focalLength={0.05}
                bokehScale={settings.dof.bokehScale}
            />
        )
    }
    if (settings.vignette.enabled) {
        effects.push(
            <Vignette key="vignette"
                darkness={settings.vignette.darkness}
                offset={settings.vignette.offset}
                blendFunction={BlendFunction.NORMAL}
            />
        )
    }
    if (settings.chromaticAberration.enabled) {
        effects.push(
            <ChromaticAberration key="ca"
                offset={[settings.chromaticAberration.offset, settings.chromaticAberration.offset] as any}
                blendFunction={BlendFunction.NORMAL}
            />
        )
    }
    if (settings.filmGrain.enabled) {
        effects.push(
            <Noise key="noise"
                premultiply
                blendFunction={BlendFunction.ADD}
                opacity={settings.filmGrain.intensity * 0.3}
            />
        )
    }
    if (settings.colorGrading.enabled) {
        effects.push(
            <BrightnessContrast key="bc"
                brightness={settings.colorGrading.brightness * 0.1}
                contrast={settings.colorGrading.contrast * 0.1}
            />
        )
        effects.push(
            <HueSaturation key="hs"
                hue={settings.colorGrading.hueShift * Math.PI / 180}
                saturation={settings.colorGrading.saturation * 0.1}
            />
        )
    }

    return (
        <EffectComposer multisampling={4}>
            {effects}
        </EffectComposer>
    )
}
