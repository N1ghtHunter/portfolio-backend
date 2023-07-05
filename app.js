const express = require('express');
const PORT = process.env.PORT || 3008;
const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Project = require('./models/Project');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');
const dotenv = require('dotenv');
const AUTH_TOKEN = process.env.AUTH_TOKEN || config.AUTH_TOKEN;

app.use(cors());
// connect to mongodb
const uri = `mongodb+srv://${config.DB_USERNAME}:${config.DB_PASSWORD}@portfoliodb.xjc0r8m.mongodb.net/portfolioDB`
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error(err));
// set up express to serve static files from public/uploads /images and /pdf
app.use('/public/uploads', express.static('public/uploads'));
app.use('/public/uploads/images', express.static('public/uploads/images'));
app.use('/public/uploads/pdf', express.static('public/uploads/pdf'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// make public/uploads/pdf and public/uploads/images folder if they don't exist
if (!fs.existsSync('./public/uploads')) {
    fs.mkdirSync('./public/uploads');
}
if (!fs.existsSync('./public/uploads/pdf')) {
    fs.mkdirSync('./public/uploads/pdf');
}
if (!fs.existsSync('./public/uploads/images')) {
    fs.mkdirSync('./public/uploads/images');
}


// store pdf in public/uploads/pdf  folder and store image in public/uploads/images folder
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'pdf') {
            cb(null, 'public/uploads/pdf');
        } else if (file.fieldname === 'image') {
            cb(null, 'public/uploads/images');
        }
    },
    filename: function (req, file, cb) {
        if (file.fieldname === 'pdf') {
            // delete old pdf named Mazin-Islam-CV.pdf
            if (fs.existsSync('./public/uploads/pdf/Mazin-Islam-CV.pdf')) {
                fs.unlinkSync('./public/uploads/pdf/Mazin-Islam-CV.pdf');
            }
            cb(null, 'Mazin-Islam-CV.pdf')
        }
        else if (file.fieldname === 'image') {
            cb(null, uuidv4() + path.extname(file.originalname));
        }
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 10000000 } }).fields([{ name: 'pdf', maxCount: 1 }, { name: 'image', maxCount: 1 }]);


app.get('/', (req, res) => {
    res.send("Server is running");
});


// 500 middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("500: Internal Server Error");
});

// auth middleware
const auth = (req, res, next) => {
    if (req.headers.authorization === AUTH_TOKEN) {
        next();
    } else {
        res.status(401).send("401: Unauthorized");
    }
};

// CREATE PROJECT
app.post('/api/projects', auth, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.log(err);
            // pass error to error handling middleware
            next(err);
        } else {
            // create new project
            const project = new Project({
                title: req.body.title,
                description: req.body.description,
                image_path: req.files.image ? "/public/uploads/images/" + req.files.image[0].filename : null,
                source_code: req.body.source_code,
                live_demo: req.body.live_demo,
            });
            // save project to database
            project.save()
                .then((project) => {
                    res.status(201).json(project);
                })
                .catch((err) => {
                    console.log(err);
                    // pass error to error handling middleware
                    next(err);
                });
        }
    });
});


// READ PROJECTS
app.get('/api/projects', (req, res) => {
    Project.find()
        .then((projects) => {
            res.status(200).json(projects);
        })
        .catch((err) => {
            console.log(err);
            // pass error to error handling middleware
            next(err);
        });
});

// DELETE PROJECT
app.delete('/api/projects/:id', auth, (req, res) => {
    Project.findByIdAndDelete(req.params.id)
        .then((project) => {
            if (project) {
                res.status(200).json(project);
            } else {
                res.status(404).send("404: Project not found");
            }
        })
        .catch((err) => {
            console.log(err);
            // pass error to error handling middleware
            next(err);
        });
});

// UPDATE PROJECT
app.put('/api/projects/:id', auth, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.log(err);
            // pass error to error handling middleware
            next(err);
        } else {
            Project.findById(req.params.id)
                .then((project) => {
                    if (project) {
                        project.title = req.body.title;
                        project.description = req.body.description;
                        project.source_code = req.body.source_code;
                        project.live_demo = req.body.live_demo;
                        if (req.files.image) {
                            project.image_path = "/public/uploads/images/" + req.files.image[0].filename;
                        }
                        project.save()
                            .then((project) => {
                                res.status(200).json(project);
                            })
                            .catch((err) => {
                                console.log(err);
                                // pass error to error handling middleware
                                next(err);
                            });
                    } else {
                        res.status(404).send("404: Project not found");
                    }
                })
                .catch((err) => {
                    console.log(err);
                    // pass error to error handling middleware
                    next(err);
                });
        }
    });
});

// UPLOAD CV PDF 
app.post('/api/cv', auth, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.log(err);
            // pass error to error handling middleware
            next(err);
        } else {
            // send current url ending with Mazin-Islam-CV.pdf
            res.status(201).json({ url: req.protocol + '://' + req.get('host') + req.originalUrl });
        }
    });
});

// GET CV PDF AS DOWNLOAD
app.get('/api/cv', (req, res) => {
    // open stream to read pdf Mazin-Islam-CV.pdf
    const pdfPath = path.join(__dirname, 'public/uploads/pdf/Mazin-Islam-CV.pdf');
    const file = fs.createReadStream(pdfPath);
    // get file stats
    fs.stat(pdfPath, (err, stats) => {
        if (err) {
            console.log(err);
            // pass error to error handling middleware
            next(err);
        } else {
            // set response headers
            res.setHeader('Content-Length', stats.size);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Mazin-Islam-CV.pdf');
            // send file
            file.pipe(res);
        }
    }
    );
});





// 404 middleware
app.use((req, res, next) => {
    res.status(404).send("404: Page not found");
});

app.listen(PORT, () => {
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', `Server is running on port ${PORT}`);
}
);