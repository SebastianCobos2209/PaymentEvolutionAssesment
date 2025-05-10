$(document).ready(function () {
  loadComponents();
});

function loadComponents() {
  $("#navbar-container").load("./components/navbar.html");
  $("#grid-container").load("./components/table.html", function () {
    $("#calendar-modal-container").load("./components/popup.html", function () {
      calendarComponent.init();
    });
  });

  $("#footer-container").load("./componentes/footer.html");
}
