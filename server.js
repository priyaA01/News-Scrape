var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Parses our HTML and helps us find elements
var cheerio = require("cheerio");
// Makes HTTP request for HTML page
//or use axios
var request = require("request");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  //useMongoClient: true
});


// A GET route for scraping the New York Times website
app.get("/scrape", function(req, res) {
// First, tell the console what server.js is doing
console.log("\n***********************************\n" +
            "Grabbing records from New York Times:" +
            "\n***********************************\n");

// Making a request for fox news. The page's HTML is passed as the callback's third argument
request("https://www.nytimes.com/section/sports?action=click&pgtype=Homepage&region=TopBar&module=HPMiniNav&contentCollection=Sports&WT.nav=page", function(error, response, html) {

  // Load the HTML into cheerio and save it to a variable
  // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
  var $ = cheerio.load(html);

    // With cheerio, find each p-tag with the "title" class
  // (i: iterator. element: the current element)

  //$("article.story").each(function(i, element) {
    $("article.story").each(function(i, element) {

    // An empty array to save the data that we'll scrape
    var results = {};

    //.children("div.template-3").children("ol.story-menu").children("li").children("article.story").
    var summary =$(element).children("div.story-body").children("p.summary").text();
    // Save the text of the element in a "title" variable
    var imgURL = $(element).children("figure.media").children("a").attr("href");

    var title =$(element).children("div.story-body").children("h2.headline").children("a").text();

    var byline = $(element).children("div.story-body").children("p.byline").children("span.author").text();


    // Save these results in an object that we'll push into the results array we defined earlier
    if(title != "")
    {
      console.log("empty obj");
      /*results.push({
        title: title,
        byline: byline,
        summary:summary,
        imgURL:imgURL
      });*/
      results.title = title;
      results.byline = byline;
      results.summary = summary;
      results.imgURL = imgURL;
    }
    console.log(results);
    // Create a new Article using the `result` object built from scraping
      db.Article.create(results)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    
  });

  // Log the results once you've looped through each of the elements found with cheerio
  //if(results)
  // If we were able to successfully scrape and save an Article, send a message to the client
    //res.send("Scrape Complete");
});

});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});