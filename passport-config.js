const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require("./mongodb_user")

function initialize(passport, getUserByEmail) {
    // Function to Authenticate Users
    const authenticateUsers = async (email, password, done) => {
        // Get Users By Email
        // const user = getUserByEmail(email);
        const user = await User.findOne({email});
        if (user == null) {
            return done(null, false, {
                message: "No User With That Email Exists"
            })
        }
        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user, user.name);
            } else {
                return done(null, false, { message: "Incorrect Password! Try Again" });
            }
        } catch (e) {
            console.log(e);
            return done(e);
        }
    }
    
    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUsers));
    passport.serializeUser((user, done) => done(null, user.id)); // Use user ID for session
    passport.deserializeUser((id, done) => {
        return done(null, User.findById(id));
    });
    
    /* passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id));
    }); */
}

module.exports = initialize;