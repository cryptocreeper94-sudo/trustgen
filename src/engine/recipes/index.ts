/* ====== Prop Recipes — Unified Index ====== */
export type { PropRecipe, PropNode, PrimKind } from '../propTypes'
import { MEDIEVAL_ENV_RECIPES } from './medievalEnvRecipes'
import { WILDWEST_ENV_RECIPES } from './wildwestEnvRecipes'
import { MODERN_ENV_RECIPES } from './modernEnvRecipes'

/** All environment prop recipes (80 total) */
export const ALL_ENV_RECIPES = [
    ...MODERN_ENV_RECIPES,
    ...MEDIEVAL_ENV_RECIPES,
    ...WILDWEST_ENV_RECIPES,
]

/** Look up a recipe by asset ID */
export function getRecipeById(id: string) {
    return ALL_ENV_RECIPES.find(r => r.id === id) ?? null
}

/** Get all recipes for a given era */
export function getRecipesByEra(era: 'modern' | 'medieval' | 'wild-west') {
    return ALL_ENV_RECIPES.filter(r => r.era === era)
}

export { MEDIEVAL_ENV_RECIPES, WILDWEST_ENV_RECIPES, MODERN_ENV_RECIPES }
