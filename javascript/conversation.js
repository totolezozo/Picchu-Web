import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, orderBy, getDocs, addDoc, Timestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";


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
const storage = getStorage(app);

// Get query parameters
const urlParams = new URLSearchParams(window.location.search);
const friendEmail = urlParams.get("friendEmail");

let selectedImageFiles = []; // Global variable to store selected files


document.addEventListener("DOMContentLoaded", () => {
    const messageArea = document.getElementById("messageArea");
    const friendProfilePicture = document.getElementById("friendProfilePicture");
    const friendUsername = document.getElementById("friendUsername");
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const profilePictureLink = document.getElementById("profilePictureLink");
    const usernameLink = document.getElementById("usernameLink");

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.error("User is not authenticated, redirecting to login.");
            window.location.href = "../html/login.html";
            return;
        }

        console.log("Authenticated user:", user.email);

        // Fetch friend's profile data
        const loadFriendProfile = async () => {
            try {
                const friendDocRef = doc(db, "users", friendEmail);
                const friendDoc = await getDoc(friendDocRef);
                if (friendDoc.exists()) {
                    const friendData = friendDoc.data();
                    friendUsername.textContent = friendData.username || friendEmail;
                    friendProfilePicture.src = friendData.profilePictureURL || "../drawable/profile-hard.png";

                    const profileLink = `friend_profile.html?email=${encodeURIComponent(friendEmail)}`;
                    profilePictureLink.href = profileLink;
                    usernameLink.href = profileLink;
                } else {
                    console.error("Friend's profile not found in Firestore.");
                }
            } catch (error) {
                console.error("Error loading friend's profile:", error);
            }
        };

        // Load messages
        const loadMessages = async () => {
            try {
                const messagesQuery = query(
                    collection(db, "messages"),
                    where("sender", "==", user.email),
                    where("receiver", "==", friendEmail),
                    orderBy("timestamp", "asc")
                );
        
                const reverseQuery = query(
                    collection(db, "messages"),
                    where("sender", "==", friendEmail),
                    where("receiver", "==", user.email),
                    orderBy("timestamp", "asc")
                );
        
                // Combine both queries
                const combinedMessages = [];
        
                // Fetch messages sent by the user
                const userMessages = await getDocs(messagesQuery);
                userMessages.forEach((doc) => combinedMessages.push({ id: doc.id, ...doc.data() }));
        
                // Fetch messages sent by the friend
                const friendMessages = await getDocs(reverseQuery);
                friendMessages.forEach((doc) => combinedMessages.push({ id: doc.id, ...doc.data() }));
        
                // Sort combined messages by timestamp
                combinedMessages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        
                // Render messages
                messageArea.innerHTML = ""; // Clear previous messages
                combinedMessages.forEach((message) => {
                    const messageElement = document.createElement("div");
                    messageElement.classList.add("message");
                    messageElement.classList.add(
                        message.sender === user.email ? "sent" : "received"
                    );
                
                    // Add text message if available
                    if (message.message) {
                        const messageTextElement = document.createElement("p");
                        messageTextElement.textContent = message.message;
                        messageTextElement.classList.add("message-text");
                        messageElement.appendChild(messageTextElement);
                    }
                
                    // Add image if available
                    if (message.PhotoURL) {
                        const messageImageElement = document.createElement("img");
                        messageImageElement.src = message.PhotoURL;
                        messageImageElement.classList.add("message-image");
                        messageElement.appendChild(messageImageElement);
                    }
                    if (message.PhotoURLs && message.PhotoURLs.length > 0) {
                        message.PhotoURLs.forEach((url) => {
                            const messageImageElement = document.createElement("img");
                            messageImageElement.src = url;
                            messageImageElement.classList.add("message-image");
                            messageElement.appendChild(messageImageElement);
                        });
                    }
                    
                    
                    // Add timestamp
                    const timestampElement = document.createElement("span");
                    timestampElement.classList.add("timestamp");
                    timestampElement.textContent = formatTimestamp(message.timestamp);
                    messageElement.appendChild(timestampElement);
                
                    messageArea.appendChild(messageElement);
                });
                
                
                
        
                // Mark received messages as read
                const unreadMessages = combinedMessages.filter(
                    (message) => message.sender === friendEmail && !message.read
                );
                if (unreadMessages.length > 0) {
                    await markMessagesAsRead(unreadMessages.map((message) => message.id));
                }
        
                // Scroll to the latest message
                messageArea.scrollTop = messageArea.scrollHeight;
            } catch (error) {
                console.error("Error loading messages:", error);
            }
        };
        

        const sendMessage = async () => {
            const messageText = messageInput.value.trim();
            if (!messageText && selectedImageFiles.length === 0) {
                console.warn("Cannot send an empty message or image.");
                return;
            }
        
            try {
                let photoURLsArray = []; // Array to store uploaded image URLs
        
                if (selectedImageFiles.length > 0) {
                    for (const file of selectedImageFiles) {
                        const imageRef = ref(storage, `Photo_Message/${Date.now()}_${file.name}`);
                        const snapshot = await uploadBytes(imageRef, file);
                        const downloadURL = await getDownloadURL(snapshot.ref);
                        photoURLsArray.push(downloadURL);
                    }
                }
        
                const messageType =
                    selectedImageFiles.length > 0 && messageText
                        ? "text-picture"
                        : selectedImageFiles.length > 0
                        ? "picture"
                        : "text";
        
                // Save message to Firestore
                await addDoc(collection(db, "messages"), {
                    sender: user.email,
                    receiver: friendEmail,
                    message: messageText || null,
                    PhotoURLs: photoURLsArray, // Save array of image URLs
                    messageType: messageType,
                    read: false,
                    timestamp: Timestamp.now(),
                });
        
                console.log("Message sent:", { messageText, photoURLsArray });
        
                // Clear inputs after sending
                messageInput.value = "";
                selectedImageFiles = [];
                imagePreviewContainer.innerHTML = ""; // Clear previews
                loadMessages(); // Refresh messages
            } catch (error) {
                console.error("Error sending message:", error);
            }
        };
        
        
        let photoURLsArray = []; // Array to store image URLs

        if (imageInput.files.length > 0) {
            for (let i = 0; i < imageInput.files.length; i++) {
                const file = imageInput.files[i];
                const imageRef = ref(storage, `Photo_Message/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(imageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                photoURLsArray.push(downloadURL);
            }
        }

        

        // Load friend's profile and messages
        await loadFriendProfile();
        loadMessages();

        // Attach event listeners
        sendButton.addEventListener("click", sendMessage);
        messageInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent new line
                sendMessage(); // Trigger send
            }
        });
    });
});



const markMessagesAsRead = async (messageIds) => {
    try {
        const batch = writeBatch(db); // Correct usage of batch
        messageIds.forEach((id) => {
            const messageRef = doc(db, "messages", id);
            batch.update(messageRef, { read: true });
        });

        await batch.commit(); // Commit the batch
        console.log("Messages marked as read.");
    } catch (error) {
        console.error("Error marking messages as read:", error);
    }
};

const formatTimestamp = (timestamp) => {
    const date = timestamp.toDate(); // Convert Firestore Timestamp to Date object
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
};




const imageInput = document.getElementById("imageInput");
const uploadImageButton = document.getElementById("uploadImageButton");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const deleteImageButton = document.getElementById("deleteImageButton");

let selectedImageFile = null;

// Open file selector
uploadImageButton.addEventListener("click", () => {
    imageInput.click();
});
imageInput.addEventListener("change", () => {
    const files = imageInput.files;

    if (files.length > 0) {
        imagePreviewContainer.style.display = "block"; // Show the container when files are selected
    } else {
        imagePreviewContainer.style.display = "none"; // Hide if no files are selected
    }

    imagePreviewContainer.innerHTML = ""; // Clear previous previews
    selectedImageFiles = []; // Reset selected files

    Array.from(files).forEach((file, index) => {
        selectedImageFiles.push(file); // Add file to the array

        const reader = new FileReader();
        reader.onload = (e) => {
            // Create wrapper for image and delete button
            const wrapper = document.createElement("div");
            wrapper.classList.add("image-wrapper");

            // Create image preview
            const preview = document.createElement("img");
            preview.src = e.target.result;
            preview.classList.add("image-preview");

            // Create delete button
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "❌";
            deleteButton.classList.add("delete-button");
            deleteButton.addEventListener("click", () => {
                selectedImageFiles.splice(index, 1); // Remove file
                wrapper.remove(); // Remove preview
                if (selectedImageFiles.length === 0) {
                    imagePreviewContainer.style.display = "none"; // Hide container if no images left
                }
            });

            // Append elements to wrapper and then to the container
            wrapper.appendChild(preview);
            wrapper.appendChild(deleteButton);
            imagePreviewContainer.appendChild(wrapper);
        };
        reader.readAsDataURL(file); // Convert file to base64 URL
    });
});






// Delete this block:
deleteImageButton.addEventListener("click", () => {
    selectedImageFile = null;
    imageInput.value = ""; // Reset file input
    imagePreview.src = ""; // Clear preview
    imagePreviewContainer.style.display = "none";
});

