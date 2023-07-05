const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, `.env`) });
module.exports = {
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    AUTH_TOKEN: process.env.AUTH_TOKEN,
}