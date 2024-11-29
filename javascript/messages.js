import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBp1Dx56HjQ7FJ3n5YBkvPlJCDz9glBwPQ",
    authDomain: "picchulast.firebaseapp.com",
    projectId: "picchulast",
    storageBucket: "picchulast.firebaseapp.com",
    messagingSenderId: "72745263315",
    appId: "1:72745263315:web:289d6df35320f788adf426",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Fetch user's friends and their usernames
const fetchFriends = async (currentUserEmail) => {
    try {
        const userDocRef = doc(db, "users", currentUserEmail);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const friends = userData.friends || [];

            // Fetch usernames of all friends
            const friendDetails = await Promise.all(
                friends.map(async (friendEmail) => {
                    const friendDocRef = doc(db, "users", friendEmail);
                    const friendDoc = await getDoc(friendDocRef);

                    if (friendDoc.exists()) {
                        const friendData = friendDoc.data();
                        return {
                            email: friendEmail,
                            username: friendData.username || friendEmail, // Default to email if no username
                        };
                    } else {
                        return { email: friendEmail, username: friendEmail };
                    }
                })
            );

            return friendDetails;
        } else {
            console.error("User document not found");
            return [];
        }
    } catch (error) {
        console.error("Error fetching friends:", error);
        return [];
    }
};

// Fetch messages involving the user and their friends
const fetchMessages = async (currentUserEmail, friends) => {
    try {
        const friendEmails = friends.map((f) => f.email);
        const messagesQuery = query(
            collection(db, "messages"),
            where("sender", "in", [currentUserEmail, ...friendEmails]), // Messages sent by the user or friends
            orderBy("timestamp", "desc") // Order by most recent
        );

        const querySnapshot = await getDocs(messagesQuery);
        const conversations = {};

        querySnapshot.forEach((doc) => {
            const message = doc.data();
            const friendEmail =
                message.sender === currentUserEmail
                    ? message.receiver
                    : message.sender;

            // Include only friends
            if (friendEmails.includes(friendEmail)) {
                if (!conversations[friendEmail]) {
                    conversations[friendEmail] = {
                        email: friendEmail,
                        lastMessage: message.message,
                        lastTimestamp: message.timestamp,
                        sentByUser: message.sender === currentUserEmail,
                    };
                }
            }
        });

        return conversations;
    } catch (error) {
        console.error("Error fetching messages:", error);
        return {};
    }
};

// Display conversations using usernames and profile pictures
const displayConversations = async (conversations, friends) => {
    const messagesList = document.getElementById("messages-list");

    // Handle no friends
    if (!friends || friends.length === 0) {
        messagesList.innerHTML = "<p>You have no friends yet. Start adding friends to chat!</p>";
        return;
    }

    // Populate conversations with friends' data
    for (const friend of friends) {
        if (!conversations[friend.email]) {
            const friendDocRef = doc(db, "users", friend.email);
            const friendDoc = await getDoc(friendDocRef);

            if (friendDoc.exists()) {
                const friendData = friendDoc.data();

                // Add friend to conversations even without messages
                conversations[friend.email] = {
                    email: friend.email,
                    username: friendData.username || friend.email,
                    lastMessage: "No messages yet. Say hi!",
                    lastTimestamp: null, // No timestamp for friends without messages
                    profilePictureURL: friendData.profilePictureURL || "../drawable/profile-hard.png",
                };
            }
        }
    }

    // Sort conversations by timestamp (newest first)
    const sortedConversations = Object.values(conversations).sort((a, b) => {
        if (!a.lastTimestamp) return 1;
        if (!b.lastTimestamp) return -1;
        return b.lastTimestamp.toDate() - a.lastTimestamp.toDate();
    });

    // Render each conversation
    messagesList.innerHTML = ""; // Clear previous content
    sortedConversations.forEach((conv) => {
        const { email, lastMessage, lastTimestamp, profilePictureURL, username } = conv;

        // Format timestamp
        const timeLabel = lastTimestamp
            ? new Date(lastTimestamp.toDate()).toLocaleString()
            : "";

        // Create conversation element
        const conversationElement = document.createElement("div");
        conversationElement.classList.add("conversation");
        conversationElement.addEventListener("click", () => {
            window.location.href = `conversation.html?friendEmail=${encodeURIComponent(email)}`;
        });

        conversationElement.innerHTML = `
            <img src="${profilePictureURL}" alt="${username}" class="friend-profile-picture" />
            <div class="details">
                <span class="username">${username}</span>
                <span class="message-preview">${lastMessage}</span>
            </div>
            <span class="timestamp">${timeLabel}</span>
        `;

        messagesList.appendChild(conversationElement);
    });
};


// Main logic
document.addEventListener("DOMContentLoaded", async () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const currentUserEmail = user.email;

            try {
                // Fetch user's friends
                const friends = await fetchFriends(currentUserEmail);

                // Fetch messages involving the user and their friends
                const conversations = await fetchMessages(currentUserEmail, friends);

                // Display conversations
                displayConversations(conversations, friends);
            } catch (error) {
                console.error("Error displaying conversations:", error);
                document.getElementById("messages-list").innerHTML =
                    "<p>Error loading conversations. Please try again later.</p>";
            }
        } else {
            console.error("No user is signed in. Redirecting to login...");
            window.location.href = "/login.html";
        }
    });
});
