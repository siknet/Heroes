import gradio as gr
import sqlite3
from opencc import OpenCC
import pandas as pd

# --- 初始化配置 ---
DB_FILE = 'taibei.db'  # 确保这个文件名和上传的数据库文件名一致
cc = OpenCC('t2s.json')  # 用于将用户输入统一转为简体

def search_hero(name_query):
    """
    核心查询函数：根据用户输入的姓名进行查询
    """
    if not name_query or not name_query.strip():
        # 如果输入为空，返回一个空表格和提示信息
        return pd.DataFrame(), "请输入姓名进行查询"

    # 1. 规范化查询词：转为简体
    simplified_query = cc.convert(name_query.strip())
    
    # 使用 FTS 的 MATCH 语法进行模糊查询
    # 我们在查询词前后加上 * 通配符，以便匹配名字的任何部分
    fts_match_query = f'"{simplified_query}"*'

    conn = sqlite3.connect(DB_FILE)
    # 设置 row_factory 让结果可以按列名访问，方便转为DataFrame
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 2. 执行FTS查询
    # JOIN 主表 hero 来获取所有详细信息
    sql_query = """
        SELECT
            h."姓名",
            h."殉難日期",
            h."入祀年月",
            h."牌位號碼",
            h."奉祀地點",
            h."英烈事蹟"
        FROM hero h
        JOIN hero_fts fts ON h.id = fts.rowid
        WHERE fts."简体姓名" MATCH ?
        ORDER BY h.id
        LIMIT 100; -- 限制最多返回100条结果，防止结果过多
    """
    
    cursor.execute(sql_query, (fts_match_query,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return pd.DataFrame(), "查无此人"

    # 3. 将查询结果转换为 Pandas DataFrame 以便在 Gradio 中展示
    results_df = pd.DataFrame(rows, columns=["姓名", "殉難日期", "入祀年月", "牌位號碼", "奉祀地點", "英烈事蹟"])
    
    return results_df, f"查询到 {len(results_df)} 条相关记录"

# --- 使用 Gradio 创建界面 ---
with gr.Blocks(theme=gr.themes.Soft()) as app:
    gr.Markdown("# 忠烈祠奉祀英烈查询系统")
    gr.Markdown("在超过40万名英烈记录中查询。支持输入简体或繁体姓名进行模糊搜索。")
    
    with gr.Row():
        name_input = gr.Textbox(
            label="输入姓名", 
            placeholder="例如: 张自忠 / 張自忠 (输入单字或多个字均可)"
        )
    
    search_button = gr.Button("查询", variant="primary")
    
    status_output = gr.Markdown("---") # 用于显示查询状态，如“查到 N 条记录”
    results_output = gr.DataFrame(
        label="查询结果",
        interactive=False # 表格内容不可编辑
    )
    
    # 绑定按钮点击事件和回车事件
    search_button.click(fn=search_hero, inputs=name_input, outputs=[results_output, status_output])
    name_input.submit(fn=search_hero, inputs=name_input, outputs=[results_output, status_output])

    gr.Examples(
        examples=["张自忠", "高志航", "赵登禹", "戴安澜"],
        inputs=name_input
    )

app.launch()