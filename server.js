const express = require("express");
const fs = require("fs");
const EventEmitter = require("events");
const path = require("path");

const app = express();
const PORT = 3000;

// File paths
const usersFile = path.join(__dirname, "users.json");
const auditFile = path.join(__dirname, "audit.log");

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Read users from users.json
function readUsers() {
    try {
        const data = fs.readFileSync(usersFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Save users to users.json
function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Create custom EventEmitter
const userEvents = new EventEmitter();

// Signup event
userEvents.on("signup", (user) => {
    const message =
        `${new Date().toLocaleString()} - New user registered: ${user.email}\n`;

    fs.appendFileSync(auditFile, message);
    console.log("Signup event logged");
});

// Login event
userEvents.on("login", (user) => {
    const message =
        `${new Date().toLocaleString()} - User logged in: ${user.email}\n`;

    fs.appendFileSync(auditFile, message);
    console.log("Login event logged");
});

// SIGN UP
app.post("/signup", (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all fields."
        });
    }

    const users = readUsers();

    // Check if email already exists
    const existingUser = users.find(
        user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "Email already registered."
        });
    }

    // Add new user
    const newUser = {
        name: name,
        email: email,
        password: password
    };

    users.push(newUser);
    saveUsers(users);

    // Emit signup event
    userEvents.emit("signup", newUser);

    res.json({
        success: true,
        message: "Registration successful!"
    });
});

// LOGIN
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const users = readUsers();

    const user = users.find(
        user =>
            user.email.toLowerCase() === email.toLowerCase() &&
            user.password === password
    );

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password."
        });
    }

    // Emit login event
    userEvents.emit("login", user);

    res.json({
        success: true,
        message: "Login successful!",
        name: user.name
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});