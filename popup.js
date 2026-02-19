const DEFAULT_SETTINGS = {
    imageType: 'png',
    saveLocation: '',
    filenameTemplate: '{title}_frame_{time}',
    jpegQuality: 0.92,
    saveAs: false
};

function clampQuality(value) {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return DEFAULT_SETTINGS.jpegQuality;
    return Math.min(1, Math.max(0.1, parsed));
}

async function migrateLegacyLocalStorageSettings() {
    const alreadyMigrated = await chrome.storage.local.get({ settingsMigratedV1: false });
    if (alreadyMigrated.settingsMigratedV1) {
        return;
    }

    const legacyImageType = localStorage.getItem('imageType');
    const legacySaveLocation = localStorage.getItem('saveLocation');

    const nextSettings = {
        settingsMigratedV1: true
    };

    if (legacyImageType && ['png', 'jpeg', 'webp'].includes(legacyImageType)) {
        nextSettings.imageType = legacyImageType;
    }

    if (legacySaveLocation) {
        nextSettings.saveLocation = legacySaveLocation;
    }

    await chrome.storage.local.set(nextSettings);
}

async function saveSettings() {
    const imageTypeInput = document.querySelector('input[name="imageType"]:checked');
    const settings = {
        imageType: imageTypeInput ? imageTypeInput.value : DEFAULT_SETTINGS.imageType,
        saveLocation: document.getElementById('saveLocation').value.trim(),
        filenameTemplate: document.getElementById('filenameTemplate').value.trim() || DEFAULT_SETTINGS.filenameTemplate,
        jpegQuality: clampQuality(document.getElementById('jpegQuality').value),
        saveAs: document.getElementById('saveAs').checked
    };

    await chrome.storage.local.set(settings);
    alert('Settings saved!');
}

async function loadSettings() {
    await migrateLegacyLocalStorageSettings();
    const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);

    const imageTypeRadio = document.querySelector(`input[name="imageType"][value="${settings.imageType}"]`);
    if (imageTypeRadio) {
        imageTypeRadio.checked = true;
    }

    document.getElementById('saveLocation').value = settings.saveLocation;
    document.getElementById('filenameTemplate').value = settings.filenameTemplate;
    document.getElementById('jpegQuality').value = settings.jpegQuality;
    document.getElementById('saveAs').checked = Boolean(settings.saveAs);
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    const saveButton = document.getElementById('saveSettings');
    if (saveButton) {
        saveButton.addEventListener('click', saveSettings);
    }
});
