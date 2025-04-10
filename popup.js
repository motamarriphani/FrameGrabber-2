// Function to save settings to local storage
function saveSettings() {
    // Get the selected image type
    const imageType = document.querySelector('input[name="imageType"]:checked').value;
    // Get the save location
    const saveLocation = document.getElementById('saveLocation').value;

    // Save to local storage
    localStorage.setItem('imageType', imageType);
    localStorage.setItem('saveLocation', saveLocation);

    // Alert the user that settings have been saved
    alert('Settings saved!');
}

// Function to load settings from local storage
function loadSettings() {
    // Get the image type from local storage
    const imageType = localStorage.getItem('imageType');
    // Get the save location from local storage
    const saveLocation = localStorage.getItem('saveLocation');

    // Update the form fields if settings are found
    if (imageType) {
        document.querySelector(`input[name="imageType"][value="${imageType}"]`).checked = true;
    }
    if (saveLocation) {
        document.getElementById('saveLocation').value = saveLocation;
    }
}

// Event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load the saved settings
    loadSettings();

    // Add event listener for the "Save Settings" button
    const saveButton = document.getElementById('saveButton');
    saveButton.addEventListener('click', saveSettings);
});