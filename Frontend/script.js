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

const boothSelect = document.getElementById("booth");
const locationInput = document.getElementById("location");
const serviceSelect = document.getElementById("service");
const revenueInput = document.getElementById("revenue");

boothSelect.addEventListener("change", function () {
    const selectedBooth = boothSelect.value;

    locationInput.value = "";
    serviceSelect.innerHTML = '<option value="">Select Service</option>';
    revenueInput.value = "";

    if (!selectedBooth) return;

    locationInput.value = boothLocations[selectedBooth];

    const services = boothServices[selectedBooth];
    services.forEach(function (serviceName) {
        const option = document.createElement("option");
        option.value = serviceName;
        option.textContent = serviceName;
        serviceSelect.appendChild(option);
    });
});

serviceSelect.addEventListener("change", function () {
    const selectedService = serviceSelect.value;

    if (selectedService && revenueRates[selectedService]) {
        revenueInput.value = revenueRates[selectedService];
    } else {
        revenueInput.value = "";
    }
});