import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBp1Dx56HjQ7FJ3n5YBkvPlJCDz9glBwPQ",
    authDomain: "picchulast.firebaseapp.com",
    projectId: "picchulast",
    storageBucket: "picchulast.appspot.com",
    messagingSenderId: "72745263315",
    appId: "1:72745263315:web:289d6df35320f788adf426",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const urlParams = new URLSearchParams(window.location.search);
const friendEmail = urlParams.get('email');
const friendRequestButton = document.getElementById("friendRequestButton");
const friendsList = document.getElementById("friendsList");
const friendsButton = document.getElementById("friendsButton");

let currentUserData = null;
let friendData = null;

// Toggle drawer visibility for friend’s friends list
friendsButton.addEventListener("click", () => {
    friendsList.classList.toggle("active");
});

// Authenticate and load friend's data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const currentUserEmail = user.email;

        // Redirect to the account page if the user is viewing their own profile
        if (friendEmail === currentUserEmail) {
            window.location.href = "account.html";
            return;
        }

        const currentUserDocRef = doc(db, "users", currentUserEmail);
        const friendDocRef = doc(db, "users", friendEmail);

        // Fetch and display friend's data
        if (friendEmail) {
            const friendDoc = await getDoc(friendDocRef);
            if (friendDoc.exists()) {
                friendData = friendDoc.data();
                document.getElementById("ProfilePicture").src = friendData.profilePictureURL || "../drawable/profile-black.png";
                document.getElementById("friendUsername").textContent = friendData.username || "Friend";

                // Load friend's friends list into the drawer
                loadFriendsFriendsList(friendData);

                // Determine friend request button state
                const currentUserDoc = await getDoc(currentUserDocRef);
                if (currentUserDoc.exists()) {
                    currentUserData = currentUserDoc.data();

                    // Check if there is a pending friend request from the friend
                    const incomingRequest = currentUserData.friendRequests?.find(req => req.from === friendEmail && req.status === "pending");
                    const outgoingRequest = currentUserData.friendRequests?.find(req => req.to === friendEmail && req.status === "pending");

                    if (currentUserData.friends && currentUserData.friends.includes(friendEmail)) {
                        friendRequestButton.textContent = "Delete Friend";
                        friendRequestButton.onclick = () => removeFriend(currentUserEmail, friendEmail, currentUserData, friendData);
                    } else if (incomingRequest) {
                        friendRequestButton.textContent = "Accept Friend Request";
                        friendRequestButton.onclick = () => acceptFriendRequest(currentUserEmail, friendEmail, currentUserData, friendData);
                    } else if (outgoingRequest) {
                        friendRequestButton.textContent = "Pending";
                        friendRequestButton.disabled = true;
                    } else {
                        friendRequestButton.textContent = "Send Friend Request";
                        friendRequestButton.onclick = () => sendFriendRequest(currentUserEmail, friendEmail);
                    }
                }
            } else {
                console.error("Friend document not found.");
            }
        } else {
            console.error("No friend email found in URL parameters.");
        }
    } else {
        console.error("No authenticated user.");
    }
});

// Load the friend's friends list into the drawer
async function loadFriendsFriendsList(friendData) {
    friendsList.innerHTML = ""; // Clear current list
    if (Array.isArray(friendData.friends) && friendData.friends.length > 0) {
        for (const friendFriendEmail of friendData.friends) {
            const friendFriendDocRef = doc(db, "users", friendFriendEmail);
            const friendFriendDoc = await getDoc(friendFriendDocRef);
            if (friendFriendDoc.exists()) {
                const friendFriendData = friendFriendDoc.data();

                // Create a friend item
                const friendFriendItem = document.createElement("a");
                friendFriendItem.href = `friend_profile.html?email=${encodeURIComponent(friendFriendEmail)}`;
                friendFriendItem.classList.add("friend-item");

                // Profile picture
                const friendFriendProfilePic = document.createElement("img");
                friendFriendProfilePic.src = friendFriendData.profilePictureURL || "../drawable/profile-hard.png";
                friendFriendProfilePic.classList.add("friend-profile-picture");

                // Username
                const friendFriendName = document.createElement("span");
                friendFriendName.textContent = friendFriendData.username || "Friend";

                // Append to the friend item
                friendFriendItem.appendChild(friendFriendProfilePic);
                friendFriendItem.appendChild(friendFriendName);

                // Add to the friends list
                friendsList.appendChild(friendFriendItem);
            }
        }
    } else {
        friendsList.innerHTML = "<p>No friends added yet.</p>";
    }
}

// Send a friend request
async function sendFriendRequest(currentUserEmail, friendEmail) {
    try {
        await updateDoc(doc(db, "users", friendEmail), {
            friendRequests: arrayUnion({ from: currentUserEmail, status: "pending" })
        });
        friendRequestButton.textContent = "Pending";
        friendRequestButton.disabled = true;
    } catch (error) {
        console.error("Error sending friend request:", error);
    }
}

// Accept a friend request
async function acceptFriendRequest(currentUserEmail, friendEmail, currentUserData, friendData) {
    try {
        // Update both users' friend lists
        await updateDoc(doc(db, "users", currentUserEmail), {
            friends: arrayUnion(friendEmail),
            friendRequests: currentUserData.friendRequests.map(req => 
                req.from === friendEmail && req.status === "pending" ? { ...req, status: "accepted" } : req
            )
        });
        await updateDoc(doc(db, "users", friendEmail), {
            friends: arrayUnion(currentUserEmail),
            friendRequests: friendData.friendRequests.map(req => 
                req.to === currentUserEmail && req.status === "pending" ? { ...req, status: "accepted" } : req
            )
        });
        friendRequestButton.textContent = "Delete Friend";
        friendRequestButton.onclick = () => removeFriend(currentUserEmail, friendEmail, currentUserData, friendData);
    } catch (error) {
        console.error("Error accepting friend request:", error);
    }
}

// Remove a friend
async function removeFriend(currentUserEmail, friendEmail, currentUserData, friendData) {
    try {
        await updateDoc(doc(db, "users", currentUserEmail), {
            friends: arrayRemove(friendEmail),
            friendRequests: currentUserData.friendRequests.filter(req => req.from !== friendEmail && req.to !== friendEmail)
        });
        await updateDoc(doc(db, "users", friendEmail), {
            friends: arrayRemove(currentUserEmail),
            friendRequests: friendData.friendRequests.filter(req => req.from !== currentUserEmail && req.to !== currentUserEmail)
        });
        friendRequestButton.textContent = "Send Friend Request";
        friendRequestButton.disabled = false;
    } catch (error) {
        console.error("Error deleting friend:", error);
    }
}
