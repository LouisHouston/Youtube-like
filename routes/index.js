var express = require('express');
var router = express.Router();
const mysql = require('mysql2');
const session = require('express-session');
const app = express();
var user;
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const gm = require('gm').subClass({imageMagick: true});
const ffmpeg = require('fluent-ffmpeg');
var ffProbePath = 'C:\\ffmpeg\\bin\\ffprobe.exe';
var ffmpegPath = 'C:\\ffmpeg\\bin\\ffmpeg.exe';
var ffProbePath = 'C:\\ffmpeg\\bin\\ffprobe.exe';
ffmpeg.setFfprobePath(ffProbePath);
ffmpeg.setFfmpegPath(ffmpegPath);


app.use(session ({
  secret: 'ROOTER',
  resave: false,
  saveUninitialized: true
}));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'Serverr'
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const upload = multer({ storage: storage });

router.use(function(req, res, next) {
  res.locals.user = req.session.user;
  next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  connection.query('SELECT * FROM video_posts', function(err, video_posts) {
    if (err) throw err;
    
    const previewImages = [];

    // Generate thumbnail for each video post
    video_posts.forEach(function(video_post) {
      const videoPath = path.join(__dirname, '..', 'public', 'uploads', video_post.video_url);
      const imagePath = `/uploads/${video_post.id}.jpg`;
      const imagePathAbs = path.join(__dirname, '..', 'public', imagePath);

      ffmpeg(videoPath)
        .on('end', function() {
          console.log('Screenshots taken');
        })
        .on('error', function(err) {
          console.error(err);
        })
        .screenshot({
          count: 1,
          folder: path.dirname(imagePathAbs),
          filename: path.basename(imagePathAbs),
          size: '320x240'
        });

      previewImages.push(imagePath);
    });

    res.render('index', { 
      title: 'Home',
      previewImages: previewImages,
      video_posts: video_posts, 
      user: user
    });
  });
});



/* GET Login page. */
router.get('/Login', function(req, res, next) {
  res.render('Login', { title: 'Login', name:"Louis Houston" });
});


router.post('/login', function(req, res) {
  const { username, password } = req.body;

  connection.query('SELECT * FROM users WHERE username = ?', [username], function(err, result) {
    if (err) {
      console.error(err);
      res.status(500).send('Login failed!');
    } else {
      if (result.length === 1) {
        const hashedPassword = result[0].password;
        bcrypt.compare(password, hashedPassword, function(err, match) {
          if (err) {
            console.error(err);
            res.status(500).send('Login failed!');
          } else {
            if (match) {
              res.status(200).send('Login successful!');
              req.session.user = {
                username: username,
                email: result[0].email,
                id: result[0].id 
              }
              user = req.session.user;
              console.log(req.session.user);
              console.log(req.session.user.email);
            } else {
              res.status(500).send('Login failed!');
            }
          }
        });
      } else {
        res.status(500).send('Login failed!');
      }
    }
  });
});


/* GET Register page. */
router.get('/Register', function(req, res, next) {
  res.render('Register', { title: 'Register', name:"Louis Houston", user: user });
});

router.post('/Register', function(req, res) {
  const { username, email, password } = req.body;

  // Hash the password
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
      if (err) {
        console.error(err);
        res.status(500).send('Registration failed!');
      } else {
        // Store the hashed password in the database
        connection.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], function(err, result) {
          if (err) {
            console.error(err);
            res.status(500).send('Registration failed!');
          } else {
            if (result.affectedRows === 1) {
              res.status(200).send('Registration successful!');
            } else {
              res.status(500).send('Registration failed!');
            }
          }
        });
      }
    });
  });
});


/* GET PostVideo page. */
router.get('/PostVideo', function(req, res, next) {
  if(user) {
  res.render('PostVideo', { title: 'Post Video', name:"Louis Houston", user: user });
  } else {
    res.redirect('/');
  }
});

router.post('/postvideo', upload.single('video'), async (req, res) => {
  const title = req.body.title;
  const description = req.body.description;
  const videoFile = req.file;

  // Save the video file to the server
  fs.renameSync(videoFile.path, `public/Uploads/${videoFile.originalname}`);

  // Save the video post to the database
  const insertResult = await connection.execute(
    'INSERT INTO video_posts (title, description, video_url, user_id) VALUES (?, ?, ?, ?)',
    [title, description, `${videoFile.originalname}`, user.id]
  );
  
  

  res.redirect('/');
});

/* GET ViewPost page. */

router.get('/view-post/:id', (req, res) => {
  const postId = req.params.id;

  // Retrieve the corresponding post from the database
  connection.query('SELECT * FROM video_posts WHERE id = ?', [postId], function(err, posts) {
    if (err) {
      console.error(err);
      res.status(500).send('Failed to retrieve post!');
    } else {
      if (posts.length > 0) {
        const post = posts[0];
        
        // Retrieve the corresponding comments for the post from the database
        connection.query('SELECT * FROM comments WHERE post_id = ?', [postId], function(err, comments) {
          if (err) {
            console.error(err);
            res.status(500).send('Failed to retrieve comments!');
          } else {
            // Render a view to display the post and comments
            res.render('view-post', { post: post, comments: comments });
          }
        });
      } else {
        res.status(404).send('Post not found');
      }
    }
  });
});



/* GET Profile page. */
router.get('/profile', (req, res) => {
  if (user) {
  connection.query('SELECT * FROM video_posts WHERE user_id = ?', [user.id], function(err, video_posts) {
      // user is logged in, show their profile
      res.render('profile', { title: user.username + " Profile", user: user, video_posts: video_posts 
      });
    });
    }
    else {
      // user is not logged in, redirect to login page
      res.redirect('/login');
    }
});

/* SEARCH */
router.get('/search', (req, res) => {
  const query = req.query.q;
  connection.query('SELECT * FROM video_posts WHERE title LIKE ?', ['%' + query + '%'], function(err, video_posts) {
    if (err) {
      console.error(err);
      res.status(500).send('Failed to retrieve posts!');
    } else {
      res.render('search-results', { title: 'Search Results', video_posts: video_posts, query: query });
    }
  });
});

router.delete('/Profile', function(req, res) {
  const postId = req.body.postId;
  const userId = user.id; // get the authenticated user's id

  // Delete the corresponding post from the database, only if the post belongs to the authenticated user
  connection.query('DELETE FROM video_posts WHERE id = ? AND user_id = ?', [postId, userId], function(err, result) {
    if (err) {
      console.error(err);
      res.status(500).send('Failed to delete post!');
    } else {
      if (result.affectedRows === 1) {
        // Delete all comments related to this post from the database
        connection.query('DELETE FROM comments WHERE post_id = ?', [postId], function(err, result) {
          if (err) {
            console.error(err);
            res.status(500).send('Failed to delete comments!');
          } else {
            res.status(200).send('Post and comments deleted successfully!');
          }
        });
      } else {
        res.status(500).send('Failed to delete post!');
      }
    }
  });
});



/* Logout Button */
router.get('/Logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("User Logged Out!")
      res.redirect('/');
    }
  });
  user = null;
});

/* Comments  */
router.post('/add-comment', (req, res) => {
  if (user) {
    const postId = req.body.post_id;
    const userId = user.id;
    const comment = req.body.comment;

    connection.query('SELECT * FROM video_posts WHERE id = ?', [postId], function(err, post) {
      if (err) {
        console.error(err);
        res.status(500).send('Failed to retrieve post!');
      } else {
        if (post.length > 0) {
          // Insert the new comment into the database
          connection.query('INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)', [postId, userId, comment], function(err, result) {
            if (err) {
              console.error(err);
              res.status(500).send('Failed to add comment!');
            } else {
              // Retrieve all comments for this post from the database
              connection.query('SELECT * FROM comments WHERE post_id = ?', [post[0].id], function(err, comments) {
                if (err) {
                  console.error(err);
                  res.status(500).send('Failed to retrieve comments!');
                } else {
                  // Render a view to display the post and comments
                  res.render('view-post', { post: post[0], comments: comments });
                }
              });
            }
          });
        } else {
          res.status(404).send('Post not found');
        }
      }
    });
  } else {
    res.status(401).send('You must be logged in to add a comment!');
    res.redirect('/');
  }
});




app.use('/', router);
module.exports = router;
