let currentIndex = 0;

function moveCarousel(direction) {
  const carouselInner = document.querySelector('.carousel-inner');
  const images = carouselInner.querySelectorAll('img');
  const totalImages = images.length;

  currentIndex += direction;

  if (currentIndex >= totalImages) {
    currentIndex = 0;
  } else if (currentIndex < 0) {
    currentIndex = totalImages - 1;
  }

  const offset = -currentIndex * 600; 
  carouselInner.style.transform = `translateX(${offset}px)`;
}


function toggleBio(bioId) {
    const bioElement = document.getElementById(bioId);
    if (bioElement.style.display === "none" || bioElement.style.display === "") {
      bioElement.style.display = "block";
    } else {
      bioElement.style.display = "none";
    }
  }
  
// Toggle the Contact Us Drawer
function toggleDrawer() {
  const drawer = document.getElementById('contact-drawer');
  drawer.classList.toggle('open');
}

// Handle email sending
function sendEmail(event) {
  event.preventDefault(); // Prevent form from reloading the page

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;

  // Email sending logic (using a mailto link)
  const mailtoLink = `mailto:picchu.contact.us@gmail.com?subject=Message from ${name}&body=From: ${name} (${email})%0A%0A${message}`;
  window.location.href = mailtoLink;

  // Close the drawer
  toggleDrawer();

  // Optionally reset the form
  document.getElementById('contact-form').reset();
}
