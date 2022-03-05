require("dotenv").config();
const Hapi = require("@hapi/hapi");
const { MailcowApiClient } = require("mailcow-api");

let tokens = {};

const mcc = new MailcowApiClient(
    process.env.MAILCOW_API_BASEURL,
    process.env.MAILCOW_API_KEY
);

exports.tokens = tokens
exports.mcc = mcc

const init = async() => {
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: "0.0.0.0",
    });

    server.route({
        method: "POST",
        path: "/auth",
        handler: require('./handlers/auth').default,
    });

    server.route({
        method: "POST",
        path: "/account",
        handler: require('./handlers/signUp').default,
    });

    server.route({
        method: "GET",
        path: "/account",
        handler: require('./handlers/accountData').default,
    });

    server.route({
        method: "PUT",
        path: "/account",
        handler: require('./handlers/changePassword').default,
    });

    await server.start();
    console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
    console.log(err);
    process.exit(1);
});

init();