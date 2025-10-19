// pages/index.js

// 注意：这里使用 defaultConverter 作为默认导入的名称
import React, { useState, useCallback } from 'react';
import defaultConverter from 'opencc-js'; // <-- 正确的默认导入方式

// 初始化 OpenCC 转换器：
// 默认导入的对象（defaultConverter）本身就是用于配置和创建转换函数的函数
const converter = defaultConverter('t2s'); 

export default function HeroQueryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = useCallback(async () => {
    // 检查查询内容是否为空
    if (!query.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. 核心步骤：将用户输入统一转换为简体中文
      const simplifiedQuery = converter(query.trim());
      
      // 2. 调用 Vercel API 接口
      // 接口地址是 /api/search，并将转换后的简体查询词作为 q 参数
      const apiEndpoint = `/api/search?q=${encodeURIComponent(simplifiedQuery)}`;
      
      const response = await fetch(apiEndpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API 查询失败');
      }

      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      // 捕获错误并显示给用户
      setError(err.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query]); // 依赖项为 query 状态

  // 渲染查询结果的组件
  const renderResults = () => {
    if (loading) {
      return <p>正在查询数据库，请稍候...</p>;
    }

    if (error) {
      return <p style={{ color: 'red' }}>查询错误: {error} (请检查您的 API 是否已部署且正常工作)</p>;
    }

    if (results === null) {
      return null;
    }
    
    if (results.count === 0) {
      return <p>未找到匹配 "{query}" 的记录。</p>;
    }

    // 渲染结果表格
    return (
      <div>
        <p>查询到 {results.count} 条相关记录。</p>
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '15px', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left', backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '12px' }}>姓名 (繁)</th>
              <th style={{ padding: '12px' }}>简体姓名</th>
              <th style={{ padding: '12px' }}>殉難日期</th>
              <th style={{ padding: '12px' }}>入祀年月</th>
              <th style={{ padding: '12px' }}>奉祀地點</th>
              <th style={{ padding: '12px' }}>匹配度 (Rank)</th>
            </tr>
          </thead>
          <tbody>
            {results.results.map((hero) => (
              <tr key={hero.id} style={{ borderBottom: '1px dotted #eee' }}>
                <td style={{ padding: '8px' }}>{hero.姓名}</td>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>{hero.简体姓名}</td>
                <td style={{ padding: '8px' }}>{hero.殉難日期}</td>
                <td style={{ padding: '8px' }}>{hero.入祀年月}</td>
                <td style={{ padding: '8px' }}>{hero.奉祀地點}</td>
                <td style={{ padding: '8px' }}>{hero.rank ? hero.rank.toFixed(4) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    // 简单的内联样式，以复现您之前截图的界面风格
    <div style={{ maxWidth: '1000px', margin: '50px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>台北忠烈祠英烈查询系统</h1>
      <p style={{ color: '#555' }}>全部记录大约 40 万条。支持输入简体或繁体姓名进行模糊搜索。</p>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="请输入姓名（例如：陸皓東 或 陆皓东）"
          // 按下回车键时触发查询
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ flexGrow: 1, padding: '12px', fontSize: '16px', border: '1px solid #0070f3', borderRadius: '4px' }}
        />
        <button 
          onClick={handleSearch} 
          disabled={loading || !query.trim()}
          style={{ 
            padding: '12px 25px', 
            fontSize: '16px', 
            backgroundColor: loading ? '#aaa' : '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {loading ? '查询中...' : '查询'}
        </button>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>查询结果</h2>
        {renderResults()}
      </div>
    </div>
  );

}
