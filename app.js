require("dotenv").config();
const Hapi = require("@hapi/hapi");
const { MailcowApiClient } = require("mailcow-api");
const { v4: uuidv4 } = require("uuid");
const { ImapFlow } = require("imapflow");

let tokens = {};

const init = async () => {
  const mcc = new MailcowApiClient(
    process.env.MAILCOW_API_BASEURL,
    process.env.MAILCOW_API_KEY
  );

  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: "localhost",
  });

  console.log(await mcc.getDomain("imap.fi"));

  server.route({
    method: "POST",
    path: "/auth",
    handler: async (request, h) => {
      const email = request.payload.email;
      const pass = request.payload.password;

      const imapClient = new ImapFlow({
        host: "server.imap.fi",
        port: 993,
        secure: true,
        disableAutoIdle: true,
        rejectUnauthorized: false,
        auth: {
          user: `${email}@imap.fi`,
          pass,
        },
      });

      let success = true;
      const token = uuidv4();
      try {
        await imapClient.connect();
        tokens[token] = {
          email, // only local part
          time: +new Date(),
        };
      } catch (error) {
        success = false;
      }

      return {
        success,
        token: success ? token : false,
      };
    },
  });

  server.route({
    method: "POST",
    path: "/account",
    handler: async (request, h) => {
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

      const mailboxInfo = await mcc.getMailboxes(`${local_part}@imap.fi`);
      if (Object.keys(mailboxInfo).length !== 0)
        return h
          .response({ message: "Käyttäjänimi on jo varattu.", requestId })
          .code(410); //.message('Password required')

      const name = local_part.replace(".", " ");

      const success = await mcc.addMailbox({
        domain: "imap.fi",
        local_part,
        name,
        quota: 1000,
      });

      if (!success) {
        return h
          .response({ message: "Jotain meni pieleen.", requestId })
          .code(500);
      }

      return {
        message: "Tili luotu onnistuneesti!",
        requestId,
      };
    },
  });

  server.route({
    method: "GET",
    path: "/account",
    handler: async (request, h) => {
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

      const mailBox = await mcc.getMailboxes(`${local_part}@imap.fi`);
      
      return {
        mailBox,
      };
    },
  });

  server.route({
    method: "PUT",
    path: "/account",
    handler: (request, h) => {
      return {
        h: "Hello World!",
      };
    },
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
