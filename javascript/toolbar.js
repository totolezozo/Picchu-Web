document.addEventListener("DOMContentLoaded", function() {
    // Initialize drawer elements
    const messagesDrawer = document.getElementById("messagesDrawer");
    const plusDrawer = document.getElementById("plusDrawer");
    const accountDrawer = document.getElementById("accountDrawer");
    let openDrawer = null;

    // Event listeners for toolbar buttons
    document.getElementById("messagesBtn").addEventListener("click", () => {
        toggleDrawer(messagesDrawer);
    });

    document.getElementById("plusBtn").addEventListener("click", () => {
        toggleDrawer(plusDrawer);
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

    // Function to toggle drawer visibility
    function toggleDrawer(drawer) {
        if (openDrawer && openDrawer !== drawer) {
            openDrawer.classList.remove("open");
        }
    
        if (!drawer.classList.contains("open")) {
            drawer.classList.add("open");
            openDrawer = drawer;
        } else {
            drawer.classList.remove("open");
            openDrawer = null;
        }
    }
    

    // Add hover effects to toolbar icons
    document.querySelectorAll('.toolbar-btn .icon').forEach((icon) => {
        icon.addEventListener('mouseover', function () {
            this.src = this.getAttribute('data-hover');
        });

        icon.addEventListener('mouseout', function () {
            this.src = this.getAttribute('data-default');
        });
    });

    // Search functionality
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
                    profileImg.src = user.profilePictureURL || "../Drawable/default-profile.png";
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
    const userSearchInput = document.getElementById("userSearchInput");
    if (userSearchInput) {
        userSearchInput.addEventListener("input", (event) => {
            const query = event.target.value;
            searchUsers(query);
        });
    }
});











document.getElementById("createAccountBtn").addEventListener("click", async () => {
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const username = document.getElementById("username").value;
    const age = parseInt(document.getElementById("age").value);
    const gender = document.querySelector('input[name="gender"]:checked')?.value || '';

    let hasError = false;
    if (!email) {
        document.getElementById("regEmail").classList.add("shake");
        hasError = true;
    }
    if (!password) {
        document.getElementById("regPassword").classList.add("shake");
        hasError = true;
    }
    if (confirmPassword !== password) {
        document.getElementById("confirmPassword").classList.add("shake");
        hasError = true;
    }

    if (hasError) {
        showPopup("Please fill in all fields correctly.");
        setTimeout(() => document.querySelectorAll(".shake").forEach(el => el.classList.remove("shake")), 300);
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Sanitize email to use as Firestore document ID
        //const emailAsId = email.replace(/[.#$\[\]]/g, "");

        // Add the user to Firestore with email as document ID
        await setDoc(doc(db, "users", email), {
            badges: [],
            birthdate: Date.now(),
            collectedLocations: [],
            email: email,
            friendRequests: [],
            friends: [],
            gender: gender,
            isOnline: true,
            isTyping: false,
            name: firstName,
            surname: lastName,
            username: username,
            phoneNumber: "",
            points: 0,
            profilePictureURL: null,
        });

        showPopup("Account created successfully!");
        redirectToMain();
    } catch (error) {
        showPopup("Failed to create account: " + error.message);
    }
});












document.getElementById("createAccountBtn").addEventListener("click", async () => {
    // List of fields to validate
    const fields = [
        { id: "regEmail", value: document.getElementById("regEmail").value },
        { id: "regPassword", value: document.getElementById("regPassword").value },
        { id: "confirmPassword", value: document.getElementById("confirmPassword").value },
        { id: "firstName", value: document.getElementById("firstName").value },
        { id: "lastName", value: document.getElementById("lastName").value },
        { id: "username", value: document.getElementById("username").value },
        { id: "gender", value: document.querySelector('input[name="gender"]:checked')?.value || "" },
    ];

    let hasError = false;

    // Validate fields and add shake animation for empty ones
    fields.forEach((field) => {
        if (!field.value) {
            document.getElementById(field.id).classList.add("shake");
            hasError = true;
        }
    });

    // Check if passwords match
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    if (password !== confirmPassword) {
        document.getElementById("confirmPassword").classList.add("shake");
        hasError = true;
    }

    // Show error popup and remove shake animation
    if (hasError) {
        showPopup("Please fill in all fields correctly.", "error");
        setTimeout(() => {
            document.querySelectorAll(".shake").forEach((el) => el.classList.remove("shake"));
        }, 300);
        return;
    }

    try {
        // Firebase Authentication - Create User
        const email = document.getElementById("regEmail").value;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send verification email
        await sendEmailVerification(user);

        // Add user data to Firestore
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const username = document.getElementById("username").value;
        const gender = document.querySelector('input[name="gender"]:checked')?.value || "";

        await setDoc(doc(db, "users", email), {
            badges: [],
            collectedLocations: [],
            email,
            friendRequests: [],
            friends: [],
            gender,
            isOnline: true,
            isTyping: false,
            name: firstName,
            surname: lastName,
            username,
            phoneNumber: "",
            points: 0,
            profilePictureURL: null,
        });

        // Switch to email verification screen
        document.getElementById("registerForm").classList.remove("active");
        document.getElementById("emailVerification").classList.add("active");

        showPopup("A verification email has been sent. Please check your inbox.", "info");
    } catch (error) {
        showPopup("Error during account creation: " + error.message, "error");
    }
});

