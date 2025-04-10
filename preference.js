// This section handles the user's file type preference.

// Display an alert box to ask the user for their preferred file type.
let userPreference = prompt("Please select your preferred file type (e.g., 'jpeg', 'png'):");

// Function to save the selected file type to local storage.
function saveFilePreference() {
  if (userPreference) {
    localStorage.setItem('fileTypePreference', userPreference);
    console.log("User's file preference has been saved in local storage");
  } else {
    console.log("No file preference selected.");
  }
}

// Get the file preference from local storage.
function getFilePreference() {
    // this function get the preference from the local storage.
    return localStorage.getItem('fileTypePreference');
  }

// Save the file preference to local storage.
saveFilePreference();
