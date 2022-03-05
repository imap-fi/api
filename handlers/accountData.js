const { v4: uuidv4 } = require("uuid");

const tokens = require('../app').tokens;
const mcc = require('../app').mcc;

exports.default = async(request, h) => {
    const requestId = uuidv4();

    // TODO: tarkastukset eivät ole kunnossa (jos ei ole mitään query dataa tai authorization headeria ei ole olemassa)

    const token = request.headers.authorization.replace("Bearer ", "")
    const local_part = request.query.email;

    if (!local_part)
        return h
            .response({ message: "Sähköposti puuttuu.", requestId })
            .code(400); //.message('Email required')
    if (!token)
        return h
            .response({ message: "Autentikaatioavain puuttuu.", requestId })
            .code(400); //.message('Password required')



    if (!(token in tokens))
        return h
            .response({ message: "Ei pääsyä (kokeile kirjautua uudestaan).", requestId })
            .code(401);

    if (!(local_part === tokens[token].email))
        return h
            .response({ message: "Eipäs kurkita.", requestId })
            .code(400); //.message('Password required')


    const mailBox = await mcc.getMailboxes(`${local_part}@imap.fi`);

    return {
        mailBox,
    };
}