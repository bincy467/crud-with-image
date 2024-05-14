const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const path = require('path');
const PORT = 8000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

mongoose.connect('mongodb://localhost/crudd')
  .then(() => console.log("Database Connected"))
  .catch(err => console.log(err));

const Participant = require('./model/Participants');
const multer = require('multer');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Log the current directory
console.log('__dirname:', __dirname);

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(methodOverride('_method'))


// multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'static')); // Use path.join to ensure correct path
  },
  filename: (req, file, cb) => {
    console.log('Uploading file:', file.originalname);
    const sanitizedFileName = file.originalname.replace(/\s+/g, '-');
    cb(null, sanitizedFileName);
  }
});


const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/participate', upload.single('photo'), async (req, res) => {
  try {
    const { name, email, phone, topic } = req.body;
    let photoPath = '';
    if (req.file) {
      const sanitizedFileName = req.file.originalname.replace(/\s+/g, '-');
      photoPath = '/static/' + sanitizedFileName;
      console.log('Uploaded file:', req.file.originalname);
      console.log('Sanitized file name:', sanitizedFileName);
      console.log('Photo path:', photoPath);
    } else {
      console.log('No file uploaded');
    }
    const newParticipant = new Participant({ name, email, phone, topic, photo: photoPath });
    await newParticipant.save();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while saving the participant.");
  }
});


app.get('/participants', async (req, res) => {
  try {
    const data = await Participant.find({});
    res.render('participants', { data: data });
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred while fetching participants.");
  }
});

app.delete('/participants/:id', async (req, res) => {
  try {
    await Participant.findByIdAndDelete(req.params.id);
    res.redirect('/participants');
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while deleting the participant.");
  }
});

app.get('/edit/:id', async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).send("Participant not found");
    }
    res.render('edit', { participant: participant });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while fetching the participant.");
  }
});
app.put('/participate/:id', upload.single('photo'), async (req, res) => {
  try {
    const { name, email, phone, topic, existingPhotoPath } = req.body;
    let photoPath = existingPhotoPath; // Use existing photo if no new photo is uploaded
    if (req.file) {
      const sanitizedFileName = req.file.originalname.replace(/\s+/g, '-');
      photoPath = '/static/' + sanitizedFileName;
      console.log('Uploaded file:', req.file.originalname);
      console.log('Sanitized file name:', sanitizedFileName);
      console.log('Photo path:', photoPath);
    }
    await Participant.findByIdAndUpdate(req.params.id, { name, email, phone, topic, photo: photoPath });
    res.redirect('/participants');
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while updating the participant.");
  }
});



app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
