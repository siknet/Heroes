import { sql } from '@vercel/postgres'; 

/**
 * Next.js API 路由: /api/search?q=关键词
 */
export default async function handler(req, res) {
  // 1. 检查请求方法和查询参数
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { q } = req.query; 
  if (!q || q.length === 0) {
    return res.status(400).json({ error: 'Missing search query "q"' });
  }

  // 2. 构造全文搜索查询字符串
  // 将用户输入的关键词转换为 PostgeSQL 的 tsquery 格式（例如: "张三 李四" => "张三 & 李四"）
  const search_query = q.trim().replace(/\s+/g, ' & ');
  
  try {
    // 3. 执行全文搜索查询
    // 注意：请确保您的表名是 heroes
    const { rows } = await sql`
        SELECT 
            "id", 
            "姓名", 
            "简体姓名", 
            "殉難日期",
            "入祀年月",
            "奉祀地點",
            ts_rank("fts_vector", to_tsquery('pg_catalog.simple', ${search_query})) as rank
        FROM heroes 
        WHERE "fts_vector" @@ to_tsquery('pg_catalog.simple', ${search_query})
        ORDER BY rank DESC, id ASC
        LIMIT 50; 
    `;

    // 4. 返回查询结果
    return res.status(200).json({ 
        query: q,
        search_query_used: search_query,
        count: rows.length,
        results: rows 
    });

  } catch (error) {
    console.error('Database query failed:', error);
    return res.status(500).json({ 
        error: 'Database query failed'
    });
  }
}