import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-storage.js";
import { updateDoc } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
import { arrayUnion } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";


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

const storage = getStorage(app);
const profilePictureInput = document.getElementById("profilePictureInput");
const uploadProfilePictureButton = document.getElementById("uploadProfilePictureButton");

document.getElementById("changeProfilePictureButton").addEventListener("click", () => {
    profilePictureInput.click();
});


profilePictureInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            const user = auth.currentUser;
            if (user) {
                // Log selected file details
                console.log("Uploading file:", file.name);

                const storageRef = ref(storage, `profile_pictures/${user.email}`);
                await uploadBytes(storageRef, file);
                console.log("File uploaded successfully");

                const downloadURL = await getDownloadURL(storageRef);
                console.log("Download URL obtained:", downloadURL);

                // Update Firestore document
                const userDocRef = doc(db, "users", user.email);
                await updateDoc(userDocRef, { profilePictureURL: downloadURL });
                console.log("Firestore document updated");

                // Update displayed profile picture
                profilePicture.src = downloadURL;
            }
        } catch (error) {
            console.error("Error uploading profile picture:", error);
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const profilePicture = document.getElementById("profilePicture");
    const usernameElem = document.getElementById("username");
    const friendsCountElem = document.getElementById("friendsCount");
    const friendsList = document.getElementById("friendsList");
    const friendRequestsList = document.getElementById("friendRequestsList");

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDocRef = doc(db, "users", user.email);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    profilePicture.src = userData.profilePictureURL || "../drawable/profile-hard.png";
                    usernameElem.textContent = userData.username || "Username";
                    friendsCountElem.textContent = userData.friends ? userData.friends.length : 0;

                    friendsList.innerHTML = "";
                    if (Array.isArray(userData.friends) && userData.friends.length > 0) {
                        for (const friendEmail of userData.friends) {
                            if (typeof friendEmail === "string") {
                                const friendDocRef = doc(db, "users", friendEmail);
                                const friendDoc = await getDoc(friendDocRef);
                                if (friendDoc.exists()) {
                                    const friendData = friendDoc.data();
                                    
                                    // Create a container div for each friend item
                                    const friendItem = document.createElement("a");
                                    friendItem.href = `friend_profile.html?email=${encodeURIComponent(friendEmail)}`;
                                    friendItem.classList.add("friend-item");
                    
                                    // Create the profile picture image
                                    const friendProfilePic = document.createElement("img");
                                    friendProfilePic.src = friendData.profilePictureURL || "../drawable/profile-hard.png";
                                    friendProfilePic.classList.add("friend-profile-picture");
                    
                                    // Create the username element
                                    const friendName = document.createElement("span");
                                    friendName.textContent = friendData.username || "Friend";
                    
                                    // Append the profile picture and username to the friend item
                                    friendItem.appendChild(friendProfilePic);
                                    friendItem.appendChild(friendName);
                    
                                    // Add the friend item to the friends list
                                    friendsList.appendChild(friendItem);
                                }
                            }
                        }
                    } else {
                        friendsList.innerHTML = "<p>No friends added yet.</p>";
                    }
                    

                    friendRequestsList.innerHTML = ""; 
                    const pendingRequests = Array.isArray(userData.friendRequests)
                    ? userData.friendRequests.filter(req => req.status === "pending")
                    : [];
                

                    document.getElementById("friendsRequestCount").textContent = pendingRequests.length;

                    if (pendingRequests.length > 0) {
                        for (const request of pendingRequests) {
                            if (request && typeof request === "object" && request.from) {
                                try {
                                    const requesterDocRef = doc(db, "users", request.from);
                                    const requesterDoc = await getDoc(requesterDocRef);
                                    if (requesterDoc.exists()) {
                                        const requesterData = requesterDoc.data();
                    
                                        // Create the request item container
                                        const requestItem = document.createElement("div");
                                        requestItem.classList.add("request-item");
                    
                                        // Profile picture
                                        const requesterProfilePic = document.createElement("img");
                                        requesterProfilePic.src = requesterData.profilePictureURL || "../drawable/profile-hard.png";
                                        requesterProfilePic.classList.add("request-profile-picture");
                    
                                        // Username
                                        const requesterName = document.createElement("span");

                                        // Check if the username is longer than 10 characters and trim if necessary
                                        const username = requesterData.username || "Unknown User";
                                        requesterName.textContent = username.length > 10 ? `${username.slice(0, 10)}...` : username;
                                        

                                        const actionButtonContainer = document.createElement("div");
                                        actionButtonContainer.classList.add("action-button-container");

                                        const acceptButton = document.createElement("img");
                                        acceptButton.src = "../drawable/yes.png";
                                        acceptButton.classList.add("action-button");
                                        acceptButton.alt = "Accept";
                                        acceptButton.addEventListener("click", async () => {
                                            try {
                                                const currentUserEmail = auth.currentUser.email;
                                                const requesterEmail = request.from;
                                        
                                                // Update Firestore: Add mutual friends
                                                const currentUserDocRef = doc(db, "users", currentUserEmail);
                                                const requesterDocRef = doc(db, "users", requesterEmail);
                                        
                                                // Update the current user's friends list and remove the friend request
                                                const updatedRequests = userData.friendRequests.filter(req => req.from !== requesterEmail);
                                        
                                                await updateDoc(currentUserDocRef, {
                                                    friends: arrayUnion(requesterEmail),
                                                    friendRequests: updatedRequests, // Update the friendRequests array
                                                });
                                        
                                                // Update the requester's friends list
                                                await updateDoc(requesterDocRef, {
                                                    friends: arrayUnion(currentUserEmail),
                                                });
                                        
                                                // Update the DOM: Remove the request item and update counts
                                                requestItem.remove();
                                        
                                                // Decrement the request count
                                                const newRequestCount = pendingRequests.length - 1;
                                                document.getElementById("friendsRequestCount").textContent = newRequestCount;
                                        
                                                // Update friends count
                                                const newFriendCount = Number(friendsCountElem.textContent) + 1;
                                                friendsCountElem.textContent = newFriendCount;
                                        
                                                // Check if there are no remaining requests
                                                if (newRequestCount === 0) {
                                                    friendRequestsList.innerHTML = "<p>No pending requests.</p>";
                                                }
                                            } catch (error) {
                                                console.error("Error accepting friend request:", error);
                                            }
                                        });
                                        
                                        
                                        const refuseButton = document.createElement("img");
                                        refuseButton.src = "../drawable/no.png";
                                        refuseButton.classList.add("action-button");
                                        refuseButton.alt = "Refuse";
                                        refuseButton.addEventListener("click", async () => {
                                            try {
                                                const requesterEmail = request.from;
                                        
                                                // Update Firestore: update request status to "declined"
                                                await updateDoc(doc(db, "users", auth.currentUser.email), {
                                                    friendRequests: userData.friendRequests.map(req =>
                                                        req.from === requesterEmail ? { ...req, status: "declined" } : req
                                                    ),
                                                });
                                        
                                                // Remove the request item from the DOM
                                                requestItem.remove();
                                                

                                                const newRequestCount = friendRequestsList.children.length;
                                                document.getElementById("friendsRequestCount").textContent = newRequestCount;
                                                // Check if there are any remaining requests
                                                if (friendRequestsList.children.length === 0) {
                                                    friendRequestsList.innerHTML = "<p>No pending requests.</p>";
                                                }
                                            } catch (error) {
                                                console.error("Error declining friend request:", error);
                                            }
                                        });
                                        

                                        


                                        requestItem.appendChild(requesterProfilePic);
                                        requestItem.appendChild(requesterName);
                                                                                
                                        actionButtonContainer.appendChild(acceptButton);
                                        actionButtonContainer.appendChild(refuseButton);
                                        requestItem.appendChild(actionButtonContainer);
                    
                                        // Append the request item to the friend requests list
                                        friendRequestsList.appendChild(requestItem);
                                    }
                                } catch (error) {
                                    console.error("Error loading requester data:", error);
                                }
                            }
                        }
                    } else {
                        friendRequestsList.innerHTML = "<p>No pending requests.</p>";
                    }                    

                } else {
                    console.warn("User document not found in Firestore.");
                }
            } catch (error) {
                console.error("Error loading user data:", error);
            }
        } else {
            console.warn("No user logged in");
        }
    });
    document.getElementById("friendsButton").addEventListener("click", () => {
        const friendsList = document.getElementById("friendsList");
        const friendRequestsList = document.getElementById("friendRequestsList");
    
        if (friendsList.style.display === "none" || friendsList.style.display === "") {
            friendsList.style.display = "block";
            friendRequestsList.style.display = "none"; // Close friend requests
        } else {
            friendsList.style.display = "none";
        }
    });
    
    document.getElementById("friendRequestsButton").addEventListener("click", () => {
        const friendsList = document.getElementById("friendsList");
        const friendRequestsList = document.getElementById("friendRequestsList");
    
        if (friendRequestsList.style.display === "none" || friendRequestsList.style.display === "") {
            friendRequestsList.style.display = "block";
            friendsList.style.display = "none"; // Close friends list
        } else {
            friendRequestsList.style.display = "none";
        }
    });
    
    

    // Settings button placeholder
    document.getElementById("settingsBtn").addEventListener("click", () => {
        window.location.href = "settings.html";
    });
});
