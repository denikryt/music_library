$(document).ready(function () {
  function addData() {
    var inputData = $("#input-field").val();
    if (inputData) {
      var encodedData = encodeURIComponent(inputData);
      $.post("/add/" + encodedData, function () {
        console.log("DATA", inputData, encodedData);
        // Success callback
        alert("Data added successfully!");
        // window.location.href = "/update";
      }).fail(function () {
        console.log("inputData", inputData);
        // Error callback
        alert("Error adding data!");
        // window.location.href = "/";
      });
    } else {
      alert("Please enter some data!");
    }
  }

  $("#add-link").click(function (event) {
    event.preventDefault();
    addData();
  });

  $("#input-field").keyup(function (event) {
    if (event.keyCode === 13) {
      addData();
    }
  });
});
