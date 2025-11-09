const isAdmin = document.title.includes("Admin");
let shelters = JSON.parse(localStorage.getItem("shelters")) || [];

if (isAdmin) {
  // ADMIN PAGE LOGIC
  const form = document.getElementById("shelter-form");
  const list = document.getElementById("list");

  function renderShelters() {
    list.innerHTML = "";
    shelters.forEach((shelter) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${shelter.location}</strong>
        <span style="color:${shelter.status}; font-size:1.2rem;">●</span>
        <em>${shelter.needs || "No urgent needs"}</em>
        <br><small>Lat: ${shelter.lat}, Lng: ${shelter.lng}</small>
      `;
      list.appendChild(li);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const location = document.getElementById("location").value;
    const status = document.getElementById("status").value;
    const needs = document.getElementById("needs").value;
    const lat = parseFloat(document.getElementById("lat").value);
    const lng = parseFloat(document.getElementById("lng").value);

    shelters.push({ location, status, needs, lat, lng });
    localStorage.setItem("shelters", JSON.stringify(shelters));
    renderShelters();
    form.reset();
  });

  renderShelters();

} else {
  // USER PAGE LOGIC
  const shelterList = document.getElementById("shelter-list");

  function renderShelters() {
    shelterList.innerHTML = "";
    if (shelters.length === 0) {
      shelterList.innerHTML = "<p>No shelters available yet.</p>";
      return;
    }
    shelters.forEach((shelter) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${shelter.location}</strong>
        <span style="color:${shelter.status}; font-size:1.2rem;">●</span>
        <em>${shelter.needs || "No urgent needs"}</em>
      `;
      shelterList.appendChild(li);
    });
  }

  // Initialize Leaflet map
  const map = L.map("map").setView([43.2557, -79.8711], 12); // Default to Hamilton, ON
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // Add shelter markers
  shelters.forEach((shelter) => {
    if (shelter.lat && shelter.lng) {
      L.marker([shelter.lat, shelter.lng])
        .addTo(map)
        .bindPopup(`<strong>${shelter.location}</strong><br>${shelter.needs || "No urgent needs"}`);
    }
  });

  // Get user location
  document.getElementById("locate-btn").addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      document.getElementById("user-location-display").textContent = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
      map.setView([latitude, longitude], 13);
      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();
    });
  });

  renderShelters();
}
