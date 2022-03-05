const { v4: uuidv4 } = require("uuid");

const tokens = require('../app').tokens;
const mcc = require('../app').mcc;
const auth = require('../helpers').auth;

exports.default = async(request, h) => {
    const requestId = uuidv4();
    if (!request.payload || !("password" in request.payload) || !request.payload.password)
        return h
            .response({ message: "Salasana puuttuu.", requestId })
            .code(400); //.message('Password required')


    const password = request.payload.password;
    const token = request.payload.token;

    if (!(token in tokens))
        return h
            .response({ message: "Ei pääsyä (kokeile kirjautua uudestaan).", requestId })
            .code(401);
    if (password.length < 8)
        return h
            .response({ message: "Salasana tulee olla vähintään 8 merkkiä.", requestId })
            .code(400); //.message('Password required')    

    const response = await mcc.updateMailboxes({
        "attr": {
            "active": "1",
            "password": password,
            "password2": password,
            "sender_acl": [],
            "sogo_access": "0"
        },
        "items": [
            `${tokens[token].email}@imap.fi`
        ]
    })

    return {
        message: "Salasana vaihdettu onnistuneesti!"
    };
}