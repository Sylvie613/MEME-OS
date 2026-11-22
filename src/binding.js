export const BINDING_KEY = 'meme_os';

export function getBinding() {
    const context = SillyTavern.getContext();
    const characterId = context.characterId;

    if (characterId === undefined || characterId === null) return null;

    const character = context.characters?.[characterId];
    const binding = character?.data?.extensions?.[BINDING_KEY];

    if (!binding || binding.enabled !== true) return null;

    return {
        profile: binding.profile || 'default',
        schemaVersion: Number(binding.schema_version || 1),
        minimumExtensionVersion: String(binding.minimum_extension_version || ''),
        characterName: character?.name || character?.data?.name || '',
    };
}

export function isBoundCharacter() {
    return Boolean(getBinding());
}
