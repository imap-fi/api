const { v4: uuidv4 } = require("uuid");

const mcc = require('../app').mcc;
const tokens = require('../app').tokens;

exports.default = async(request, h) => {
    const requestId = uuidv4();
    const local_part = request.payload.email;
    const password = request.payload.password;

    // TODO: implement proper error and success logging
    // TODO: check email validity before trying to send it to API and verify that enough slots are available
    // TODO: in case Hennig does not answer use axios first and then fork the mailcow-api

    if (!local_part)
        return h
            .response({ message: "Sähköposti puuttuu.", requestId })
            .code(400); //.message('Email required')
    if (!password)
        return h
            .response({ message: "Salasana puuttuu.", requestId })
            .code(400); //.message('Password required')
    if (password.length < 8)
        return h
            .response({ message: "Salasana tulee olla vähintään 8 merkkiä.", requestId })
            .code(400); //.message('Password required')

    const mailboxInfo = await mcc.getMailboxes(`${local_part}@imap.fi`);
    if (Object.keys(mailboxInfo).length !== 0)
        return h
            .response({ message: "Käyttäjänimi on jo varattu.", requestId })
            .code(410); //.message('Username is already in the use')

    const name = local_part.replace(".", " ");

    const success = await mcc.addMailbox({
        domain: "imap.fi",
        local_part,
        name,
        password,
        quota: 512,
    });

    if (!success) {
        return h
            .response({ message: "Jotain meni pieleen.", requestId })
            .code(500);
    }

    const token = uuidv4();

    tokens[token] = {
        "email": local_part,
        "time": +Date.now()
    }

    return {
        message: "Tili luotiin onnistuneesti!",
        requestId,
        token,
    };
}