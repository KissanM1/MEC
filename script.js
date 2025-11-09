// Detect which page we’re on
const isAdmin = document.title.includes("Admin");

// Local storage mock database
let shelters = JSON.parse(localStorage.getItem("shelters")) || [];

if (isAdmin) {
  // ADMIN PAGE LOGIC
  const form = document.getElementById("shelter-form");
  const list = document.getElementById("list");

  function renderShelters() {
    list.innerHTML = "";
    shelters.forEach((shelter, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${shelter.location}</strong>
        <span style="color:${shelter.status}; font-size:1.2rem;">●</span>
        <em>${shelter.needs || "No urgent needs"}</em>
      `;
      list.appendChild(li);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const location = document.getElementById("location").value;
    const status = document.getElementById("status").value;
    const needs = document.getElementById("needs").value;

    shelters.push({ location, status, needs });
    localStorage.setItem("shelters", JSON.stringify(shelters));
    renderShelters();
    form.reset();
  });

  renderShelters();

} else {
  // USER PAGE LOGIC
  const form = document.getElementById("find-form");
  const results = document.getElementById("shelter-results");

  function renderResults() {
    results.innerHTML = "";
    if (shelters.length === 0) {
      results.innerHTML = "<p>No shelters available yet.</p>";
      return;
    }
    shelters.forEach((s) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${s.location}</strong>
        <span style="color:${s.status}; font-size:1.2rem;">●</span>
        <em>${s.needs || "No urgent needs"}</em>
      `;
      results.appendChild(li);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    renderResults();
  });

  renderResults();
}
