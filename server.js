require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const { migrate } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

migrate();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'partials/header');

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use('/', require('./routes/index'));
app.use('/novels', require('./routes/novels'));
app.use('/novels/:id/chapters', require('./routes/chapters'));

app.use((req, res) => {
  res.status(404).render('error', { title: '页面不存在', message: '找不到请求的页面' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: '服务器错误', message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`[Server] 网文管理系统已启动: http://localhost:${PORT}`);
});
