// This file is the heart of the project where most
// of the computation takes place

// Call the database to make queries
var connection = require('../config/database');
var bcrypt = require('bcrypt-nodejs');
/**
 * Show the register page
 * @param {*} req 
 * @param {*} res 
 */
exports.register = (req, res) => {
    res.render('register', {
        title: 'User Registeration',
        message: req.flash('message'),
        error: req.flash('error')
    });
};

/**
 * Register Function - Save the user into database. This has no view since only a post request is sent to this
 * function. Once the contents are saved, user is redirected to the photos page.
 * @param {*} req 
 * @param {*} res 
 */
exports.saveUser = (req, res) => {
    if (!req.body.name || !req.body.email || !req.body.password) {
        req.flash('error', 'All the fields are required!');
        res.redirect('/register');
        return
    }
    // Check if the email has been taken. When user registers we check if the mail is already in use or not
    connection.query('select id from users where email = ?', [req.body.email], (err, row) => {
        if (err) {
            req.flash('error', 'Something went wrong while save the user. Please try again');
            return res.redirect('/register');
        }
        //  Check if there is a record in database
        if (row.length) {
            req.flash('error', 'The email has already been taken.');
            return res.redirect('/register');
        }
        // Encrypt the password before saving in database
        password = bcrypt.hashSync(req.body.password, null, null);
        //  Save data in database using sql query. See structure of table 'users' in database
        connection.query('insert into users (name, email, password ) values (?, ?, ?)', [req.body.name, req.body.email, password], (err) => {
            if (err) {
                //  Display user friendly error message
                req.flash('error', 'Something went wrong while saving the user details. Please try again');
                return res.redirect('/register');
            }
            // Redirect to login route if the user is successfully registered
            req.flash('message', 'User created. Please login to continue.');
            res.redirect('/login');
        });
    });
};

/**
 * Show the login form.
 * @param {*} req 
 * @param {*} res 
 */
exports.login = (req, res) => {
    res.render('login', {
        title: 'Login',
        message: req.flash('message'),
        error: req.flash('error')
    });
};

/**
 * Handle the logout process
 * @param {*} req 
 * @param {*} res 
 */
//User is directed to index or home page after logging out
exports.logout = (req, res) => {
    req.logout();
    res.redirect('/');
};

/**
 * Show the upload image page
 * @param {*} req 
 * @param {*} res 
 */
// Check if the user is logged in or not. If logged in send the information to the view 
exports.upload = (req, res) => {
    user = req.isAuthenticated() ? req.user : null;
    res.render('upload', {
        title: 'Upload image',
        message: req.flash('message'),
        error: req.flash('error'),
        user: user
    });
};

/**
 * Check if an image is selected and save the image in database
 * @param {*} req 
 * @param {*} res 
 */
exports.saveImage = (req, res) => {
    if (!req.file) {
        req.flash('error', 'Please select an image to upload!');
        return res.redirect('/upload');
    }
    path = req.file.path.replace('public\\', '');
    console.log(path);
    connection.query('insert into images (image_path, users_id) values (?, ?)', [path, req.user.id], (err, row) => {
        if (err) {
            console.log(err);
            req.flash('error', 'Something went wrong while uploading the file. Please try again');
            return res.redirect('/upload');
        }
        req.flash('message', 'Image successfully uploaded!');
        return res.redirect('/upload');
    });
};

/**
 * Show the home page
 * @param {*} req 
 * @param {*} res 
 */
exports.home = (req, res) => {
    user = req.isAuthenticated() ? req.user : null;
    //select id, image path and created at from images then left join it with users from where we get the user who uploaded the image
    // used in the image view page.
    connection.query('SELECT images.id, images.image_path, users.name, images.created_at FROM `images` left join users on users.id = images.users_id ORDER by images.created_at DESC', null, (err, rows) => {
        if (err) {
            req.flash('error', 'Something went wrong while fetching the images. Please refresh the page and try again!');
        }
        res.render('home', {
            title: 'Browse Images',
            message: req.flash('message'),
            error: req.flash('error'),
            user: user,
            images: rows
        });
    });
};


exports.showImage = (req, res) => {
    if (!req.params.id) {
        return res.redirect('/');
    }
    
    connection.query('SELECT images.id, images.image_path, users.name, DATE_FORMAT(images.created_at, "%a %D %b %Y - %h %p") as created_at FROM `images` left join users on users.id = images.users_id where images.id = ? ORDER by images.created_at DESC', [req.params.id], (err, row) => {
        if (err) {
            req.flash('error', 'Something went wrong while fetching the image. Please try again!');
            return res.redirect('/');
        }
        if (!row.length) {
            req.flash('error', 'Could not find the specified image!');
            return res.redirect('/');
        }
        user = req.isAuthenticated() ? req.user : null;
        res.render('image', {
            title: 'Images',
            message: req.flash('message'),
            error: req.flash('error'),
            user: user,
            image: row[0]
        });
    });
};