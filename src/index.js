const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');

const a = require('./utils/a');
const { getReleasesOrUpdate, getActiveReleasesOrUpdate } = require('./data');

const app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.set('views', path.resolve(__dirname, 'views'));

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
  });
  app.enable('view cache');
}

app.get(
  '/releases.json',
  a(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(await getReleasesOrUpdate());
  }),
);

app.get(
  '/active.json',
  a(async (req, res) => {
    res.json(await getActiveReleasesOrUpdate());
  }),
);

app.use('/', require('./routes/home'));
app.use('/release', require('./routes/release'));
app.use('/releases', require('./routes/releases'));
app.use('/history', require('./routes/history'));
app.use('/release-build', require('./routes/release-build'));
app.use('/pr', require('./routes/pr'));
app.use('/pr-lookup', require('./routes/pr-lookup'));

app.use(
  express.static(path.resolve(__dirname, 'static'), {
    fallthrough: true,
  }),
);
// this middleware redirects all unknown routes to /, which may not be ideal:
// app.use((req, res) => {
//   res.redirect('/');
// });

// Better approach: Serve a 404 page instead
app.use((req, res) => {
  res.status(404).render('404');
});

const server = app.listen(process.env.PORT || 8080, () => {
  console.log('Electron release history listening', `http://localhost:${server.address().port}`);
});
