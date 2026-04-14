    const express = require('express');
    const fs = require('fs');
    const path = require('path');
    const app = express();
    const PORT = process.env.PORT || 3000;

    // 1. 系統日誌監控 (Global Middleware)
    // 確保每一筆進入伺服器的請求都會被記錄到 access.log
    app.use((req, res, next) => {
        const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
        const logMessage = `[${now}] ${req.method} ${req.url}\n`;
        
        // 使用同步追加方式寫入日誌
        try {
            fs.appendFileSync(path.join(__dirname, 'access.log'), logMessage);
        } catch (err) {
            console.error('無法寫入日誌:', err);
        }
        
        next(); // 繼續執行後續的路由處理
    });

    // 2. 靜態資源處理 (Static Middleware)
    // 將 public 資料夾設為靜態資源根目錄，自動渲染 index.html
    app.use(express.static(path.join(__dirname, 'public')));

    // 3. 安全性管理後台 (Route Authorization)
    // 檢查 URL 查詢字串是否包含正確授權碼 code=521
    app.get('/admin', (req, res) => {
        const authCode = req.query.code;

        if (authCode === '521') {
            res.status(200).send('<h1>Welcome to Admin (歡迎進入後台)</h1><p>身份驗證成功。</p>');
        } else {
            res.status(403).send('<h1>Access Denied (暗號錯誤)</h1><p>您沒有權限訪問此頁面。</p>');
        }
    });

    // 4. 動態產品查詢系統 (Dynamic Routing)
    app.get('/product/:model.html', (req, res) => {
        const modelParam = req.params.model; // 取得網址上的型號參數

        // 讀取本地 data/lens.json
        try {
            const rawData = fs.readFileSync(path.join(__dirname, 'data', 'lens.json'));
            const { data } = JSON.parse(rawData); // 使用解構賦值提取 data 陣列

            // 在 JSON 資料中搜尋對應產品
            const product = data.find(item => item.model.toLowerCase() === modelParam.toLowerCase());

            if (product) {
                // 使用樣板字串動態生成 HTML
                const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="zh-TW">
                    <head>
                        <meta charset="UTF-8">
                        <title>${product.name} - Sony 展示中心</title>
                        <style>
                            body { font-family: sans-serif; text-align: center; padding: 50px; background: #f4f4f4; }
                            .card { background: white; padding: 20px; border-radius: 15px; display: inline-block; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                            img { max-width: 300px; border-radius: 10px; }
                            h1 { color: #333; }
                            a { display: block; margin-top: 20px; color: #0066cc; text-decoration: none; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h1>${product.name}</h1>
                            <p>型號：${product.model}</p>
                            <img src="${product.imageUrl}" alt="${product.name}" onerror="this.src='https://placehold.co/300x200?text=No+Image'">
                            <p>${product.description || '專業級影像設備'}</p>
                            <a href="/">回首頁</a>
                        </div>
                    </body>
                    </html>
                `;
                res.send(htmlContent);
            } else {
                // 找不到資料時回傳 404
                res.status(404).send('<h1>404 找不到型號</h1><p>抱歉，我們找不到您搜尋的產品。</p>');
            }
        } catch (err) {
            res.status(500).send('伺服器內部錯誤，無法讀取資料。');
        }
    });

    // 5. 萬用防呆路由 (Wildcard Route)
    // 使用正規表示式 /.*$/ 配合 app.all() 處理所有未定義路徑，以避免最新版本 path-to-regexp 的錯誤
    app.all(/.*$/, (req, res) => {
        res.status(404).send(`
            <!DOCTYPE html>
            <html lang="zh-TW">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #222; color: white; }
                    .container { text-align: center; }
                    h1 { font-size: 5rem; margin: 0; color: #ff4d4d; }
                    p { font-size: 1.5rem; }
                    a { color: #00ccff; text-decoration: none; border: 1px solid #00ccff; padding: 10px 20px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>404</h1>
                    <p>404 Not Found (抱歉，路徑不存在)</p>
                    <a href="/">返回首頁</a>
                </div>
            </body>
            </html>
        `);
    });

    app.listen(PORT, () => {
        console.log(`Sony 展示系統運作中：http://localhost:${PORT}`);
    });