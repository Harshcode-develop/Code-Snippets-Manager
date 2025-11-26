const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

async function checkSchema() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const [folderColumns] = await connection.query("SHOW COLUMNS FROM folders LIKE 'is_starred'");
        console.log('Folders is_starred column:', folderColumns);

        const [snippetColumns] = await connection.query("SHOW COLUMNS FROM snippets LIKE 'is_starred'");
        console.log('Snippets is_starred column:', snippetColumns);

        await connection.end();
    } catch (error) {
        console.error('Error checking schema:', error);
    }
}

checkSchema();
