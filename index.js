require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

const mongoose = require("mongoose");

// Using URL constructor from The WHATWG URL API
const URL = require("url").URL;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// mount bodyParser middleware to Parse POST Requests
app.use(bodyParser.urlencoded({ extended: false }));

// create schema and implement mongoose nanoid plugin
const urlSchema = new mongoose.Schema({
  urlpost: {
    type: String,
    required: true,
  },
});
urlSchema.plugin(require("mongoose-nanoid"), { length: 8 }); // default size = 12
const UrlModel = mongoose.model("UrlModel", urlSchema);

// create shorturl api
app.post("/api/shorturl", (req, res) => {
  const postedUrl = req.body.url;
  if (!postedUrl) return res.send("You did not enter a URL");
  console.log(postedUrl);

  // validate posted url
  const validateUrl = new URL(postedUrl);
  if (validateUrl.protocol === "http:" || validateUrl.protocol === "https:") {
    const existingUrl = UrlModel.findOne({ urlpost: postedUrl });
    existingUrl.then((record) => {
      // check if url already exit
      if (record) {
        // display the below json
        // the _id will be generated using nanoid.
        res.json({ original_url: record.urlpost, short_url: record._id });
      } else {
        // if not exit create new url
        newurl = new UrlModel({ urlpost: postedUrl });
        newurl
          .save()
          .then(() => {
            res.json({ original_url: newurl.urlpost, short_url: newurl._id });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  } else {
    // if url isn't valid
    res.json({ error: "invalid url" });
  }
});

// redirect to original url from shorturl
app.get("/api/shorturl/:shorturl", (req, res) => {
  const shorturl = req.params.shorturl;
  console.log(shorturl);
  // query the database to get the created shorturl ID
  const getShorturl = UrlModel.findById(shorturl);
  getShorturl
    .then((url) => {
      if (url) {
        res.redirect(url.urlpost);
        console.log(url.urlpost);
      } else {
        res.status(404).json("Short_Url not found");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

// view all document in the database
app.get("/api/document", (req, res) => {
  var see = UrlModel.find({});
  see
    .then((records) => {
      res.send(records);
    })
    // the below will match documents in an array
    // see
    //   .then((records) => {
    //     var seeMap = {};
    //     records.forEach((record) => {
    //       seeMap[record._id] = record;
    //     });
    //     res.send(seeMap);
    //   })
    .catch((err) => {
      console.log(err);
    });
});

// connect mongodb
mongoose
  .connect(process.env["MONGO_URI"])
  .then(() => {
    console.log("database connected");
  })
  .catch((err) => {
    console.log(err);
  });

mongoose.connection.on("open", () => {
  // Wait for mongodb connection before server starts
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
});
