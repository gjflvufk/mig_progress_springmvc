// 메인 화면 JS
let currentGroups = [];

function fetchAllLogs() {
    fetch("/mig-progress/mig/progress/all.do")
        .then(res => res.json())
        .then(data => {
            currentGroups = data.groups || [];
            renderMaster(currentGroups);
        });
}

function renderMaster(groups) {
    let html = "";
    groups.forEach(group => {
        html += "<tr onclick=\"openDetailPage('" + group.groupKey + "')\">";
        html += "<td>" + (group.jobLvl1 || "") + "</td>";
        html += "<td>" + (group.jobLvl2 || "") + "</td>";
        html += "<td>" + (group.progressRate || 0) + "%</td>";
        html += "<td>" + (group.targetTableCount || 0) + "</td>";
        html += "<td>" + (group.completedTableCount || 0) + "</td>";
        html += "<td>" + (group.errorTableCount || 0) + "</td>";
        html += "<td>" + (group.remainTableCount || 0) + "</td>";
        html += "<td>" + (group.jobStatus || "") + "</td>";
        html += "</tr>";
    });
    document.getElementById("masterTableBody").innerHTML = html;
}

function openDetailPage(groupKey) {
    const group = currentGroups.find(g => g.groupKey === groupKey);
    sessionStorage.setItem("selectedMigGroup", JSON.stringify(group));
    window.open("/mig-progress/mig/progress/detail.do", "_blank");
}
