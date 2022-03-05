const { v4: uuidv4 } = require("uuid");

const tokens = require('../app').tokens;
const auth = require('../helpers').auth;

exports.default = async(request, h) => {
    const email = request.payload.email;
    const pass = request.payload.password;

    const token = uuidv4();

    if (await auth(email, pass)) {
        tokens[token] = {
            "email": email,
            "time": +Date.now()
        };
        return {
            success: true,
            token,
        };
    }

    return {
        success: false,
    };
}