//JWT
let jwt = require('jsonwebtoken')
const sequelize = require('sequelize')
//
const pazzwerd = require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const zz = process.env.pazzwerd;
const z2 = process.env.Salty;
const bodyParser = require('body-parser');

const cookieParser = require('cookie-parser');

const router = require('./routes/users');
//Session, cookies
const session = require('express-session');

const pgp = require('pg-promise')();
const path = require('path');
const VIEWS_PATH = path.join(__dirname, 'views');

const bcrypt = require('bcrypt');

const CONNECTION_STRING = {
	host: 'localhost',
	port: 5432,
	database: 'newsdb',
	user: 'postgres',
	password: zz,
};

const db = pgp(CONNECTION_STRING);

const mustacheExpress = require('mustache-express');
//This is why views are called by only a name without / or an extension
app.engine('mustache', mustacheExpress(VIEWS_PATH + '/partials', '.mustache'));
const SALT_ROUNDS = 10; //Higher the number, longer: difficulty in password
const myPlaintextPassword = 's0//P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

//These two might be overlooked
app.set('views', VIEWS_PATH);
app.set('view engine', 'mustache');

app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ extended: false }));
//router starter
app.use(router);
app.use(cookieParser());
app.use(express.json())
app.use(
	session({
		secret: z2,
		resave: true,
		saveUninitialized: true,
	})
);

app.post('/login', (req, res) => {
    //let {username, password} = req.body
	let username = req.body.username;
	let password = req.body.password;
	db.one(
		'SELECT userid, username, password FROM users WHERE username = $1',
		[username]
	)
		.then((user) => {
			if (user) {
				if (req.session) {
					req.session.user = { userId: user.userId, username: user.username };
				}
				console.log(user.userid);
				res.redirect('articles');
				// res.redirect('articles');
			} else {
				console.log('Not Success!');
				res.render('login', { message: 'Username or Password not correct!' });
			}
		})
		.catch((err) => console.log(err));
});

app.get('/login', (req, res) => {
	res.render('login');
});

app.get('/add-article', (req, res) => {
	res.render('add-article');
});

app.post('/add-article', (req, res) => {
	let title = req.body.title;
	let description = req.body.description;

	db.one('SELECT userid FROM users').then((user) => {
        let userId = user.userid;

		db.none('INSERT INTO articles(title,body,userid) VALUES($1,$2,$3)', [
			title,
			description,
			userId,
		]).then(() => {
			res.render('articles');
		});
	});
});

app.get('/articles', (req, res) => {
	db.oneOrNone('SELECT userid FROM users').then((user) => {
		let userId = user.userid;
		//fetch articles
		db.any('SELECT articleid, title, body from articles WHERE userid = $1', [
			userId,
		])
			.then((articles) => {
				res.render('articles', { articles });
			})
			.catch((err) => {
				console.log(err);
			});
	});
});

app.post('/register', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	db.oneOrNone('SELECT userid FROM users WHERE username = $1', [username]).then(
		(user) => {
			if (user) {
				res.render('register', { message: 'User name already exists!' });
			} else {
				bcrypt.genSalt(SALT_ROUNDS, function (err, salt) {
					bcrypt.hash(myPlaintextPassword, salt, function (err, hash) {
						db.none('INSERT INTO users(username, password) VALUES($1, $2)', [
							username,
							hash,
						])
							.then(res.render('register'))
							.catch((err) => {
								console.log(err);
							});
					});
				});
			}
		}
	);
});

app.get('/register', (req, res) => {
	res.render('register');
});

app.listen(3000);
