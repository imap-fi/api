const mysql = require('mysql');
const twinBcrypt = require('twin-bcrypt')

const connection = mysql.createConnection({
    host: process.env.MAILCOW_API_BASEURL.replace('https://', ''),
    user: 'root',
    password: process.env.DBROOT,
    database: 'mailcow'
});

connection.connect();

// Old auth: https://pastebin.fi/p/Ohby4U6uhNVQ
exports.auth = async(email, pass) => {
    const data = await new Promise((resolve, reject) => {
        connection.query('SELECT username, password FROM mailbox WHERE username=?', [email + "@imap.fi"], (err, rows, fields) => {
            if (err)
                return reject(err);
            resolve(rows);
        });
    });
    if (data.length === 0)
        return false;

    const hash = data[0].password.replace('{BLF-CRYPT}', '')

    const authSuccess = twinBcrypt.compareSync(pass, hash)

    console.log("Authentication tried for account " + email + " with status: " + authSuccess)

    return authSuccess
}