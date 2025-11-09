// Detect admin page
const isAdmin = document.title.includes("Admin");
let shelters = JSON.parse(localStorage.getItem("shelters")) || [];

// Unified JSON path for both pages
const JSON_PATH = "src/shelters.json"; 
const API_BASE = 'http://localhost:5000/api';

if (isAdmin) {
  // ------------------ ADMIN PAGE ------------------
  const shelterForm = document.getElementById("shelter-form");
  const shelterList = document.getElementById("list");
  let editingShelterId = null;

  // Load shelters from JSON or localStorage
  fetch(JSON_PATH)
    .then((res) => {
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    })
    .then((data) => {
      shelters = data;
      localStorage.setItem("shelters", JSON.stringify(shelters));
      renderShelters();
    })
    .catch((err) => {
      console.warn("⚠️ Failed to load shelters.json, using localStorage:", err);
      renderShelters();
    });

  function renderShelters() {
    shelterList.innerHTML = "";
    shelters.forEach((shelter) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${shelter.shelter_name}</strong><br>
        ${shelter.location || "Unknown location"}<br>
        Capacity: ${shelter.shelter_current_capacity}/${shelter.shelter_max_capacity}<br>
        Status: ${shelter.status || (shelter.is_open ? "Open" : "Closed")}<br>
        Needs: ${shelter.shelter_request || "None"}<br>
        <button onclick="editShelter(${shelter.shelter_id})" style="background: #ffa726; margin-top: 5px;">Edit</button>
        <button onclick="deleteShelter(${shelter.shelter_id})" style="background: #ef5350; margin-top: 5px;">Delete</button>
      `;
      shelterList.appendChild(li);
    });
  }

  // Add or Update Shelter
  shelterForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newShelter = {
      shelter_id: editingShelterId || Date.now(),
      shelter_name: document.getElementById("shelter-name").value,
      location: document.getElementById("shelter-location").value,
      shelter_max_capacity: parseInt(document.getElementById("shelter-capacity").value),
      shelter_current_capacity: parseInt(document.getElementById("shelter-capacity").value),
      status: document.getElementById("status").value,
      shelter_request: document.getElementById("needs").value || "No urgent needs",
      shelter_latitude: 43.2557,
      shelter_longitude: -79.8711,
      food_available: true,
      beds_available: true,
      is_open: document.getElementById("status").value === "green"
    };

    if (editingShelterId) {
      const idx = shelters.findIndex(s => s.shelter_id === editingShelterId);
      if (idx !== -1) shelters[idx] = newShelter;
      alert("✅ Shelter updated!");
    } else {
      shelters.push(newShelter);
      alert("✅ Shelter added!");
    }

    localStorage.setItem("shelters", JSON.stringify(shelters));
    resetForm();
    renderShelters();
  });

  // Edit Shelter
  window.editShelter = function (id) {
    const s = shelters.find(s => s.shelter_id === id);
    if (!s) return;
    document.getElementById("shelter-name").value = s.shelter_name;
    document.getElementById("shelter-location").value = s.location;
    document.getElementById("shelter-capacity").value = s.shelter_current_capacity;
    document.getElementById("status").value = s.status;
    document.getElementById("needs").value = s.shelter_request;
    editingShelterId = id;
    document.querySelector('button[type="submit"]').textContent = "💾 Update Shelter";

    if (!document.getElementById("cancel-btn")) {
      const cancel = document.createElement("button");
      cancel.id = "cancel-btn";
      cancel.type = "button";
      cancel.textContent = "❌ Cancel";
      cancel.style.background = "#6c757d";
      cancel.onclick = resetForm;
      shelterForm.appendChild(cancel);
    }
  };

  // Delete Shelter
  window.deleteShelter = function (id) {
    if (!confirm("Are you sure you want to delete this shelter?")) return;
    shelters = shelters.filter(s => s.shelter_id !== id);
    localStorage.setItem("shelters", JSON.stringify(shelters));
    renderShelters();
    alert("🗑️ Shelter deleted!");
  };

  function resetForm() {
    shelterForm.reset();
    editingShelterId = null;
    document.querySelector('button[type="submit"]').textContent = "➕ Add Shelter";
    const cancel = document.getElementById("cancel-btn");
    if (cancel) cancel.remove();
  }

  renderShelters();

} else {
  // ------------------ USER PAGE ------------------
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
        <strong>${shelter.shelter_name || shelter.location}</strong><br>
        <span style="color:${shelter.status || (shelter.is_open ? "green" : "red")}; font-size:1.2rem;">●</span>
        Capacity: ${shelter.shelter_current_capacity}/${shelter.shelter_max_capacity}<br>
        <em>${shelter.shelter_request || "No urgent needs"}</em>
      `;
      shelterList.appendChild(li);
    });
  }

  // Initialize Map
  const map = L.map("map").setView([43.2557, -79.8711], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // Load shelters with fallback
  fetch(JSON_PATH)
    .then((res) => {
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    })
    .then((data) => {
      shelters = data;
      localStorage.setItem("shelters", JSON.stringify(shelters));
      renderShelters();
      addMarkers();
    })
    .catch((err) => {
      console.warn("⚠️ Could not load shelters.json, using localStorage:", err);
      shelters = JSON.parse(localStorage.getItem("shelters")) || [];
      renderShelters();
      addMarkers();
    });

  function addMarkers() {
    shelters.forEach((shelter) => {
      if (shelter.shelter_latitude && shelter.shelter_longitude) {
        L.marker([shelter.shelter_latitude, shelter.shelter_longitude])
          .addTo(map)
          .bindPopup(`
            <strong>${shelter.shelter_name}</strong><br>
            Beds: ${shelter.shelter_current_capacity}/${shelter.shelter_max_capacity}<br>
            ${shelter.shelter_request || "No urgent requests"}
          `);
      }
    });
  }

  // Locate user
  document.getElementById("locate-btn").addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        document.getElementById("user-location-display").textContent =
          `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
        map.setView([latitude, longitude], 13);
        L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("You are here")
          .openPopup();
      },
      () => alert("Unable to get location.")
    );
  });

  renderShelters();
}
