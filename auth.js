document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfig = {
        apiKey: "AIzaSyCqNDdH6H0vxglHdE8JBD5mnQPi5widDFY",
        authDomain: "budget-planner-8ff08.firebaseapp.com",
        projectId: "budget-planner-8ff08",
        storageBucket: "budget-planner-8ff08.appspot.com",
        messagingSenderId: "503732305689",
        appId: "1:503732305689:web:22803cd8e97cf4b1bb8f88",
        measurementId: "G-WVXWJSHZPM"
    };

    firebase.initializeApp(firebaseConfig);

    const auth = firebase.auth();
    const db = firebase.firestore();

    window.auth = auth;
    window.db = db;

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const signupBox = document.getElementById('signupBox');
    const googleLoginButton = document.getElementById('googleLoginButton');
    const googleSignupButton = document.getElementById('googleSignupButton');

    if (showSignup) {
        showSignup.addEventListener('click', () => {
            loginForm.parentElement.classList.add('hidden');
            signupBox.classList.remove('hidden');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', () => {
            signupBox.classList.add('hidden');
            loginForm.parentElement.classList.remove('hidden');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("User logged in: ", userCredential.user);
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error("Error logging in: ", error);
                    alert("Login failed: " + error.message);
                });
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    user.sendEmailVerification()
                        .then(() => {
                            alert('Verification email sent. Please check your inbox.');
                            window.location.href = 'index.html';
                        })
                        .catch((error) => {
                            console.error("Error sending email verification: ", error);
                            alert("Signup failed: " + error.message);
                        });
                })
                .catch((error) => {
                    console.error("Error signing up: ", error);
                    alert("Signup failed: " + error.message);
                });
        });
    }

    if (googleLoginButton) {
        googleLoginButton.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => {
                    console.log("Google login result: ", result);
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error("Error logging in with Google: ", error);
                    alert("Google login failed: " + error.message);
                });
        });
    }

    if (googleSignupButton) {
        googleSignupButton.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => {
                    const user = result.user;
                    user.sendEmailVerification()
                        .then(() => {
                            alert('Verification email sent. Please check your inbox.');
                            window.location.href = 'index.html';
                        })
                        .catch((error) => {
                            console.error("Error sending email verification: ", error);
                            alert("Signup failed: " + error.message);
                        });
                })
                .catch((error) => {
                    console.error("Error signing up with Google: ", error);
                    alert("Google signup failed: " + error.message);
                });
        });
    }

    auth.onAuthStateChanged((user) => {
        if (user && window.location.pathname.endsWith('login.html')) {
            console.log("User authenticated: ", user);
            window.location.href = 'index.html';
        }
    });
});
