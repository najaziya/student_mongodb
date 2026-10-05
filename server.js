const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const app = express();


// Middleware
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "nodeLabSecret",
    resave: false,
    saveUninitialized: false
}));


// Serve HTML files
app.use(express.static(path.join(__dirname, "public")));


// MongoDB connection
mongoose
    .connect("mongodb://127.0.0.1:27017/nodeLab") 
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.log("MongoDB connection error:", err);
    });


// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    password: String
});


// User Model
const User = mongoose.model("User", userSchema);


// Signup
app.post("/signup", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        // Check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.send("User already exists.");
        }

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = new User({
            name: name,
            email: email,
            password: hashedPassword
        });

        await newUser.save();

        res.send(`
            <h2>Signup successful!</h2>
            <a href="/">Go to Login</a>
        `);

    } catch (error) {

        console.log(error);
        res.send("Signup failed.");

    }
});


// Login
app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.send("Invalid email or password.");
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.send("Invalid email or password.");
        }

        // Create session
        req.session.userId = user._id;
        req.session.userName = user.name;

        res.redirect("/dashboard");

    } catch (error) {

        console.log(error);
        res.send("Login failed.");

    }
});


// Dashboard
app.get("/dashboard", (req, res) => {

    if (!req.session.userId) {
        return res.redirect("/");
    }

    res.sendFile(
        path.join(__dirname, "public", "dashboard.html")
    );
});


// Logout
app.get("/logout", (req, res) => {

    req.session.destroy(() => {
        res.redirect("/");
    });

});


// Start server
app.listen(3000, () => {

    console.log("Server running at http://localhost:3000");

});