import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = 3000;

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

// Enable CORS for ALL origins to avoid "Failed to fetch" during local dev
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

// Health check endpoint
app.get('/', (req, res) => {
    res.send(`
        <h1>HAF Middleware Server is Running</h1>
        <p>This is the API Backend.</p>
        <p>Please open your <strong>Frontend URL</strong> (usually http://localhost:5173) to use the app.</p>
    `);
});

// Check connection on startup
pool.query('SELECT 1', (err, res) => {
    if (err) {
        console.error('⚠️ Warning: Error connecting to HAF SQL database:', err.message);
        console.error('   (Check your internet connection or if the host is reachable)');
    } else {
        console.log('✅ Successfully connected to HAF SQL database.');
    }
});

app.post('/search', async (req, res) => {
    const { keywords, days } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ error: 'Keywords array is required' });
    }

    const searchDays = days || 3;
    const timeInterval = `${searchDays} days`;

    // Sanitize keywords for SQL usage
    const sanitizedKeywords = keywords.map(k => k.replace(/'/g, "''"));
    
    // Construct ILIKE conditions
    const keywordConditions = sanitizedKeywords
        .map(k => `(body ILIKE '%${k}%' OR title ILIKE '%${k}%')`)
        .join(' OR ');

    // Query hafsql.comments
    const query = `
        SELECT 
            author, 
            permlink, 
            title, 
            left(body, 500) as body_preview, 
            created, 
            parent_permlink as category
        FROM 
            hafsql.comments 
        WHERE 
            parent_author = '' 
            AND created > NOW() - INTERVAL '${timeInterval}' 
            AND (${keywordConditions}) 
        ORDER BY 
            created DESC 
        LIMIT 50;
    `;

    try {
        console.log(`🔎 Executing search for: ${keywords.join(', ')}`);
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

app.listen(port, () => {
    console.log(`\n🚀 Backend Server running at http://localhost:${port}`);
    console.log(`👉 Please start your frontend (npm run dev) and open that URL.`);
});