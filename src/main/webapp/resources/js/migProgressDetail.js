document.addEventListener("DOMContentLoaded", function () {
    const raw = sessionStorage.getItem("selectedMigGroup");
    if (!raw) return;

    const group = JSON.parse(raw);
    renderDetail(group.logs || []);
});

function renderDetail(logs) {
    let html = "";
    logs.forEach(log => {
        html += "<tr>";
        html += "<td>" + (log.tableName || "") + "</td>";
        html += "<td>" + (log.startTime || "") + "</td>";
        html += "<td>" + (log.endTime || "") + "</td>";
        html += "<td>" + (log.elapsedTime || "") + "</td>";
        html += "<td>" + (log.jobStatus || "") + "</td>";
        html += "</tr>";
    });
    document.getElementById("detailTableBody").innerHTML = html;
}
