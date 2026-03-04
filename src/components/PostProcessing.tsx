/* ====== TrustGen — Post Processing Pipeline ====== */
import React from 'react'
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

    return (
        <EffectComposer multisampling={4}>
            {settings.bloom.enabled && (
                <Bloom
                    intensity={settings.bloom.intensity}
                    luminanceThreshold={settings.bloom.threshold}
                    luminanceSmoothing={0.9}
                    mipmapBlur
                />
            )}
            {settings.ssao.enabled && (
                <SSAO
                    intensity={settings.ssao.intensity * 30}
                    radius={settings.ssao.radius * 0.1}
                    luminanceInfluence={0.6}
                    bias={0.035}
                />
            )}
            {settings.dof.enabled && (
                <DepthOfField
                    focusDistance={settings.dof.focusDistance * 0.01}
                    focalLength={0.05}
                    bokehScale={settings.dof.bokehScale}
                />
            )}
            {settings.vignette.enabled && (
                <Vignette
                    darkness={settings.vignette.darkness}
                    offset={settings.vignette.offset}
                    blendFunction={BlendFunction.NORMAL}
                />
            )}
            {settings.chromaticAberration.enabled && (
                <ChromaticAberration
                    offset={[settings.chromaticAberration.offset, settings.chromaticAberration.offset] as any}
                    blendFunction={BlendFunction.NORMAL}
                />
            )}
            {settings.filmGrain.enabled && (
                <Noise
                    premultiply
                    blendFunction={BlendFunction.ADD}
                    opacity={settings.filmGrain.intensity * 0.3}
                />
            )}
            {settings.colorGrading.enabled && (
                <>
                    <BrightnessContrast
                        brightness={settings.colorGrading.brightness * 0.1}
                        contrast={settings.colorGrading.contrast * 0.1}
                    />
                    <HueSaturation
                        hue={settings.colorGrading.hueShift * Math.PI / 180}
                        saturation={settings.colorGrading.saturation * 0.1}
                    />
                </>
            )}
        </EffectComposer>
    )
}
