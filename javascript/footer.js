function showPopup(message) {
    const popup = document.getElementById("popup");
    popup.textContent = message;
    popup.classList.add("show");
    setTimeout(() => popup.classList.remove("show"), 3000);
}
function toggleDrawer() {
    const drawer = document.getElementById('contact-drawer');
    const isOpen = drawer.classList.toggle('open');
    drawer.setAttribute('aria-expanded', isOpen);
}
        

// Handle email sending
function sendEmail(event) {
    event.preventDefault(); // Prevent form from reloading the page

    const name = document.getElementById('name').value;
    const email = document.getElementById('contactEmail').value; // Updated to match unique ID
    const message = document.getElementById('message').value;

    // Check for empty fields and show a popup if any field is empty
    if (!name || !email || !message) {
        showPopup('Please fill in all fields before sending.');
        return;
    }

    // Email sending logic using a mailto link
    const mailtoLink = `mailto:picchu.contact.us@gmail.com?subject=Message from ${name}&body=From: ${name} (${email})%0A%0A${message}`;
    window.location.href = mailtoLink;

    // Close the drawer after sending the email
    toggleDrawer();

    // Reset the form
    document.getElementById('contact-form').reset();

    // Show a success popup
    showPopup('Message sent successfully!');
}

// Utility function for displaying popups
function showPopup(message) {
    const popup = document.getElementById('popup');
    popup.textContent = message;
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 3000); // Auto-hide popup after 3 seconds
}

// Add event listener for the "Send" button in the contact form
document.getElementById('contact-form').addEventListener('submit', sendEmail);

        
