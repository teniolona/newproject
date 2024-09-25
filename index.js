// The Root File
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config()
}

// Importing Libraries
const express = require("express");
const ejs = require("ejs");
const app = express();
const dotenv = require("dotenv");
const bcrypt = require('bcrypt'); // Importing bcrypt package
const passport = require('passport');
const initializePassport = require('./passport-config');
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
// const cors = require("cors");
// const corsConfig = {
    // origin: "*",
    // credential: true,
    // methods: ["GET", "POST", "PUT", "DELETE"]
// };
// app.options("", cors(corsConfig));
// app.use(cors(corsConfig));

app.use(express.json());
dotenv.config()
app.set('views', 'var/task/views'); // Set the views directory

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = "AIzaSyA4kjxLBnSFpMOAzJWir1gq_IHnXLVnT8I";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// const port = process.env.PORT || 1450;

const brochureUser = require("./trainingdata")
const jamb_users = require("./mongodb_user")

initializePassport(
    passport,
    email => jamb_users.findOne(email)
    // id => jamb_users.find(user => user.id === id)
)

app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false, // We won't resave the session variable if nothing is changed
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"))

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

// Dataset for Training using MongoDB
// const dt1 = new brochureUser({
//     text : "Teniola Olonade"
// });
// const dt2 = new brochureUser({
//     text : "Anthony Redis"
// });
// const dt3 = new brochureUser({
//     text : "Drinkwater Moose"
// });
// const dt4 = new brochureUser({
//     text : "Medinah Mercy"
// });

// dt1.save();
// dt2.save();
// dt3.save();
// dt4.save();

// Retrieving the Brochure from MongoDB
let retrievedBrochure = [];
const retrieve = async() => {
    const newresult = await brochureUser.find({});
    newresult.forEach(item => {
        retrievedBrochure.push(item.text)
    });
};
retrieve();
// Function to test Gemini 1.5 Flash with our data.
async function runChat(userInput) {
    const chatSession = model.startChat({
        generationConfig,
        // safetySettings: Adjust safety settings
        // See https://ai.google.dev/gemini-api/docs/safety-settings
        history: [
            {
                role: "user",
                parts: [
                    { text: retrievedBrochure[0] },
                    { text: retrievedBrochure[1] },
                    { text: retrievedBrochure[2] },
                    { text: retrievedBrochure[3] },
                    { text: retrievedBrochure[4] },
                ],
            },
            {
                role: "model",
                parts: [
                    { text: retrievedBrochure[5] },
                ],
            },
        ],
    });

    const result = await chatSession.sendMessage(userInput);
    const response = result.response;
    return response.text();
}

// Configuring the login functionality
app.post("/login", checkUnAuth, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}))

app.post('/register', checkUnAuth, async (req, res) => {
    try {
        const hashedPwd = await bcrypt.hash(req.body.password, 10)
        const theuser = {
            name: req.body.name,
            email: req.body.email,
            password: hashedPwd
        }
        /* users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPwd
        }); */

        await jamb_users.insertMany([theuser])
        res.redirect('/login');
    } catch (e) {
        console.log(e);
        res.redirect('/register');
    }
})

app.post('/chat', checkAuth, async (req, res) => {
    try {
        const userInput = req.body.userInput;
        console.log('incoming /chat req', userInput)
        if (!userInput) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        const response = await runChat(userInput);
        res.json({ response });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        alert("Server Error! Try Again")
    }
});

// This is to get a request. Also to send 
app.get("/", checkAuth, async (req, res) => {
    // This is to render the index.ejs file. So, it searches for the views folder and picks it out.
    res.render("index.ejs")
    console.log("Hello World")

    // This is to send the output you want to see from the server
    /* res.send({
        name: "Olonade Teniola",
        age: 20,
        class: "400L",
        food:"Pizza"
    }) */
    // res.send("<h1>Hello World<h1>")

    // You have to trace the directory of the file so it's not going to work
    // res.sendFile("index.html")
    // Instead, trace the directory name
    // res.sendFile( __dirname + "/index.html")
});
app.get('/loader.gif', (req, res) => {
    res.sendFile(__dirname + '/loader.gif');
});
// app.set("view engine", "ejs")

// Route for Login page
app.get("/login", checkUnAuth, (req, res) => {
    res.render("login.ejs")
})

// Route for Register page
app.get("/register", checkUnAuth, (req, res) => {
    res.render('register.ejs')
})

// Check if a request is authenticated by the authentication system
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect("/login")
}
// Check if a request is unauthenticated by the authentication system
function checkUnAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/")
    }
    next()
}
// Creating the Log Out function
app.delete("/logout", (req, res) => {
    req.logout(req.user, () => {
        return res.redirect("/login")
    })
})

// Display newly registered in the console.
// console.log(userModel);

// Run the server
app.listen(5000, () => console.log("Your server running on port 5000"));