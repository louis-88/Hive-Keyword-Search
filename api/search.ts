
import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const { Pool } = pg;

// Configuration for the Mahdiyari HAF SQL Node
const dbConfig = {
    host: 'hafsql-sql.mahdiyari.info',
    port: 5432,
    database: 'haf_block_log',
    user: 'hafsql_public',
    password: 'hafsql_public',
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    ssl: false
};

const pool = new Pool(dbConfig);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { keywords, days, author, startDate, endDate } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ error: 'Keywords array is required' });
    }

    let dateCondition = '';

    if (startDate && endDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }
        dateCondition = `AND created BETWEEN '${startDate}' AND '${endDate} 23:59:59'`;
    } else {
        const searchDays = (!days || Number(days) <= 0) ? 3 : Number(days);
        dateCondition = `AND created > NOW() - INTERVAL '${searchDays} days'`;
    }

    const sanitizedKeywords = keywords.map(k => k.replace(/'/g, "''"));
    const keywordConditions = sanitizedKeywords
        .map(k => `(body ILIKE '%${k}%' OR title ILIKE '%${k}%')`)
        .join(' OR ');

    let authorCondition = '';
    if (author && typeof author === 'string' && author.trim().length > 0) {
        const safeAuthor = author.trim().replace(/[^a-z0-9\.-]/g, '');
        if (safeAuthor) {
            authorCondition = `AND author = '${safeAuthor}'`;
        }
    }

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
            ${authorCondition}
            AND (${keywordConditions}) 
        ORDER BY 
            created DESC;
    `;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(query);
            return res.status(200).json({
                success: true,
                data: result.rows,
                debug: {
                    generatedSql: query,
                    rowCount: result.rowCount
                }
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('❌ Query Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            debug: { generatedSql: query }
        });
    }
}
