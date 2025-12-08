import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Helper to fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const app = express();

// Use the PORT environment variable if available (Render), otherwise 3000
const PORT = process.env.PORT || 3000;

// Configuration for the Mahdiyari HAF SQL Node
const dbConfig = {
    host: 'hafsql-sql.mahdiyari.info',
    port: 5432,
    database: 'haf_block_log',
    user: 'hafsql_public',
    password: 'hafsql_public',
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    // SSL is explicitly disabled as the server does not support it
    ssl: false
};

const pool = new Pool(dbConfig);

// Enable CORS for ALL origins
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Request Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Serve static files from the React build directory (dist) if it exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

// Check connection on startup
pool.query('SELECT 1', (err, res) => {
    if (err) {
        console.error('⚠️ Warning: Error connecting to HAF SQL database:', err.message);
    } else {
        console.log('✅ Successfully connected to HAF SQL database.');
    }
});

// API Routes
app.post('/search', async (req, res) => {
    const { keywords, days } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ error: 'Keywords array is required' });
    }

    // If days is provided and > 0, we restrict by date. If 0 or null, we assume 'All Time'.
    // Default to 3 days if undefined, unless strictly passed as 0.
    const searchDays = (days === undefined) ? 3 : Number(days);
    
    let dateCondition = '';
    
    if (searchDays > 0) {
        dateCondition = `AND created > NOW() - INTERVAL '${searchDays} days'`;
    } 
    // If searchDays is 0 (All Time), dateCondition remains empty string.

    // Sanitize keywords for SQL usage
    const sanitizedKeywords = keywords.map(k => k.replace(/'/g, "''"));
    
    // Construct ILIKE conditions
    const keywordConditions = sanitizedKeywords
        .map(k => `(body ILIKE '%${k}%' OR title ILIKE '%${k}%')`)
        .join(' OR ');

    // Query hafsql.comments
    // We select the FULL body now so the frontend can extract images correctly.
    const query = `
        SELECT 
            author, 
            permlink, 
            title, 
            body, 
            created, 
            parent_permlink as category
        FROM 
            hafsql.comments 
        WHERE 
            parent_author = '' 
            ${dateCondition}
            AND (${keywordConditions}) 
        ORDER BY 
            created DESC 
        LIMIT 500;
    `;

    try {
        console.log(`🔎 Executing search for: ${keywords.join(', ')} (${searchDays === 0 ? 'All Time' : searchDays + ' days'})`);
        const result = await pool.query(query);
        console.log(`✅ Found ${result.rowCount} posts.`);
        
        res.json({
            success: true,
            data: result.rows,
            debug: {
                generatedSql: query,
                rowCount: result.rowCount
            }
        });
    } catch (error) {
        console.error('❌ Query Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            debug: { generatedSql: query }
        });
    }
});

// Catch-all route for SPA (React): Serves index.html for any unknown route
// Updated to use Regex /.*/ for Express 5 compatibility (instead of '*')
app.get(/.*/, (req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
                <h1 style="color: #e11d48;">Backend is Running 🚀</h1>
                <p>However, the <strong>Frontend Build</strong> was not found at:</p>
                <code style="background: #eee; padding: 4px; border-radius: 4px;">${indexPath}</code>
                
                <h3>How to fix this?</h3>
                <ul>
                    <li><strong>Developing Locally?</strong> Keep this terminal open and run <code>npm run dev</code> in a <strong>new terminal</strong> to start the React App.</li>
                    <li><strong>Deploying to Production?</strong> Run <code>npm run build</code> first to generate the <code>dist</code> folder.</li>
                </ul>
            </div>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Backend Server running on port ${PORT}`);
    console.log(`👉 If running locally (API only): http://localhost:${PORT}`);
});