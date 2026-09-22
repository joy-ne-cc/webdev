// API Base Endpoint
const API_BASE = "http://127.0.0.1:5000/api";

// Mapping Data
const boothLocations = {
    Wina1: "Lusaka CPD",
    Wina2: "Libala",
    Wina3: "Kabwata",
    Wina4: "Mandevu",
    Wina5: "Woodlands",
    Wina6: "Matero East"
};

const boothServices = {
    Wina1: ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"],
    Wina2: ["Airtel Money", "MTN Money", "Zamtel Money", "FNB"],
    Wina3: ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"],
    Wina4: ["Airtel Money", "MTN Money", "Zamtel Money"],
    Wina5: ["Airtel Money", "MTN Money", "Zanaco", "FNB"],
    Wina6: ["Airtel Money", "MTN Money", "Zamtel Money"]
};

const revenueRates = {
    "Airtel Money": 0.05,
    "MTN Money": 0.06,
    "Zamtel Money": 0.045,
    "Zanaco": 0.035,
    "FNB": 0.04
};

const serviceIds = {
    "Airtel Money": 1,
    "MTN Money": 2,
    "Zamtel Money": 3,
    "Zanaco": 4,
    "FNB": 5
};

const boothIds = {
    "Wina1": 1, "Wina2": 2, "Wina3": 3,
    "Wina4": 4, "Wina5": 5, "Wina6": 6
};

// Initialize Event Listeners safely after DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    const boothSelect = document.getElementById("booth");
    const locationInput = document.getElementById("location");
    const serviceSelect = document.getElementById("service");
    const revenueInput = document.getElementById("revenue");
    const transactionForm = document.getElementById("transactionForm");

    // 1. When Booth Changes -> Populate Location & Filter Service Dropdown
    if (boothSelect) {
        boothSelect.addEventListener("change", function () {
            const selectedBooth = boothSelect.value;
            locationInput.value = "";
            serviceSelect.innerHTML = '<option value="">Select Service</option>';
            revenueInput.value = "";

            if (!selectedBooth || !boothServices[selectedBooth]) return;

            // Auto-populate Location
            locationInput.value = boothLocations[selectedBooth] || "";

            // Populate Service Options
            const services = boothServices[selectedBooth];
            services.forEach(function (serviceName) {
                const option = document.createElement("option");
                option.value = serviceName;
                option.textContent = serviceName;
                serviceSelect.appendChild(option);
            });
        });
    }

    // 2. When Service Changes -> Auto-populate Revenue Rate
    if (serviceSelect) {
        serviceSelect.addEventListener("change", function () {
            const selectedService = serviceSelect.value;
            if (selectedService && revenueRates[selectedService] !== undefined) {
                revenueInput.value = revenueRates[selectedService];
            } else {
                revenueInput.value = "";
            }
        });
    }

    // 3. Handle Form Submission without Page Reload
    if (transactionForm) {
        transactionForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevents page reload!

            const msgElement = document.getElementById("formMessage");
            const boothVal = boothSelect.value;
            const serviceVal = serviceSelect.value;
            const amountVal = parseFloat(document.getElementById("amount").value);

            const payload = {
                booth_id: boothIds[boothVal],
                service_id: serviceIds[serviceVal],
                amount: amountVal
            };

            try {
                const res = await fetch(`${API_BASE}/transactions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (res.ok) {
                    msgElement.className = "alert alert-success";
                    msgElement.innerHTML = `Transaction recorded successfully. Reference ID: <strong>${data.id || 'WB0000309'}</strong>`;
                    transactionForm.reset();
                    locationInput.value = "";
                    revenueInput.value = "";
                } else {
                    msgElement.className = "alert alert-danger";
                    msgElement.textContent = `Error: ${data.error || 'Failed to process transaction.'}`;
                }
            } catch (err) {
                msgElement.className = "alert alert-danger";
                msgElement.textContent = "Could not reach the server. Please check that the backend is running and try again.";
            }
        });
    }
});
