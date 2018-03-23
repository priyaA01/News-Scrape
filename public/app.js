// Grab the articles as a json
$.getJSON("/articles", function (data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    $("#articles").append("<p class='article' data-id='" + data[i]._id + "'><strong>" + (data[i].title).toUpperCase() + "</strong><br />" + data[i].byline + "<br />" + data[i].summary + " <img src='" + data[i].link + "' class='img-responsive' style='width:200px;height:200px'></p>");
  }
});

// When you click the btnScrape button
$(document).on("click", "#btnScrape", function (event) {
  // Now make an ajax call for the Scrape Article
  $.ajax({
    method: "GET",
    url: "/scrape"
  }).then(function (data) {
    location.reload();
    console.log("inside");
  });

});

// Whenever someone clicks a p tag
$(document).on("click", "p", function () {
  // Empty the notes from the note section
  $("#myModal").modal();
  $("#title").empty();
  $("#form").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    })
    // With that done, add the note information to the page
    .then(function (data) {
      console.log(data);
      // The title of the article
      $("#title").append(data.title);
      // An input to enter a new title
      $("#form").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#form").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#form").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });

});

// When you click the savenote button
$(document).on("click", "#savenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
      method: "POST",
      url: "/articles/" + thisId,
      data: {
        // Value taken from title input
        title: $("#titleinput").val(),
        // Value taken from note textarea
        body: $("#bodyinput").val()
      }
    })
    // With that done
    .then(function (data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#title").empty();
      $("#form").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
  $("#myModal").hide();

});