const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const MONGOURL = process.env.MONGODB_CONNECT_URI;

// Configuring the MongoDB Database
mongoose.connect(MONGOURL).then(() => {
    console.log("DB for Brochure Connected");
}).catch((error) => console.log(error));

const ml_model = new mongoose.Schema({
    text: {
        type: String
    }
});
const brochureUser = mongoose.model("brochure_users", ml_model);

module.exports = brochureUser;