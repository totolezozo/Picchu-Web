// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBp1Dx56HjQ7FJ3n5YBkvPlJCDz9glBwPQ",
    authDomain: "picchulast.firebaseapp.com",
    projectId: "picchulast",
    storageBucket: "picchulast.appspot.com",
    messagingSenderId: "72745263315",
    appId: "1:72745263315:web:289d6df35320f788adf426",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener("DOMContentLoaded", function() {
    // Check if the user is logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is logged in, display their information 
            const username = user.username || user.email;
            document.getElementById("username").textContent = username;
        } else {
            // No user is logged in, redirect to login page
            window.location.href = "../html/login.html";
        }
    });

    // Initialize Mapbox
    mapboxgl.accessToken = 'pk.eyJ1IjoibnVveGlzIiwiYSI6ImNtMXkxMWM0dDE2cnIya3BvZHB0d2Y0ajMifQ.9CA6tK6WViRrbOluCy2CJg';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [2.34907, 48.85207], // Default center (Paris)
        zoom: 13
    });

    // Center the map on user's location if available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userCoords = [position.coords.longitude, position.coords.latitude];
                map.setCenter(userCoords);
            },
            (error) => console.error("Geolocation error:", error.message)
        );
    }

    // Logout functionality
    document.getElementById("logoutBtn").addEventListener("click", () => {
        auth.signOut().then(() => {
            window.location.href = "index.html"; // Redirect to login page after logout
        }).catch((error) => {
            console.error("Logout error:", error.message);
        });
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const messagesDrawer = document.getElementById("messagesDrawer");
    const plusDrawer = document.getElementById("plusDrawer");
    const accountDrawer = document.getElementById("accountDrawer");
    let openDrawer = null;

    document.getElementById("messagesBtn").addEventListener("click", () => {
        window.location.href = "messages.html";
    });

    document.getElementById("plusBtn").addEventListener("click", () => {
        const plusDrawer = document.getElementById("plusDrawer");
        plusDrawer.classList.toggle("open"); // Toggle the open class to show/hide the drawer
    });

    document.getElementById("accountBtn").addEventListener("click", () => {
        window.location.href = "account.html";
    });

    document.getElementById("homeBtn").addEventListener("click", () => {
        if (openDrawer) {
            openDrawer.style.display = "none";
            openDrawer = null;
        } else {
            alert("Functionality in development");
        }
    });

    function toggleDrawer(drawer) {
        if (openDrawer && openDrawer !== drawer) {
            openDrawer.style.display = "none";
        }

        if (drawer.style.display === "none" || drawer.style.display === "") {
            drawer.style.display = "block";
            openDrawer = drawer;
        } else {
            drawer.style.display = "none";
            openDrawer = null;
        }
    }
});

document.querySelectorAll('.toolbar-btn .icon').forEach((icon) => {
    icon.addEventListener('mouseover', function () {
        this.src = this.getAttribute('data-hover');
    });

    icon.addEventListener('mouseout', function () {
        this.src = this.getAttribute('data-default');
    });
});

// Function to search users by username in Firebase
function searchUsers(query) {
    const searchResults = document.getElementById("searchResults");
    searchResults.innerHTML = ""; // Clear previous results

    if (query.trim() === "") return; // Exit if query is empty

    // Query Firebase users collection by username
    const usersRef = firebase.firestore().collection("users");
    usersRef.where("username", ">=", query).where("username", "<=", query + "\uf8ff")
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                searchResults.innerHTML = "<p>No users found</p>";
                return;
            }

            snapshot.forEach(doc => {
                const user = doc.data();
                const resultItem = document.createElement("div");
                resultItem.classList.add("search-result");

                // Profile picture and username
                const profileImg = document.createElement("img");
                profileImg.src = user.profilePictureURL || "../Drawable/profile-hard.png";
                const username = document.createElement("span");
                username.textContent = user.username;

                // Make resultItem clickable, passing email as a parameter in the URL
                resultItem.style.cursor = "pointer";
                resultItem.addEventListener("click", () => {
                    // Redirect to friend's profile page with email as a parameter
                    window.location.href = `friend_profile.html?email=${encodeURIComponent(user.email)}`;
                });

                resultItem.appendChild(profileImg);
                resultItem.appendChild(username);
                searchResults.appendChild(resultItem);
            });
        })
        .catch(error => {
            console.error("Error searching users:", error);
        });
}

// Event listener for search input
document.getElementById("userSearchInput").addEventListener("input", (event) => {
    const query = event.target.value;
    searchUsers(query);
});
