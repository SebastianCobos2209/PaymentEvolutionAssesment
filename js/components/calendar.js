let currentWeekStart = new Date();

let work = {};

function initCalendar() {
  currentWeekStart = getStartOfWeek(new Date());
  loadWork();
  renderWorkGrid();
  setupWorkListeners();
  setupModalWork();
  updateDayDates(currentWeekStart);
}

function getStartOfWeek(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
function calculateDuration(startTime, endTime) {
  const start = convertTimeToMinutes(startTime);
  const end = convertTimeToMinutes(endTime);
  return end >= start ? end - start : 24 * 60 - start + end;
}

function convertTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function updateDayDates(startOfWeek) {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dateElements = document.querySelectorAll(".day-date");

  daysOfWeek.forEach((day, index) => {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + index);

    const formattedDate = currentDate.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });

    dateElements[index].textContent = formattedDate;
  });
}

function renderWorkGrid() {
  const $grid = $(".work-grid");
  $grid.empty();
  const startDate = new Date(currentWeekStart);
  const endDate = new Date(currentWeekStart);
  endDate.setDate(startDate.getDate() + 6);

  for (let row = 1; row <= 12; row++) {
    const $workRow = $('<div class="work-row"></div>');

    for (let col = 0; col < 7; col++) {
      const currentDate = new Date(currentWeekStart);
      currentDate.setDate(currentDate.getDate() + col);
      const dateKey = formatDateKey(currentDate);

      const $cell = $('<div class="work-cell"></div>');

      const workItem = work[dateKey] && work[dateKey][row];

      if (workItem) {
        const statusClass = `work-${workItem.status || "pending"}`;
        $cell.addClass(statusClass);

        $cell.append(`
          <div class="work-content">
            <div class="work-id">${workItem.id}</div>
            <div class="work-time">${workItem.startTime}-${
          workItem.endTime
        }</div>
            <div class="work-duration">${formatDuration(
              calculateDuration(workItem.startTime, workItem.endTime)
            )}</div>
          </div>
        `);
      } else {
        $cell.append('<div class="empty-work">+</div>');
      }

      $cell.attr({
        "data-date": dateKey,
        "data-work-idx": row,
      });

      $workRow.append($cell);
    }
    $grid.append($workRow);
  }
}

function setupWorkListeners() {
  $(document).on("click", ".work-cell", function () {
    const date = $(this).data("date");
    const workIdx = $(this).data("work-idx");
    if (date && workIdx) {
      showWorkModal(date, workIdx);
    }
  });
}

function showWorkModal(date, workIdx) {
  const [year, month, day] = date.split("-");
  $("#modalDateTitle").text(`work hours done - ${day}/${month}/${year}`);

  $("#workForm")[0].reset();
  $("#deleteWorkyBtn").hide();

  const workItem = work[date] && work[date][workIdx];
  if (workItem) {
    $("#workId").val(workItem.id);
    $("#startingTime").val(workItem.startTime);
    $("#endingTime").val(workItem.endTime);
    $("#deleteWorkBtn").show();
  }

  $("#workModal").data({
    selectedDate: date,
    selectedWorkIdx: workIdx,
  });

  const modalElement = document.getElementById("workModal");
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}

function setupModalWork() {
  $("#saveWorkBtn").click(() => {
    const date = $("#workModal").data("selectedDate");
    const workIdx = $("#workModal").data("selectedWorkIdx");

    const workData = {
      id: $("#workId").val().trim(),
      startTime: $("#startingTime").val(),
      endTime: $("#endingTime").val(),
      status: "pending",
    };

    if (!workData.id) {
      return alert("id required");
    } else if (workData.id.length < 5 || workData.id.length > 5) {
      return alert("id must be 5 characters");
    }
    if (!workData.startTime || !workData.endTime)
      return alert("Horas requeridas");
    if (workData.startTime >= workData.endTime)
      return alert("Hora de fin debe ser posterior");

    if (!work[date]) work[date] = {};
    work[date][workIdx] = workData;

    saveWork();
    renderWorkGrid();
    bootstrap.Modal.getInstance("#workModal").hide();
  });

  $("#approveBtn").click(() => {
    updateWorkStatus("approved");
  });

  $("#declineBtn").click(() => {
    updateWorkStatus("denied");
  });

  $("#deleteWorkBtn").click(() => {
    if (confirm("delete the work hours?")) {
      const date = $("#workModal").data("selectedDate");
      const workIdx = $("#workModal").data("selectedWorkIdx");

      if (work[date] && work[date][workIdx]) {
        delete work[date][workIdx];
        if (Object.keys(work[date]).length === 0) {
          delete work[date];
        }
        saveWork();
        renderWorkGrid();
        bootstrap.Modal.getInstance("#workModal").hide();
      }
    }
  });
}

function updateWorkStatus(status) {
  const date = $("#workModal").data("selectedDate");
  const workIdx = $("#workModal").data("selectedWorkIdx");

  if (work[date] && work[date][workIdx]) {
    work[date][workIdx].status = status;
    saveWork();
    renderWorkGrid();
    bootstrap.Modal.getInstance("#workModal").hide();
  }
}

function loadWork() {
  const saved = localStorage.getItem("workActivities");
  if (saved) work = JSON.parse(saved);
}

function saveWork() {
  localStorage.setItem("workActivities", JSON.stringify(work));
}

window.calendarComponent = {
  init: initCalendar,
  getWork: () => work,
  addWork: (date, workIdx, workData) => {
    if (!work[date]) work[date] = {};
    work[date][workIdx] = workData;
    saveWork();
    renderWorkGrid();
  },
};
