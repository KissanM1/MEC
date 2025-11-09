const isAdmin = document.title.includes("Admin");
let shelters = JSON.parse(localStorage.getItem("shelters")) || [];

// API base URL
const API_BASE = 'http://localhost:5000/api';

if (isAdmin) {
  // Admin page logic
  const shelterForm = document.getElementById("shelter-form");
  const shelterList = document.getElementById("list");
  let editingShelterId = null;

  // Load shelters from mecdata.json on page load
  fetch("./ShelterPing/src/mecdata.json")
    .then((response) => response.json())
    .then((data) => {
      shelters = data; // replace current shelters with JSON data
      localStorage.setItem("shelters", JSON.stringify(shelters));
      renderShelters();
    })
    .catch((err) => {
      console.error("Failed to load shelters from mecdata.json:", err);
      renderShelters(); // Still render whatever is in localStorage
    });

  function renderShelters() {
    shelterList.innerHTML = "";
    shelters.forEach((shelter) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${shelter.shelter_name}</strong><br>
        ${shelter.location}<br>
        Capacity: ${shelter.shelter_current_capacity}/${shelter.shelter_max_capacity}<br>
        Status: ${shelter.status || (shelter.is_open ? "Open" : "Closed")}<br>
        Needs: ${shelter.needs || shelter.shelter_request || "None"}<br>
        <button onclick="editShelter(${shelter.shelter_id})" style="background: #ffa726; margin-top: 5px;">Edit</button>
        <button onclick="deleteShelter(${shelter.shelter_id})" style="background: #ef5350; margin-top: 5px;">Delete</button>
      `;
      shelterList.appendChild(li);
    });
  }

  // Add or Update shelter functionality
  shelterForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const newShelter = {
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

    try {
      let response;
      if (editingShelterId) {
        // Update existing shelter
        response = await fetch(`${API_BASE}/shelters/${editingShelterId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newShelter)
        });
      } else {
        // Add new shelter
        response = await fetch(`${API_BASE}/shelters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newShelter)
        });
      }
      
      if (response.ok) {
        const result = await response.json();
        
        if (editingShelterId) {
          // Update existing shelter in local array
          const index = shelters.findIndex(s => s.shelter_id === editingShelterId);
          if (index !== -1) {
            shelters[index] = result.shelter;
          }
          alert('Shelter updated successfully!');
        } else {
          // Add new shelter to local array
          shelters.push(result.shelter);
          alert('Shelter added successfully!');
        }
        
        localStorage.setItem("shelters", JSON.stringify(shelters));
        resetForm();
        renderShelters();
      } else {
        throw new Error('Failed to save shelter to backend');
      }
    } catch (error) {
      console.error('Error saving shelter:', error);
      alert('Error saving shelter. Please check if the backend server is running.');
    }
  });

  // Edit shelter function
  window.editShelter = function(shelterId) {
    const shelter = shelters.find(s => s.shelter_id === shelterId);
    if (shelter) {
      document.getElementById("shelter-name").value = shelter.shelter_name;
      document.getElementById("shelter-location").value = shelter.location;
      document.getElementById("shelter-capacity").value = shelter.shelter_current_capacity;
      document.getElementById("status").value = shelter.status;
      document.getElementById("needs").value = shelter.shelter_request;
      
      editingShelterId = shelterId;
      document.querySelector('button[type="submit"]').textContent = '💾 Update Shelter';
      
      // Add cancel button
      if (!document.getElementById('cancel-btn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancel-btn';
        cancelBtn.type = 'button';
        cancelBtn.textContent = '❌ Cancel';
        cancelBtn.style.background = '#6c757d';
        cancelBtn.onclick = resetForm;
        shelterForm.appendChild(cancelBtn);
      }
    }
  };

  // Delete shelter function
  window.deleteShelter = async function(shelterId) {
    if (confirm('Are you sure you want to delete this shelter?')) {
      try {
        const response = await fetch(`${API_BASE}/shelters/${shelterId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          shelters = shelters.filter(s => s.shelter_id !== shelterId);
          localStorage.setItem("shelters", JSON.stringify(shelters));
          alert('Shelter deleted successfully!');
          renderShelters();
        } else {
          throw new Error('Failed to delete shelter');
        }
      } catch (error) {
        console.error('Error deleting shelter:', error);
        alert('Error deleting shelter. Please check if the backend server is running.');
      }
    }
  };

  // Reset form function
  function resetForm() {
    shelterForm.reset();
    editingShelterId = null;
    document.querySelector('button[type="submit"]').textContent = '➕ Add Shelter';
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
      cancelBtn.remove();
    }
  }

  // Initial render
  renderShelters();


} else {
  // ... your existing user page logic remains completely unchanged ...
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
        <strong>${shelter.location || shelter.shelter_name}</strong><br>
        <span style="color:${shelter.status || (shelter.is_open ? "green" : "red")}; font-size:1.2rem;">●</span>
        Capacity: ${shelter.shelter_current_capacity}/${shelter.shelter_max_capacity}<br>
        <em>${shelter.needs || shelter.shelter_request || "No urgent needs"}</em>
      `;
      shelterList.appendChild(li);
    });
  }

  // Initialize Leaflet map
  const map = L.map("map").setView([43.2557, -79.8711], 12); // Default Hamilton, ON
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // Load shelters from JSON file
  fetch("./ShelterPing/src/mecdata.json")
    .then((response) => response.json())
    .then((data) => {
      shelters = data; // replace current shelters with JSON
      renderShelters();

      // Add markers from JSON
      shelters.forEach((shelter) => {
        if (shelter.shelter_latitude && shelter.shelter_longitude) {
          L.marker([shelter.shelter_latitude, shelter.shelter_longitude])
            .addTo(map)
            .bindPopup(
              `<strong>${shelter.shelter_name}</strong><br>
               Beds: ${shelter.shelter_current_capacity}/${shelter.shelter_max_capacity}<br>
               ${shelter.shelter_request || "No urgent requests"}`
            );
        }
      });
    })
    .catch((err) => console.error("Failed to load shelters JSON:", err));

  // Get user location
  document.getElementById("locate-btn").addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      document.getElementById("user-location-display").textContent =
        `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
      map.setView([latitude, longitude], 13);
      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();
    });
  });

  renderShelters();
}