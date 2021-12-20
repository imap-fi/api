require("dotenv").config();
const Hapi = require("@hapi/hapi");
const { MailcowApiClient } = require("mailcow-api");
const { v4: uuidv4 } = require("uuid");
const { ImapFlow } = require("imapflow");

const init = async () => {
  const mcc = new MailcowApiClient(
    process.env.MAILCOW_API_BASEURL,
    process.env.MAILCOW_API_KEY
  );

  const server = Hapi.server({
    port: 3000,
    host: "localhost",
  });

  console.log(await mcc.getDomain("imap.fi"));

  server.route({
    method: "POST",
    path: "/auth",
    handler: (request, h) => {
      const requestId = uuidv4();
      const email = request.payload.email;
      const pass = request.payload.password;

      const imapClient = new ImapFlow({
        host: "imap.fi",
        port: 143,
        secure: false,
        disableAutoIdle: true,
        rejectUnauthorized: false,
        auth: {
          user: `${email}@imap.fi`,
          pass,
        },
      });

      imapClient
        .connect()
        .then(() => {
          let success = true;
        })
        .catch(() => {
          let success = false;
        });

      return {
        success
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
    handler: (request, h) => {
      return {
        h: "Hello World!",
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
