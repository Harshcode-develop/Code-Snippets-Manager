require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // Use mysql2/promise for async/await
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection Pool ---
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'code_snippets_manager_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- Helper to ensure is_starred column exists ---
const ensureStarredColumns = async () => {
    try {
        const checkColumn = async (table) => {
            const [columns] = await dbPool.query(`SHOW COLUMNS FROM ${table} LIKE 'is_starred'`);
            if (columns.length === 0) {
                console.log(`Adding is_starred column to ${table}...`);
                await dbPool.query(`ALTER TABLE ${table} ADD COLUMN is_starred BOOLEAN DEFAULT FALSE`);
            }
        };
        await checkColumn('folders');
        await checkColumn('snippets');
        console.log('Database schema checked for starred feature.');
    } catch (error) {
        console.error('Error checking/updating schema:', error);
    }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login/signup requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
};

// --- Auth Routes ---
app.post('/api/auth/signup', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        // Basic validation
        if (!email || !password || password.length < 6) {
            return res.status(400).json({ message: 'Invalid input. Password must be at least 6 characters.' });
        }
        const [rows] = await dbPool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await dbPool.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
        res.status(201).json({ message: 'User created successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const [users] = await dbPool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        // Use a shorter expiration for better security
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, message: 'Logged in successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// --- GOOGLE AUTH ROUTE ---
app.post('/api/auth/google', async (req, res) => {
    try {
        const { credential } = req.body;



        if (!credential) {
            return res.status(400).json({ message: 'Credential not provided.' });
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email } = payload;

        let [users] = await dbPool.query('SELECT * FROM users WHERE email = ?', [email]);
        let user = users[0];

        if (!user) {
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            const [newUser] = await dbPool.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
            user = { id: newUser.insertId, email };
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, message: 'Logged in successfully!' });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ message: 'Google authentication failed.' });
    }
});


// --- Data Routes ---
app.get('/api/data', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const [folders] = await dbPool.query('SELECT * FROM folders WHERE user_id = ?', [userId]);
        const [snippets] = await dbPool.query('SELECT * FROM snippets WHERE user_id = ? ORDER BY id DESC', [userId]);

        const buildTree = (list) => {
            const map = {};
            const roots = [];
            list.forEach((item, i) => {
                map[item.id] = i;
                list[i].subfolders = [];
                list[i].snippets = snippets.filter(s => s.folder_id === item.id);
            });

            list.forEach(item => {
                if (item.parent_id !== null) {
                    if (list[map[item.parent_id]]) {
                       list[map[item.parent_id]].subfolders.push(item);
                    }
                } else {
                    roots.push(item);
                }
            });
            return roots;
        };

        const folderTree = buildTree(folders);
        const standaloneSnippets = snippets.filter(s => s.folder_id === null);

        res.json({ folders: folderTree, standaloneSnippets });
    } catch (error) {
        console.error("Get Data Error:", error);
        res.status(500).json({ message: 'Failed to fetch data.' });
    }
});

app.post('/api/folders', authenticateToken, async (req, res) => {
    try {
        const { name, parentId } = req.body;
        const userId = req.user.userId;

        const [existingFolders] = await dbPool.query(
            'SELECT * FROM folders WHERE user_id = ? AND name = ? AND parent_id <=> ?',
            [userId, name, parentId || null] // <=> is a NULL-safe equality operator
        );
         if (existingFolders.length > 0) {
            return res.status(409).json({ message: 'A folder with this name already exists.' });
        }

        const [result] = await dbPool.query('INSERT INTO folders (user_id, name, parent_id, is_starred) VALUES (?, ?, ?, FALSE)', [userId, name, parentId || null]);
        res.status(201).json({ id: result.insertId, name, user_id: userId, parent_id: parentId || null, subfolders: [], snippets: [], is_starred: false });
    } catch (error) {
        console.error("Create Folder Error:", error);
        res.status(500).json({ message: 'Failed to create folder.' });
    }
});

// --- NEW ROUTE FOR RENAMING FOLDERS ---
app.put('/api/folders/:id', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        const { id } = req.params;
        const userId = req.user.userId;

        if (!name) {
            return res.status(400).json({ message: 'Folder name is required.' });
        }

        const [result] = await dbPool.query(
            'UPDATE folders SET name = ? WHERE id = ? AND user_id = ?',
            [name, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Folder not found or you are not authorized to edit it.' });
        }

        res.json({ message: 'Folder renamed successfully.' });
    } catch (error) {
        console.error("Rename Folder Error:", error);
        res.status(500).json({ message: 'Failed to rename folder.' });
    }
});

app.post('/api/snippets', authenticateToken, async (req, res) => {
    try {
        const { title, code, folderId } = req.body;
        const userId = req.user.userId;

        const [existingSnippets] = await dbPool.query(
            'SELECT * FROM snippets WHERE user_id = ? AND title = ? AND folder_id <=> ?',
            [userId, title, folderId || null]
        );

        if (existingSnippets.length > 0) {
            return res.status(409).json({ message: 'A snippet with this title already exists.' });
        }

        const [result] = await dbPool.query('INSERT INTO snippets (user_id, title, code, folder_id, is_starred) VALUES (?, ?, ?, ?, FALSE)', [userId, title, code, folderId || null]);
        res.status(201).json({ id: result.insertId, title, code, user_id: userId, folder_id: folderId || null, is_starred: false });
    } catch (error) {
        console.error("Create Snippet Error:", error);
        res.status(500).json({ message: 'Failed to create snippet.' });
    }
});

app.put('/api/snippets/:id', authenticateToken, async (req, res) => {
    try {
        const { title, code } = req.body;
        const { id } = req.params;
        const userId = req.user.userId;
        await dbPool.query('UPDATE snippets SET title = ?, code = ? WHERE id = ? AND user_id = ?', [title, code, id, userId]);
        res.json({ message: 'Snippet updated successfully' });
    } catch (error) {
        console.error("Update Snippet Error:", error);
        res.status(500).json({ message: 'Failed to update snippet.' });
    }
});

app.delete('/api/folders/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        await dbPool.query('DELETE FROM folders WHERE id = ? AND user_id = ?', [id, userId]);
        res.sendStatus(204);
    } catch (error) {
        console.error("Delete Folder Error:", error);
        res.status(500).json({ message: 'Failed to delete folder.' });
    }
});

app.delete('/api/snippets/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        await dbPool.query('DELETE FROM snippets WHERE id = ? AND user_id = ?', [id, userId]);
        res.sendStatus(204);
    } catch (error) {
        console.error("Delete Snippet Error:", error);
        res.status(500).json({ message: 'Failed to delete snippet.' });
    }
});

// --- STAR TOGGLE ROUTES ---
app.put('/api/folders/:id/star', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        // Toggle the is_starred status
        await dbPool.query('UPDATE folders SET is_starred = NOT is_starred WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Folder star status updated.' });
    } catch (error) {
        console.error("Toggle Folder Star Error:", error);
        res.status(500).json({ message: 'Failed to update folder star status.' });
    }
});

app.put('/api/snippets/:id/star', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        // Toggle the is_starred status
        await dbPool.query('UPDATE snippets SET is_starred = NOT is_starred WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Snippet star status updated.' });
    } catch (error) {
        console.error("Toggle Snippet Star Error:", error);
        res.status(500).json({ message: 'Failed to update snippet star status.' });
    }
});

// --- Server Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await ensureStarredColumns();
  console.log(`Server is running on port ${PORT}`);
});
