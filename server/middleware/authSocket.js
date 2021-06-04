const jwt = require("jsonwebtoken");

// Middleware to auth users before allowing them to connect using websockets
function authSocket(socket, next) {
    if (socket.handshake.auth.type === 'client') {
        if (!socket.handshake.auth.token) return next(new Error("who are you 🖕🖕🖕"));

        jwt.verify(socket.handshake.auth.token, process.env.SECRET, async (error, user) => {
            if (error) next(new Error("You must be logged in to connect to a websocket idiot 🖕🖕🖕"));
            socket.user = user,
            next();
        });
    }
    next();
}

module.exports = authSocket