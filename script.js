function handleSettingClick(section) {
  console.log(`Opening ${section} settings`);
  alert(`Opening ${section} settings section`);
}

function toggleSwitch(element) {
  element.classList.toggle("active");
}

function setActiveNav(element, section) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });
  element.classList.add("active");

  if (section === "settings") {
    window.location.href = "screens/settings.html";
  } else if (section === "location") {
    window.location.href = "screens/location.html";
  } else if (section === "notifications") {
    window.location.href = "screens/notifications.html";
  } else {
    window.location.href = "index.html#" + section;
  }
}

function navigate(section) {
  console.log(`Navigating to ${section}`);
  if (section === "register") {
    window.location.href = "screens/register.html";
  } else if (section === "login") {
    window.location.href = "screens/login.html";
  } else if (section === "tokens") {
    openPaymentModal();
  } else if (section === "usage") {
    window.location.href = "screens/usage.html";
  } else if (section === "balance") {
    window.location.href = "screens/balance.html";
  } else if (section === "budget") {
    window.location.href = "screens/budget.html";
  } else if (section === "carbon") {
    window.location.href = "screens/carbon.html";
  } else if (section === "family") {
    window.location.href = "screens/family.html";
  } else if (section === "notifications") {
    window.location.href = "screens/notifications.html";
  } else {
    alert(`Navigating to ${section} section`);
  }
}

function goBack() {
  const currentPath = window.location.pathname;
  if (currentPath.includes("welcome.html")) {
    // If on welcome page, stay there
    return;
  } else if (
    currentPath.includes("login.html") ||
    currentPath.includes("register.html")
  ) {
    // If on login or register, go back to welcome
    window.location.href = "welcome.html";
  } else {
    // For other pages, go back to home
    window.location.href = "../index.html";
  }
}

// Initialize Facebook SDK
window.fbAsyncInit = function () {
  FB.init({
    appId: "your-fb-app-id", // Replace with your Facebook App ID
    cookie: true,
    xfbml: true,
    version: "v12.0",
  });
};

// Initialize Stripe
let stripe = Stripe("your-publishable-key"); // Replace with your Stripe publishable key
let elements = stripe.elements();
let card = elements.create("card");

// Initialize payment form when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const cardElement = document.getElementById("card-element");
  if (cardElement) {
    card.mount("#card-element");

    // Handle payment form submission
    const form = document.getElementById("payment-form");
    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const { token, error } = await stripe.createToken(card);

        if (error) {
          showNotification("Payment failed: " + error.message, "error");
        } else {
          processPayment(token);
        }
      });
    }
  }

  // Start the usage simulation
  simulateUsageChanges();

  // Initialize chart if on usage page
  const canvas = document.getElementById("usageChart");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const usageChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Power Usage (kW)",
            data: [],
            borderColor: "rgba(33, 150, 243, 1)",
            backgroundColor: "rgba(33, 150, 243, 0.2)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "24-Hour Usage Pattern",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Power Usage (kW)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Time",
            },
          },
        },
      },
    });

    // Update chart with initial data
    updateUsageChart(usageChart);
  }

  // Request notification permission
  if ("Notification" in window) {
    Notification.requestPermission().then(function (permission) {
      if (permission === "granted") {
        showNotification("Notifications enabled!");
      }
    });
  }
});

// Update the chart configuration
function initializeChart() {
  const canvas = document.getElementById("usageChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const usageChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Power Usage (kW)",
          data: [],
          borderColor: "rgba(33, 150, 243, 1)",
          backgroundColor: "rgba(33, 150, 243, 0.2)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "24-Hour Usage Pattern",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Power Usage (kW)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Time",
          },
        },
      },
    },
  });

  return usageChart;
}

// Update gauge function
function updateGauge(value) {
  const gaugeElement = document.querySelector(".gauge-fill");
  const gaugeText = document.querySelector(".gauge-center");
  const pointerElement = document.querySelector(".gauge-pointer");
  const warningElement = document.querySelector(".usage-warning");

  if (!gaugeElement || !gaugeText || !pointerElement || !warningElement) return;

  // Convert percentage to degrees (0% = -180deg, 100% = 0deg)
  const rotation = -180 + (value / 100) * 180;

  // Update gauge fill rotation
  gaugeElement.style.transform = `rotate(${rotation}deg)`;

  // Update pointer rotation (-90deg = 0%, 90deg = 100%)
  const pointerRotation = -90 + (value / 100) * 180;
  pointerElement.style.transform = `rotate(${pointerRotation}deg)`;

  // Update text with animation
  gaugeText.style.animation = "pulse 0.5s ease";
  gaugeText.textContent = `${value}%`;

  // Remove all warning classes
  warningElement.classList.remove(
    "warning-critical",
    "warning-high",
    "warning-moderate",
    "warning-good"
  );

  // Set color and warning message based on consumption levels
  let color;
  let warningClass;
  let warningMessage;

  if (value >= 90) {
    color = "#FF0000";
    warningClass = "warning-critical";
    warningMessage =
      "⚠️ Critical: Immediate action required! Your consumption is extremely high. Consider turning off non-essential appliances.";
  } else if (value >= 70) {
    color = "#FFA500";
    warningClass = "warning-high";
    warningMessage =
      "⚠️ Warning: Your power usage is high. Try to reduce consumption during peak hours.";
  } else if (value >= 40) {
    color = "#FFC107";
    warningClass = "warning-moderate";
    warningMessage =
      "📊 Notice: Moderate consumption detected. Monitor usage to maintain efficiency.";
  } else {
    color = "#4CAF50";
    warningClass = "warning-good";
    warningMessage =
      "✅ Great! Your power consumption is within efficient levels.";
  }

  // Update warning message
  warningElement.textContent = warningMessage;
  warningElement.classList.add(warningClass);

  gaugeText.style.color = color;
  gaugeElement.style.borderColor = `${color} ${color} transparent`;

  // Remove animation once complete
  setTimeout(() => {
    gaugeText.style.animation = "";
  }, 500);
}

// Simulate usage changes
function simulateUsageChanges() {
  let baseValue = 45; // Start with a lower value
  let variance = 8; // Increased variance for better demonstration

  setInterval(() => {
    // Create more natural fluctuations
    const change = (Math.random() - 0.5) * variance;
    let newValue = Math.round(baseValue + change);

    // Keep within bounds
    newValue = Math.max(0, Math.min(100, newValue));

    // Gradually shift base value to test different ranges
    baseValue = baseValue * 0.95 + newValue * 0.05;

    // Every minute, jump to a different consumption level to demonstrate all colors
    if (Math.random() < 0.1) {
      // 10% chance each update
      baseValue = Math.random() * 100; // Jump to random level
    }

    updateGauge(newValue);
  }, 3000);
}

// Facebook Login
function fbLogin() {
  FB.login(
    function (response) {
      if (response.status === "connected") {
        showNotification("Successfully logged in with Facebook!", "success");
      } else {
        showNotification("Facebook login failed", "error");
      }
    },
    { scope: "email,public_profile" }
  );
}

// Payment Modal Functions
function openPaymentModal() {
  const modal = document.getElementById("payment-modal");
  if (modal) modal.style.display = "block";
}

function closePaymentModal() {
  const modal = document.getElementById("payment-modal");
  if (modal) modal.style.display = "none";
}

// Process Payment
async function processPayment(token) {
  try {
    // Here you would normally send the token to your server
    showNotification("Payment successful!", "success");
    closePaymentModal();
  } catch (error) {
    showNotification("Payment failed: " + error.message, "error");
  }
}

// Notification System
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `
    <svg class="card-icon" style="width: 24px; height: 24px;">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize everything when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeStripe();
  const chart = initializeChart();
  if (chart) {
    updateUsageChart(chart);
  }
  simulateUsageChanges();

  // Request notification permission
  if ("Notification" in window) {
    Notification.requestPermission().then(function (permission) {
      if (permission === "granted") {
        showNotification("Notifications enabled!");
      }
    });
  }
});

// Update usage chart with data
function updateUsageChart(chart) {
  // Generate some random data for the last 24 hours
  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const data = Array.from({ length: 24 }, () => Math.random() * 4 + 1); // Random values between 1-5

  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();
}

function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Add your login logic here
  console.log("Logging in with:", email, password);

  // Simulate successful login
  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("userEmail", email);

  showNotification("Login successful!");
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 1000);
}

function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const meter = document.getElementById("meter").value;

  // Add your registration logic here
  console.log("Registering with:", { name, email, password, meter });

  // Simulate successful registration
  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("userEmail", email);
  localStorage.setItem("userName", name);
  localStorage.setItem("meterNumber", meter);

  showNotification("Registration successful!");
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 1000);
}

function logout() {
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("meterNumber");
  window.location.href = "screens/welcome.html";
}

function googleLogin() {
  // Add your Google login logic here
  showNotification("Google login coming soon!");
}

// Add these budget-related functions
function addProperty() {
  // Implement property addition logic
  showNotification("Property addition coming soon!");
}

function editBudget(propertyId) {
  // Implement budget editing logic
  showNotification(`Editing budget for ${propertyId}`);
}

// Add carbon footprint related functions
function exploreOffsets() {
  showNotification("Carbon offset programs coming soon!");
}

function calculateCO2Emissions(kWh) {
  // Average CO2 emissions factor for South Africa (kg CO2/kWh)
  const emissionsFactor = 0.98;
  return kWh * emissionsFactor;
}

function updateEmissionsData() {
  const monthlyUsage = 250; // Example monthly usage in kWh
  const emissions = calculateCO2Emissions(monthlyUsage);
  const emissionsElement = document.getElementById("monthlyEmissions");
  if (emissionsElement) {
    emissionsElement.textContent = emissions.toFixed(1);
  }
}

// Family Access Functions
function openInviteModal() {
  const modal = document.getElementById("invite-modal");
  if (modal) modal.style.display = "block";
}

function closeInviteModal() {
  const modal = document.getElementById("invite-modal");
  if (modal) modal.style.display = "none";
}

function openMemberActionsModal() {
  const modal = document.getElementById("member-actions-modal");
  if (modal) modal.style.display = "block";
}

function closeMemberActionsModal() {
  const modal = document.getElementById("member-actions-modal");
  if (modal) modal.style.display = "none";
}

function sendInvite(event) {
  event.preventDefault();
  const email = document.getElementById("invite-email").value;
  const permissions = Array.from(
    document.querySelectorAll(".permission-checkbox input:checked")
  ).map((checkbox) => checkbox.parentElement.textContent.trim());

  // Here you would typically make an API call to send the invitation
  console.log("Sending invite to:", email, "with permissions:", permissions);

  showNotification(`Invitation sent to ${email}`);
  closeInviteModal();
}

function resendInvite(email) {
  // Here you would typically make an API call to resend the invitation
  console.log("Resending invite to:", email);
  showNotification(`Invitation resent to ${email}`);
}

function cancelInvite(email) {
  // Here you would typically make an API call to cancel the invitation
  console.log("Canceling invite for:", email);
  showNotification(`Invitation canceled for ${email}`);
}

function showMemberActions(email) {
  openMemberActionsModal();
  // Store the current member email for use in other actions
  localStorage.setItem("currentMemberEmail", email);
}

function editPermissions() {
  const email = localStorage.getItem("currentMemberEmail");
  // Here you would typically open a permissions editor modal
  showNotification(`Editing permissions for ${email}`);
  closeMemberActionsModal();
}

function revokeMemberAccess() {
  const email = localStorage.getItem("currentMemberEmail");
  if (confirm(`Are you sure you want to revoke access for ${email}?`)) {
    // Here you would typically make an API call to revoke access
    showNotification(`Access revoked for ${email}`);
    closeMemberActionsModal();
  }
}

// Handle clicks outside modals
window.onclick = function (event) {
  const inviteModal = document.getElementById("invite-modal");
  const memberActionsModal = document.getElementById("member-actions-modal");

  if (event.target === inviteModal) {
    closeInviteModal();
  }
  if (event.target === memberActionsModal) {
    closeMemberActionsModal();
  }
};

// Location Functions
let map;
let currentLocationMarker;

function initMap() {
  if (!document.getElementById("locationMap")) return;

  // Initialize map centered on South Africa
  map = new google.maps.Map(document.getElementById("locationMap"), {
    center: { lat: -30.5595, lng: 22.9375 },
    zoom: 5,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  });

  // Try to get user's current location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        map.setCenter(pos);
        map.setZoom(12);

        if (currentLocationMarker) {
          currentLocationMarker.setMap(null);
        }

        currentLocationMarker = new google.maps.Marker({
          position: pos,
          map: map,
          title: "Current Location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#2196F3",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
      },
      () => {
        showNotification("Error: The Geolocation service failed.", "error");
      }
    );
  }
}

function refreshLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (map) {
          map.setCenter(pos);
          if (currentLocationMarker) {
            currentLocationMarker.setPosition(pos);
          }
        }

        showNotification("Location updated successfully!");
        // Here you would typically make an API call to update the backend
      },
      () => {
        showNotification("Error: Could not get your location.", "error");
      }
    );
  } else {
    showNotification(
      "Error: Geolocation is not supported by this browser.",
      "error"
    );
  }
}

function toggleAutoDetect(checkbox) {
  if (checkbox.checked) {
    refreshLocation();
    showNotification("Auto-detect location enabled");
  } else {
    showNotification("Auto-detect location disabled");
  }
}

function addLocation() {
  const modal = document.getElementById("location-modal");
  if (modal) modal.style.display = "block";
}

function closeLocationModal() {
  const modal = document.getElementById("location-modal");
  if (modal) modal.style.display = "none";
}

function saveLocation(event) {
  event.preventDefault();
  const name = document.getElementById("location-name").value;
  const address = document.getElementById("location-address").value;

  // Here you would typically make an API call to save the location
  console.log("Saving location:", { name, address });

  showNotification(`Location "${name}" added successfully!`);
  closeLocationModal();
}

function showLocationActions(button) {
  const modal = document.getElementById("actions-modal");
  if (modal) modal.style.display = "block";
}

function closeActionsModal() {
  const modal = document.getElementById("actions-modal");
  if (modal) modal.style.display = "none";
}

function setAsDefault() {
  showNotification("Location set as default");
  closeActionsModal();
}

function editLocation() {
  // Here you would typically populate and show the edit form
  showNotification("Edit location coming soon");
  closeActionsModal();
}

function deleteLocation() {
  if (confirm("Are you sure you want to delete this location?")) {
    showNotification("Location deleted successfully");
    closeActionsModal();
  }
}

// Initialize map when the page loads
document.addEventListener("DOMContentLoaded", () => {
  initMap();
});

// Handle clicks outside modals
window.onclick = function (event) {
  const locationModal = document.getElementById("location-modal");
  const actionsModal = document.getElementById("actions-modal");

  if (event.target === locationModal) {
    closeLocationModal();
  }
  if (event.target === actionsModal) {
    closeActionsModal();
  }
};

// Notification Functions
function openNotificationSettings() {
  const modal = document.getElementById("notification-settings-modal");
  if (modal) modal.style.display = "block";
}

function closeNotificationSettings() {
  const modal = document.getElementById("notification-settings-modal");
  if (modal) modal.style.display = "none";
}

function markAllAsRead() {
  const unreadNotifications = document.querySelectorAll(
    ".notification-item.unread"
  );
  unreadNotifications.forEach((notification) => {
    notification.classList.remove("unread");
  });
  showNotification("All notifications marked as read");
}

function filterNotifications(category) {
  // Update active tab
  const tabs = document.querySelectorAll(".tab-button");
  tabs.forEach((tab) => {
    if (tab.textContent.toLowerCase().includes(category)) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Filter notifications
  const notifications = document.querySelectorAll(".notification-item");
  notifications.forEach((notification) => {
    if (category === "all") {
      notification.style.display = "flex";
    } else {
      notification.style.display = notification.classList.contains(category)
        ? "flex"
        : "none";
    }
  });

  // Update notification count if needed
  updateNotificationCount(category);
}

function updateNotificationCount(category) {
  const notifications = document.querySelectorAll(
    category === "all" ? ".notification-item" : `.notification-item.${category}`
  );
  const unreadCount = Array.from(notifications).filter((n) =>
    n.classList.contains("unread")
  ).length;

  // Update the tab text with count if needed
  const tab = document.querySelector(`.tab-button[onclick*="${category}"]`);
  if (tab) {
    const baseText = tab.textContent.split("(")[0].trim();
    tab.textContent =
      unreadCount > 0 ? `${baseText} (${unreadCount})` : baseText;
  }
}

function viewSchedule() {
  // Here you would typically navigate to the load-shedding schedule page
  showNotification("Load-shedding schedule coming soon");
}
