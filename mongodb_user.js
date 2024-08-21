const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const MONGOURL = process.env.MONGO_URL;

// Configuring the MongoDB Database
mongoose.connect(MONGOURL).then(() => {
    console.log("DB for Users Connected");
}).catch((error) => console.log(error));

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const userModel = mongoose.model("jamb_users", userSchema);

module.exports = userModel;