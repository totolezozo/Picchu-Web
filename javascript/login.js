import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    Timestamp,
} from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";


// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBp1Dx56HjQ7FJ3n5YBkvPlJCDz9glBwPQ",
    authDomain: "picchulast.firebaseapp.com",
    projectId: "picchulast",
    storageBucket: "picchulast.appspot.com",
    messagingSenderId: "72745263315",
    appId: "1:72745263315:web:289d6df35320f788adf426",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// Utility Functions
function showPopup(message, type = "info") {
    const popup = document.getElementById("popup");
    popup.textContent = message;

    // Remove any previous class and add the appropriate one
    popup.classList.remove("info", "error", "show");
    popup.classList.add(type, "show");

    setTimeout(() => {
        popup.classList.remove("show");
    }, 3000);
}
function redirectToMain(userId) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const lastLocalizationKnown = `${latitude},${longitude}`;

                try {
                    const userDocRef = doc(db, "users", userId); // Reference Firestore document by UID
                    await updateDoc(userDocRef, { lastLocalizationKnown });
                    console.log("Location updated successfully:", lastLocalizationKnown);

                    window.location.href = "main.html"; // Redirect to main
                } catch (error) {
                    console.error("Error updating location:", error.message);
                    window.location.href = "main.html"; // Redirect even if update fails
                }
            },
            (error) => {
                console.error("Geolocation error:", error.message);
                window.location.href = "main.html";
            }
        );
    } else {
        console.warn("Geolocation is not supported by this browser.");
        window.location.href = "main.html";
    }
}
// Mapbox Configuration and User Location Setup
document.addEventListener("DOMContentLoaded", function () {
    mapboxgl.accessToken = "pk.eyJ1IjoibnVveGlzIiwiYSI6ImNtMXkxMWM0dDE2cnIya3BvZHB0d2Y0ajMifQ.9CA6tK6WViRrbOluCy2CJg";

    const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11",
        center: [2.34907, 48.85207],
        zoom: 13,
        pitch: 45,
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => map.setCenter([position.coords.longitude, position.coords.latitude]),
            (error) => console.error("Geolocation error:", error.message)
        );
    } else {
        console.warn("Geolocation is not supported by this browser.");
    }
    
});

async function getCountryAndRegion() {
    if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by this browser.");
        return { country: "Unknown Country", region: "Unknown Region" };
    }

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const accessToken = "pk.eyJ1IjoibnVveGlzIiwiYSI6ImNtMXkxMWM0dDE2cnIya3BvZHB0d2Y0ajMifQ.9CA6tK6WViRrbOluCy2CJg"; // Replace with your Mapbox token
                const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}`;

                try {
                    const response = await fetch(geocodingUrl);
                    const data = await response.json();

                    const features = data.features || [];
                    const country = features.find((f) => f.place_type.includes("country"))?.text || "Unknown Country";
                    const region = features.find((f) => f.place_type.includes("region"))?.text || "Unknown Region";

                    resolve({ country, region });
                } catch (error) {
                    console.error("Error fetching location details:", error.message);
                    resolve({ country: "Unknown Country", region: "Unknown Region" });
                }
            },
            (error) => {
                console.error("Geolocation error:", error.message);
                resolve({ country: "Unknown Country", region: "Unknown Region" });
            }
        );
    });
}
// Form Toggling
document.getElementById("showRegister").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("loginForm").classList.remove("active");
    document.getElementById("registerForm").classList.add("active");
});

document.getElementById("showLogin").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("registerForm").classList.remove("active");
    document.getElementById("loginForm").classList.add("active");
});

document.getElementById("loginBtn").addEventListener("click", async () => {
    const input = document.getElementById("email").value; // Pseudo or email
    const password = document.getElementById("password").value;

    if (!input || !password) {
        showPopup("Please fill in all fields.", "error");
        return;
    }

    let email = input;

    // Check if the input is a username (does not contain '@')
    if (!input.includes("@")) {
        try {
            const userQuery = query(collection(db, "users"), where("username", "==", input));
            const querySnapshot = await getDocs(userQuery);

            if (querySnapshot.empty) {
                showPopup("Username not found.", "error");
                return;
            }

            // Assume the first match is correct
            const userDoc = querySnapshot.docs[0];
            email = userDoc.data().email;
        } catch (error) {
            showPopup("Error fetching user by username: " + error.message, "error");
            return;
        }
    }

    // Proceed with Firebase Authentication using the resolved email
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            showPopup("Please verify your email before logging in.", "error");
            return;
        }

        showPopup("Login successful!", "info");
        redirectToMain(user.uid); // Pass UID to `redirectToMain`
    } catch (error) {
        showPopup("Login error: " + error.message, "error");
    }
});

document.getElementById("loginForm").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent the default form submission behavior
        document.getElementById("loginBtn").click(); // Trigger the login button click event
    }
});

document.getElementById("googleSignInBtn").addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();

    try {
        // Sign in with Google
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        if (!user) {
            showPopup("Sign-in failed. Please try again.", "error");
            return;
        }

        const uid = user.uid; // Use Firebase UID as the identifier
        console.log("Authenticated User UID:", uid);

        // Check if the user already exists in Firestore
        const userDocRef = doc(db, "users", uid);
        const userSnapshot = await getDocs(query(collection(db, "users"), where("uid", "==", uid)));

        const { country, region } = await getCountryAndRegion();

        if (userSnapshot.empty) {
            // Create a new user profile in Firestore
            const userProfile = {
                accountDateCreation: Timestamp.now(),
                badges: [],
                accountStatus: 1,
                collectedLocations: [],
                countryOfOrigin: country,
                regionInCountry: region,
                email: user.email,
                friendRequests: [],
                friends: [],
                gender: "",
                isOnline: true,
                isTyping: false,
                name: user.displayName || "",
                surname: "",
                username: user.email.split("@")[0], // Default username from email
                birthdate: "",
                phoneNumber: user.phoneNumber || "",
                points: 0,
                profilePictureURL: user.photoURL || null,
            };

            console.log("Creating new user profile:", userProfile);

            await setDoc(userDocRef, userProfile);
            showPopup("Welcome! Your profile has been created.", "info");
        } else {
            showPopup("Welcome back!", "info");
        }

        // Redirect to the main page
        redirectToMain(uid); // Pass the UID for navigation or further processing
    } catch (error) {
        console.error("Google Sign-In Error:", error.code, error.message);

        if (error.code === "auth/popup-closed-by-user") {
            showPopup("Sign-in cancelled. Please try again.", "error");
        } else if (error.code === "permission-denied") {
            showPopup("Permission denied. Check Firestore rules.", "error");
        } else {
            showPopup("Error: " + error.message, "error");
        }
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
        { id: "birthdate", value: document.getElementById("birthdate").value },
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
        const uid = user.uid; // Use Firebase UID as the identifier

        // Send verification email
        await sendEmailVerification(user);

        // Add user data to Firestore
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const username = document.getElementById("username").value;
        const birthdate = document.getElementById("birthdate").value; // Birthdate value
        const gender = document.querySelector('input[name="gender"]:checked')?.value || "";
        const { country, region } = await getCountryAndRegion();

        console.log("Country and Region:", { country, region });

        await setDoc(doc(db, "users", uid), {
            accountDateCreation: Timestamp.now(),
            badges: [],
            collectedLocations: [],
            email,
            accountStatus: 1,
            countryOfOrigin: country,
            regionInCountry: region,
            friendRequests: [],
            friends: [],
            gender,
            isOnline: true,
            isTyping: false,
            name: firstName,
            surname: lastName,
            username,
            birthdate, // Store birthdate as a string
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
// Check Email Verification
document.getElementById("checkVerificationBtn").addEventListener("click", async () => {
    try {
        await auth.currentUser.reload();

        if (auth.currentUser.emailVerified) {
            showPopup("Your email has been successfully verified!", "info");
            redirectToMain(auth.currentUser.email); // Pass the email from the current user

        } else {
            showPopup("Your email is not yet verified. Please try again.", "error");
        }
    } catch (error) {
        showPopup("Error checking email verification: " + error.message, "error");
    }
});
// Show Forgot Password Form
document.getElementById("forgotPasswordLink").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("loginForm").classList.remove("active");
    document.getElementById("forgotPasswordForm").classList.add("active");
});
// Return to Login Form
document.getElementById("backToLogin").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("forgotPasswordForm").classList.remove("active");
    document.getElementById("loginForm").classList.add("active");
});
// Handle Password Reset
document.getElementById("resetPasswordBtn").addEventListener("click", async () => {
    const email = document.getElementById("resetEmail").value;

    if (!email) {
        showPopup("Please enter your email.", "error");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showPopup("A reset link has been sent to your email.", "info");
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            showPopup("This email is not registered.", "error");
        } else if (error.code === "auth/invalid-email") {
            showPopup("Invalid email.", "error");
        } else {
            showPopup("Error: " + error.message, "error");
        }
    }
});
// Function to check password strength
function checkPasswordStrength(password) {
    const strengthIndicator = document.getElementById("passwordStrengthIndicator");
    const requirements = {
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[\W_]/.test(password),
        isLongEnough: password.length >= 6,
    };

    let strength = 0;
    Object.values(requirements).forEach((req) => {
        if (req) strength++;
    });

    // Update the strength indicator based on the strength value
    if (strength === 0) {
        strengthIndicator.textContent = "";
    } else if (strength <= 2) {
        strengthIndicator.textContent = "Weak";
        strengthIndicator.style.color = "red";
    } else if (strength <= 4) {
        strengthIndicator.textContent = "Medium";
        strengthIndicator.style.color = "orange";
    } else {
        strengthIndicator.textContent = "Strong";
        strengthIndicator.style.color = "green";
    }
}
// Attach input event to password field
document.getElementById("regPassword").addEventListener("input", function () {
    const password = this.value;
    checkPasswordStrength(password);
});
const birthdate = new Date(document.getElementById("birthdate").value);
const today = new Date();
const age = today.getFullYear() - birthdate.getFullYear();
const isValidDate = today >= birthdate; // Ensure birthdate is not in the future

if (age < 13 || !isValidDate) {
    document.getElementById("birthdate").classList.add("shake");
    hasError = true;
    showPopup("You must be at least 13 years old.", "error");
}


// Button Hover and Click Animations
document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("mouseenter", () => button.classList.add("hover"));
    button.addEventListener("mouseleave", () => button.classList.remove("hover"));
    button.addEventListener("mousedown", () => button.classList.add("click"));
    button.addEventListener("mouseup", () => button.classList.remove("click"));
});