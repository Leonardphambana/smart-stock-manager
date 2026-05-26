/* =========================
   APPLICATION DATA
========================= */

let inventory = [];
let salesHistory = [];
let adjustmentHistory = [];
let totalSalesAmount = 0;
let profileName = "My Stock Profile";
let editItemId = null;
let showAllAdjustments = false;
let showAllShop1Inventory = false;
let showAllShop2Inventory = false;
let firebaseSettings = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: ""
};
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseUser = null;
let firebaseUnsubscribe = null;
let firebaseAuthUnsubscribe = null;
let firebaseReady = false;
let firebaseHydrating = false;
let firebaseSaveTimer = null;
let firebaseConfigSignature = "";
let firebaseBootstrapPromise = null;
let firebaseModulesPromise = null;

/* =========================
   DOM ELEMENTS
========================= */

const stockForm = document.getElementById("stockForm");
const salesForm = document.getElementById("salesForm");
const searchInput = document.getElementById("searchInput");
const exportExcelBtns = document.querySelectorAll("[data-export]");

const shopSelect = document.getElementById("shopSelect");
const itemNameInput = document.getElementById("itemName");
const itemQuantityInput = document.getElementById("itemQuantity");
const priceInput = document.getElementById("price");

const salesShopSelect = document.getElementById("salesShopSelect");
const saleItemInput = document.getElementById("saleItem");
const saleQuantityInput = document.getElementById("saleQuantity");
const salesClearPeriod = document.getElementById("salesClearPeriod");
const clearSalesHistoryBtn = document.getElementById("clearSalesHistory");

const shop1Section = document.getElementById("shop1Section");
const shop2Section = document.getElementById("shop2Section");
const inventoryShopFilter = document.getElementById("inventoryShopFilter");
const inventoryDateFilter = document.getElementById("inventoryDateFilter");
const inventoryItemFilter = document.getElementById("inventoryItemFilter");
const resetInventoryFiltersBtn = document.getElementById("resetInventoryFilters");

const stockTakeShop1Body = document.getElementById("stockTakeShop1Body");
const stockTakeShop2Body = document.getElementById("stockTakeShop2Body");
const stockTakeShop1Section = document.getElementById("stockTakeShop1Section");
const stockTakeShop2Section = document.getElementById("stockTakeShop2Section");
const stockTakeShopFilter = document.getElementById("stockTakeShopFilter");
const stockTakeDateFilter = document.getElementById("stockTakeDateFilter");
const stockTakeItemFilter = document.getElementById("stockTakeItemFilter");
const resetStockTakeFiltersBtn = document.getElementById("resetStockTakeFilters");

const shop1Body = document.getElementById("shop1Body");
const shop2Body = document.getElementById("shop2Body");
const toggleShop1InventoryBtn = document.getElementById("toggleShop1Inventory");
const toggleShop2InventoryBtn = document.getElementById("toggleShop2Inventory");
const salesHistoryBody = document.getElementById("salesHistoryBody");
const adjustmentHistoryBody = document.getElementById("adjustmentHistoryBody");
const toggleAdjustmentHistoryBtn = document.getElementById("toggleAdjustmentHistory");
const firebaseStatus = document.getElementById("firebaseStatus");
const firebaseApiKeyInput = document.getElementById("firebaseApiKey");
const firebaseAuthDomainInput = document.getElementById("firebaseAuthDomain");
const firebaseProjectIdInput = document.getElementById("firebaseProjectId");
const firebaseAppIdInput = document.getElementById("firebaseAppId");
const firebaseEmailInput = document.getElementById("firebaseEmail");
const firebasePasswordInput = document.getElementById("firebasePassword");
const saveFirebaseConfigBtn = document.getElementById("saveFirebaseConfig");
const firebaseSignInBtn = document.getElementById("firebaseSignIn");
const firebaseCreateAccountBtn = document.getElementById("firebaseCreateAccount");
const firebaseSignOutBtn = document.getElementById("firebaseSignOut");
const profileNameInput = document.getElementById("profileName");
const profileStatus = document.getElementById("profileStatus");
const saveProfileNameBtn = document.getElementById("saveProfileName");
const exportProfileBtn = document.getElementById("exportProfile");
const importProfileInput = document.getElementById("importProfile");

const totalProducts = document.getElementById("totalProducts");
const stockValue = document.getElementById("stockValue");
const totalSales = document.getElementById("totalSales");
const lowStock = document.getElementById("lowStock");

/* =========================
   EVENT LISTENERS
========================= */

if (stockForm) {
    stockForm.addEventListener("submit", addStock);
}

if (salesForm) {
    salesForm.addEventListener("submit", recordSale);
}

if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
}

if (inventoryShopFilter) {
    inventoryShopFilter.addEventListener("change", function() {
        populateInventoryItemFilter();
        refreshViews();
    });
}

if (inventoryDateFilter) {
    inventoryDateFilter.addEventListener("change", refreshViews);
}

if (inventoryItemFilter) {
    inventoryItemFilter.addEventListener("change", refreshViews);
}

if (resetInventoryFiltersBtn) {
    resetInventoryFiltersBtn.addEventListener("click", resetInventoryFilters);
}

if (salesShopSelect) {
    salesShopSelect.addEventListener("change", populateSalesDropdown);
}

if (clearSalesHistoryBtn) {
    clearSalesHistoryBtn.addEventListener("click", clearSalesHistory);
}

if (stockTakeShopFilter) {
    stockTakeShopFilter.addEventListener("change", function() {
        populateStockTakeItemFilter();
        renderStockTaking();
    });
}

if (stockTakeDateFilter) {
    stockTakeDateFilter.addEventListener("change", renderStockTaking);
}

if (stockTakeItemFilter) {
    stockTakeItemFilter.addEventListener("change", renderStockTaking);
}

if (resetStockTakeFiltersBtn) {
    resetStockTakeFiltersBtn.addEventListener("click", resetStockTakeFilters);
}

if (toggleAdjustmentHistoryBtn) {
    toggleAdjustmentHistoryBtn.addEventListener("click", toggleAdjustmentHistory);
}

if (toggleShop1InventoryBtn) {
    toggleShop1InventoryBtn.addEventListener("click", toggleShop1Inventory);
}

if (toggleShop2InventoryBtn) {
    toggleShop2InventoryBtn.addEventListener("click", toggleShop2Inventory);
}

if (saveFirebaseConfigBtn) {
    saveFirebaseConfigBtn.addEventListener("click", saveFirebaseConfig);
}

if (firebaseSignInBtn) {
    firebaseSignInBtn.addEventListener("click", function() {
        signInToFirebase(false);
    });
}

if (firebaseCreateAccountBtn) {
    firebaseCreateAccountBtn.addEventListener("click", function() {
        signInToFirebase(true);
    });
}

if (firebaseSignOutBtn) {
    firebaseSignOutBtn.addEventListener("click", signOutFromFirebase);
}

if (saveProfileNameBtn) {
    saveProfileNameBtn.addEventListener("click", saveProfileName);
}

if (exportProfileBtn) {
    exportProfileBtn.addEventListener("click", exportProfile);
}

if (importProfileInput) {
    importProfileInput.addEventListener("change", importProfile);
}

exportExcelBtns.forEach(function(button) {
    button.addEventListener("click", function() {
        exportExcelWorkbook(button.dataset.export);
    });
});

/* =========================
   HELPERS
========================= */

function createId() {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }

    return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatMoney(amount) {
    return `MK ${Number(amount).toLocaleString()}`;
}

function getStockStatus(item) {
    return item.quantity <= 5 ? "Low Stock" : "In Stock";
}

function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

function createButton(text, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
}

function getPositiveNumber(input) {
    const value = Number(input.value);

    if (!Number.isFinite(value) || value <= 0) {
        return null;
    }

    return value;
}

function getSavedItemPrice(item) {
    const price = Number(item.price);
    const sellingPrice = Number(item.sellingPrice);
    const buyingPrice = Number(item.buyingPrice);

    if (Number.isFinite(price) && price > 0) {
        return price;
    }

    if (Number.isFinite(sellingPrice) && sellingPrice > 0) {
        return sellingPrice;
    }

    if (Number.isFinite(buyingPrice) && buyingPrice > 0) {
        return buyingPrice;
    }

    return 0;
}

function getStockValue(item) {
    return item.quantity * item.price;
}

function getSaleDate(sale) {
    const timestamp = Number(sale.timestamp);

    if (Number.isFinite(timestamp) && timestamp > 0) {
        return new Date(timestamp);
    }

    const parsedDate = new Date(sale.date);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
}

function getStartOfPeriod(period) {
    const start = new Date();

    start.setHours(0, 0, 0, 0);

    if (period === "week") {
        const day = start.getDay();
        const daysSinceMonday = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - daysSinceMonday);
    }

    if (period === "month") {
        start.setDate(1);
    }

    if (period === "year") {
        start.setMonth(0, 1);
    }

    return start;
}

function isSaleInClearPeriod(sale, period) {
    if (period === "all") {
        return true;
    }

    const saleDate = getSaleDate(sale);

    if (!saleDate) {
        return false;
    }

    return saleDate >= getStartOfPeriod(period);
}

function getClearPeriodLabel(period) {
    const labels = {
        today: "daily",
        week: "weekly",
        month: "monthly",
        year: "yearly",
        all: "all"
    };

    return labels[period] || "selected";
}

function updateTotalSalesAmount() {
    totalSalesAmount = salesHistory.reduce(function(total, sale) {
        return total + Number(sale.amount);
    }, 0);
}

function getNonNegativeNumber(input) {
    if (input.value.trim() === "") {
        return null;
    }

    const value = Number(input.value);

    if (!Number.isFinite(value) || value < 0) {
        return null;
    }

    return value;
}

function findItemById(id) {
    return inventory.find(function(item) {
        return item.id === id;
    });
}

function isDuplicateProduct(shop, name, currentId) {
    const normalizedName = name.trim().toLowerCase();

    return inventory.some(function(item) {
        return (
            item.id !== currentId &&
            item.shop === shop &&
            item.name.trim().toLowerCase() === normalizedName
        );
    });
}

function findExistingProduct(shop, name) {
    const normalizedName = name.trim().toLowerCase();

    return inventory.find(function(item) {
        return (
            item.shop === shop &&
            item.name.trim().toLowerCase() === normalizedName
        );
    });
}

function addAdjustment(entry) {
    adjustmentHistory.unshift({
        id: createId(),
        date: new Date().toLocaleString(),
        timestamp: Date.now(),
        ...entry
    });
}

function refreshViews() {
    populateInventoryItemFilter();
    renderInventory(getInventoryFilteredItems());
    renderSalesHistory();
    renderAdjustmentHistory();
    updateDashboard();
    updateFirebasePanel();
    updateProfilePanel();
    populateSalesDropdown();
    populateStockTakeItemFilter();
    renderStockTaking();
}

function loadFirebaseSettings() {
    const savedSettings = localStorage.getItem("firebaseSettings");

    if (!savedSettings) {
        return;
    }

    try {
        const parsed = JSON.parse(savedSettings);

        firebaseSettings = {
            apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
            authDomain: typeof parsed.authDomain === "string" ? parsed.authDomain : "",
            projectId: typeof parsed.projectId === "string" ? parsed.projectId : "",
            appId: typeof parsed.appId === "string" ? parsed.appId : ""
        };
    } catch (error) {
        localStorage.removeItem("firebaseSettings");
    }
}

function updateFirebasePanel(message) {
    if (firebaseApiKeyInput) {
        firebaseApiKeyInput.value = firebaseSettings.apiKey;
    }

    if (firebaseAuthDomainInput) {
        firebaseAuthDomainInput.value = firebaseSettings.authDomain;
    }

    if (firebaseProjectIdInput) {
        firebaseProjectIdInput.value = firebaseSettings.projectId;
    }

    if (firebaseAppIdInput) {
        firebaseAppIdInput.value = firebaseSettings.appId;
    }

    if (!firebaseStatus) {
        return;
    }

    if (message) {
        firebaseStatus.textContent = message;
        return;
    }

    if (!firebaseSettings.apiKey || !firebaseSettings.authDomain || !firebaseSettings.projectId || !firebaseSettings.appId) {
        firebaseStatus.textContent = "Firebase not connected";
        return;
    }

    if (firebaseUser) {
        firebaseStatus.textContent = `Signed in as ${firebaseUser.email || firebaseUser.uid}`;
        return;
    }

    firebaseStatus.textContent = "Firebase ready. Sign in to sync across gadgets.";
}

function getFirebaseConfigFromInputs() {
    return {
        apiKey: firebaseApiKeyInput ? firebaseApiKeyInput.value.trim() : "",
        authDomain: firebaseAuthDomainInput ? firebaseAuthDomainInput.value.trim() : "",
        projectId: firebaseProjectIdInput ? firebaseProjectIdInput.value.trim() : "",
        appId: firebaseAppIdInput ? firebaseAppIdInput.value.trim() : ""
    };
}

function hasFirebaseConfig(config) {
    return Boolean(
        config &&
        config.apiKey &&
        config.authDomain &&
        config.projectId &&
        config.appId
    );
}

function saveFirebaseConfig() {
    const config = getFirebaseConfigFromInputs();

    if (!hasFirebaseConfig(config)) {
        alert("Fill in the Firebase config fields first");
        return;
    }

    firebaseSettings = config;
    localStorage.setItem("firebaseSettings", JSON.stringify(firebaseSettings));
    updateFirebasePanel("Firebase config saved");
    initializeFirebaseBackend();
}

async function getFirebaseModules() {
    if (!firebaseModulesPromise) {
        firebaseModulesPromise = Promise.all([
            import("https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js"),
            import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js")
        ]).then(function(modules) {
            return {
                app: {
                    initializeApp: modules[0].initializeApp,
                    deleteApp: modules[0].deleteApp
                },
                auth: {
                    getAuth: modules[1].getAuth,
                    setPersistence: modules[1].setPersistence,
                    browserLocalPersistence: modules[1].browserLocalPersistence,
                    onAuthStateChanged: modules[1].onAuthStateChanged,
                    createUserWithEmailAndPassword: modules[1].createUserWithEmailAndPassword,
                    signInWithEmailAndPassword: modules[1].signInWithEmailAndPassword,
                    signOut: modules[1].signOut
                },
                firestore: {
                    getFirestore: modules[2].getFirestore,
                    doc: modules[2].doc,
                    onSnapshot: modules[2].onSnapshot,
                    setDoc: modules[2].setDoc
                }
            };
        });
    }

    return firebaseModulesPromise;
}

async function initializeFirebaseBackend() {
    if (firebaseBootstrapPromise) {
        return firebaseBootstrapPromise;
    }

    firebaseBootstrapPromise = (async function() {
        if (!hasFirebaseConfig(firebaseSettings)) {
            updateFirebasePanel("Firebase not connected");
            return;
        }

        let modules;

        try {
            modules = await getFirebaseModules();
        } catch (error) {
            updateFirebasePanel("Firebase SDK could not load");
            return;
        }

        const configSignature = JSON.stringify(firebaseSettings);

        if (firebaseApp && firebaseConfigSignature !== configSignature && modules.app.deleteApp) {
            if (firebaseAuthUnsubscribe) {
                firebaseAuthUnsubscribe();
                firebaseAuthUnsubscribe = null;
            }
            await modules.app.deleteApp(firebaseApp);
            firebaseApp = null;
            firebaseAuth = null;
            firebaseDb = null;
            firebaseUser = null;
            if (firebaseUnsubscribe) {
                firebaseUnsubscribe();
                firebaseUnsubscribe = null;
            }
        }

        if (!firebaseApp) {
            firebaseApp = modules.app.initializeApp(firebaseSettings);
            firebaseConfigSignature = configSignature;
            firebaseAuth = modules.auth.getAuth(firebaseApp);
            firebaseDb = modules.firestore.getFirestore(firebaseApp);

            await modules.auth.setPersistence(
                firebaseAuth,
                modules.auth.browserLocalPersistence
            );

            firebaseAuthUnsubscribe = modules.auth.onAuthStateChanged(
                firebaseAuth,
                handleFirebaseAuthState
            );
        }

        updateFirebasePanel();
    })();

    try {
        await firebaseBootstrapPromise;
    } finally {
        firebaseBootstrapPromise = null;
    }
}

function cleanupFirebaseProfileListener() {
    if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
        firebaseUnsubscribe = null;
    }
}

function getFirebaseProfileRef(modules) {
    return modules.firestore.doc(firebaseDb, "profiles", firebaseUser.uid);
}

function applyFirebaseProfileSnapshot(data) {
    firebaseHydrating = true;

    try {
        profileName = typeof data.profileName === "string" && data.profileName.trim()
            ? data.profileName.trim()
            : "My Stock Profile";

        inventory = Array.isArray(data.inventory)
            ? data.inventory.map(function(item) {
                return {
                    id: item.id || createId(),
                    shop: item.shop,
                    name: item.name,
                    quantity: Number(item.quantity),
                    price: getSavedItemPrice(item)
                };
            })
            : [];

        salesHistory = Array.isArray(data.salesHistory)
            ? data.salesHistory.map(function(sale) {
                return {
                    id: sale.id || createId(),
                    shop: sale.shop,
                    item: sale.item,
                    quantity: Number(sale.quantity),
                    amount: Number(sale.amount),
                    date: sale.date,
                    timestamp: Number.isFinite(Number(sale.timestamp)) ? Number(sale.timestamp) : null
                };
            })
            : [];

        adjustmentHistory = Array.isArray(data.adjustmentHistory)
            ? data.adjustmentHistory.map(function(entry) {
                return {
                    id: entry.id || createId(),
                    date: entry.date,
                    type: entry.type,
                    shop: entry.shop,
                    item: entry.item,
                    previousQuantity: Number(entry.previousQuantity),
                    newQuantity: Number(entry.newQuantity),
                    note: entry.note,
                    timestamp: Number.isFinite(Number(entry.timestamp)) ? Number(entry.timestamp) : null
                };
            })
            : [];

        if (typeof data.totalSalesAmount === "number" && Number.isFinite(data.totalSalesAmount)) {
            totalSalesAmount = data.totalSalesAmount;
        } else {
            updateTotalSalesAmount();
        }

        persistLocalData();
        refreshViews();
    } finally {
        firebaseHydrating = false;
    }
}

function seedFirebaseProfileIfEmpty(modules) {
    const profileRef = getFirebaseProfileRef(modules);

    return modules.firestore.setDoc(profileRef, getFirebaseProfileData());
}

function handleFirebaseProfileSnapshot(modules) {
    cleanupFirebaseProfileListener();

    const profileRef = getFirebaseProfileRef(modules);

    firebaseReady = false;
    firebaseUnsubscribe = modules.firestore.onSnapshot(
        profileRef,
        function(snapshot) {
            if (snapshot.exists()) {
                applyFirebaseProfileSnapshot(snapshot.data());
                firebaseReady = true;
                updateFirebasePanel();
                return;
            }

            firebaseReady = true;
            seedFirebaseProfileIfEmpty(modules).catch(function(error) {
                updateFirebasePanel(`Firebase sync failed: ${error.message}`);
            });
            updateFirebasePanel();
        },
        function(error) {
            firebaseReady = false;
            updateFirebasePanel(`Firebase sync failed: ${error.message}`);
        }
    );
}

function handleFirebaseAuthState(user) {
    firebaseUser = user || null;

    if (!user) {
        firebaseReady = false;
        cleanupFirebaseProfileListener();
        updateFirebasePanel();
        return;
    }

    getFirebaseModules()
        .then(function(modules) {
            handleFirebaseProfileSnapshot(modules);
            updateFirebasePanel();
        })
        .catch(function(error) {
            updateFirebasePanel(`Firebase sync failed: ${error.message}`);
        });
}

function scheduleFirebaseSave() {
    if (!firebaseReady || firebaseHydrating || !firebaseUser || !firebaseDb) {
        return;
    }

    if (firebaseSaveTimer) {
        clearTimeout(firebaseSaveTimer);
    }

    firebaseSaveTimer = setTimeout(function() {
        persistFirebaseProfile().catch(function(error) {
            updateFirebasePanel(`Firebase sync failed: ${error.message}`);
        });
    }, 350);
}

async function persistFirebaseProfile() {
    if (!firebaseReady || firebaseHydrating || !firebaseUser || !firebaseDb) {
        return;
    }

    const modules = await getFirebaseModules();
    const profileRef = getFirebaseProfileRef(modules);

    await modules.firestore.setDoc(profileRef, {
        ...getFirebaseProfileData(),
        ownerEmail: firebaseUser.email || "",
        updatedAt: new Date().toISOString()
    });

    updateFirebasePanel(`Signed in as ${firebaseUser.email || firebaseUser.uid}`);
}

async function signInToFirebase(createAccount) {
    const config = getFirebaseConfigFromInputs();

    if (!hasFirebaseConfig(config)) {
        alert("Save the Firebase config first");
        return;
    }

    firebaseSettings = config;
    localStorage.setItem("firebaseSettings", JSON.stringify(firebaseSettings));

    const email = firebaseEmailInput ? firebaseEmailInput.value.trim() : "";
    const password = firebasePasswordInput ? firebasePasswordInput.value : "";

    if (!email || !password) {
        alert("Enter an email and password");
        return;
    }

    try {
        await initializeFirebaseBackend();
        const modules = await getFirebaseModules();

        if (createAccount) {
            await modules.auth.createUserWithEmailAndPassword(firebaseAuth, email, password);
        } else {
            await modules.auth.signInWithEmailAndPassword(firebaseAuth, email, password);
        }

        updateFirebasePanel(`Signed in as ${email}`);
    } catch (error) {
        updateFirebasePanel(`Firebase auth failed: ${error.message}`);
    }
}

async function signOutFromFirebase() {
    try {
        const modules = await getFirebaseModules();

        if (firebaseAuth) {
            await modules.auth.signOut(firebaseAuth);
        }
    } catch (error) {
        updateFirebasePanel(`Firebase sign-out failed: ${error.message}`);
    }
}

function getFirebaseProfileData() {
    return {
        app: "smart-stock-manager",
        version: 2,
        exportedAt: new Date().toISOString(),
        profileName,
        inventory,
        salesHistory,
        adjustmentHistory,
        totalSalesAmount
    };
}

function persistLocalData() {
    localStorage.setItem("profileName", profileName);
    localStorage.setItem("inventory", JSON.stringify(inventory));
    localStorage.setItem("salesHistory", JSON.stringify(salesHistory));
    localStorage.setItem("adjustmentHistory", JSON.stringify(adjustmentHistory));
    localStorage.setItem("totalSalesAmount", totalSalesAmount);
}

/* =========================
   PROFILE TRANSFER
========================= */

function getProfileData() {
    return {
        app: "smart-stock-manager",
        version: 1,
        exportedAt: new Date().toISOString(),
        profileName,
        inventory,
        salesHistory,
        adjustmentHistory,
        totalSalesAmount
    };
}

function getProfileFileName() {
    const safeName = profileName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "stock-profile";

    return `${safeName}-backup.json`;
}

function updateProfilePanel() {
    if (profileNameInput) {
        profileNameInput.value = profileName;
    }

    if (profileStatus) {
        profileStatus.textContent = `Current profile: ${profileName}`;
    }
}

function saveProfileName() {
    const nextName = profileNameInput ? profileNameInput.value.trim() : "";

    if (!nextName) {
        alert("Enter a profile name");
        return;
    }

    profileName = nextName;
    saveData();
    updateProfilePanel();
}

function exportProfile() {
    const blob = new Blob(
        [JSON.stringify(getProfileData(), null, 2)],
        { type: "application/json" }
    );
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = getProfileFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
}

function normalizeProfileArray(value) {
    return Array.isArray(value) ? value : [];
}

function applyProfileData(data) {
    if (!data || data.app !== "smart-stock-manager") {
        alert("This is not a Smart Stock Manager profile file");
        return;
    }

    profileName = typeof data.profileName === "string" && data.profileName.trim()
        ? data.profileName.trim()
        : "Imported Stock Profile";

    inventory = normalizeProfileArray(data.inventory).map(function(item) {
        return {
            id: item.id || createId(),
            shop: item.shop,
            name: item.name,
            quantity: Number(item.quantity),
            price: getSavedItemPrice(item)
        };
    });

    salesHistory = normalizeProfileArray(data.salesHistory).map(function(sale) {
        return {
            id: sale.id || createId(),
            shop: sale.shop,
            item: sale.item,
            quantity: Number(sale.quantity),
            amount: Number(sale.amount),
            date: sale.date,
            timestamp: Number.isFinite(Number(sale.timestamp)) ? Number(sale.timestamp) : null
        };
    });

    adjustmentHistory = normalizeProfileArray(data.adjustmentHistory).map(function(entry) {
        return {
            id: entry.id || createId(),
            date: entry.date,
            type: entry.type,
            shop: entry.shop,
            item: entry.item,
            previousQuantity: Number(entry.previousQuantity),
            newQuantity: Number(entry.newQuantity),
            note: entry.note,
            timestamp: Number.isFinite(Number(entry.timestamp)) ? Number(entry.timestamp) : null
        };
    });

    updateTotalSalesAmount();
    saveData();
    refreshViews();
    alert("Profile imported successfully");
}

function importProfile(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", function() {
        try {
            applyProfileData(JSON.parse(reader.result));
        } catch (error) {
            alert("Could not read this profile file");
        }

        event.target.value = "";
    });

    reader.readAsText(file);
}

/* =========================
   EXCEL EXPORT
========================= */

function escapeXml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function getCellType(value) {
    return typeof value === "number" && Number.isFinite(value)
        ? "Number"
        : "String";
}

function buildWorksheet(name, rows) {
    const tableRows = rows.map(function(row) {
        const cells = row.map(function(value) {
            return (
                "<Cell>" +
                `<Data ss:Type="${getCellType(value)}">` +
                escapeXml(value) +
                "</Data>" +
                "</Cell>"
            );
        }).join("");

        return `<Row>${cells}</Row>`;
    }).join("");

    return (
        `<Worksheet ss:Name="${escapeXml(name)}">` +
        `<Table>${tableRows}</Table>` +
        "</Worksheet>"
    );
}

function getExportRows() {
    const stockValueAmount = inventory.reduce(function(total, item) {
        return total + getStockValue(item);
    }, 0);

    return {
        summary: [
            ["Metric", "Value"],
            ["Total Products", inventory.length],
            ["Total Stock Value", stockValueAmount],
            ["Total Sales", totalSalesAmount],
            ["Low Stock Items", inventory.filter(function(item) {
                return item.quantity <= 5;
            }).length],
            ["Exported At", new Date().toLocaleString()]
        ],
        inventory: [
            [
                "Shop",
                "Item",
                "Quantity",
                "Price",
                "Stock Value",
                "Status"
            ],
            ...inventory.map(function(item) {
                return [
                    item.shop,
                    item.name,
                    item.quantity,
                    item.price,
                    getStockValue(item),
                    getStockStatus(item)
                ];
            })
        ],
        sales: [
            ["Date", "Shop", "Item", "Quantity", "Total Amount"],
            ...salesHistory.map(function(sale) {
                return [
                    sale.date,
                    sale.shop,
                    sale.item,
                    sale.quantity,
                    sale.amount
                ];
            })
        ],
        adjustments: [
            [
                "Date",
                "Type",
                "Shop",
                "Item",
                "Previous Quantity",
                "New Quantity",
                "Note"
            ],
            ...adjustmentHistory.map(function(entry) {
                return [
                    entry.date,
                    entry.type,
                    entry.shop,
                    entry.item,
                    entry.previousQuantity,
                    entry.newQuantity,
                    entry.note
                ];
            })
        ],
        stockTaking: [
            ["Shop", "Item", "System Stock", "Status"],
            ...inventory.map(function(item) {
                return [
                    item.shop,
                    item.name,
                    item.quantity,
                    getStockStatus(item)
                ];
            })
        ]
    };
}

function getInventoryRows(items) {
    return [
        [
            "Shop",
            "Item",
            "Quantity",
            "Price",
            "Stock Value",
            "Status"
        ],
        ...items.map(function(item) {
            return [
                item.shop,
                item.name,
                item.quantity,
                item.price,
                getStockValue(item),
                getStockStatus(item)
            ];
        })
    ];
}

function getStockTakeExportItems(shop) {
    if (!stockTakeShopFilter && !stockTakeDateFilter && !stockTakeItemFilter) {
        return inventory.filter(function(item) {
            return item.shop === shop;
        });
    }

    return inventory.filter(function(item) {
        if (item.shop !== shop) {
            return false;
        }

        if (stockTakeItemFilter && stockTakeItemFilter.value && item.name !== stockTakeItemFilter.value) {
            return false;
        }

        if (stockTakeDateFilter && stockTakeDateFilter.value) {
            return formatDateKey(getLatestItemAdjustmentDate(item)) === stockTakeDateFilter.value;
        }

        return true;
    });
}

function getStockTakingRows(items) {
    return [
        ["Shop", "Item", "System Stock", "Status"],
        ...items.map(function(item) {
            return [
                item.shop,
                item.name,
                item.quantity,
                getStockStatus(item)
            ];
        })
    ];
}

function getExportConfig(type) {
    const rows = getExportRows();
    const shop1Items = inventory.filter(function(item) {
        return item.shop === "Shop 1";
    });
    const shop2Items = inventory.filter(function(item) {
        return item.shop === "Shop 2";
    });

    const configs = {
        shop1: {
            fileName: "shop-1-inventory",
            sheets: [["Shop 1 Inventory", getInventoryRows(shop1Items)]]
        },
        shop2: {
            fileName: "shop-2-inventory",
            sheets: [["Shop 2 Inventory", getInventoryRows(shop2Items)]]
        },
        sales: {
            fileName: "sales-history",
            sheets: [["Sales", rows.sales]]
        },
        adjustments: {
            fileName: "stock-adjustments",
            sheets: [["Adjustments", rows.adjustments]]
        },
        stockTakeShop1: {
            fileName: "shop-1-stock-taking",
            sheets: [["Shop 1 Stock Taking", getStockTakingRows(getStockTakeExportItems("Shop 1"))]]
        },
        stockTakeShop2: {
            fileName: "shop-2-stock-taking",
            sheets: [["Shop 2 Stock Taking", getStockTakingRows(getStockTakeExportItems("Shop 2"))]]
        },
        all: {
            fileName: "stock-manager-export",
            sheets: [
                ["Summary", rows.summary],
                ["Inventory", rows.inventory],
                ["Sales", rows.sales],
                ["Adjustments", rows.adjustments],
                ["Stock Taking", rows.stockTaking]
            ]
        }
    };

    return configs[type] || configs.all;
}

function exportExcelWorkbook(type) {
    const config = getExportConfig(type);
    const workbook =
        '<?xml version="1.0"?>' +
        '<?mso-application progid="Excel.Sheet"?>' +
        '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
        'xmlns:o="urn:schemas-microsoft-com:office:office" ' +
        'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
        'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
        config.sheets.map(function(sheet) {
            return buildWorksheet(sheet[0], sheet[1]);
        }).join("") +
        "</Workbook>";

    const blob = new Blob([workbook], {
        type: "application/vnd.ms-excel;charset=utf-8"
    });

    const exportDate = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${config.fileName}-${exportDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/* =========================
   ADD / EDIT STOCK
========================= */

function addStock(event) {
    event.preventDefault();

    const name = itemNameInput.value.trim();
    const quantity = getNonNegativeNumber(itemQuantityInput);
    const price = getPositiveNumber(priceInput);

    if (!shopSelect.value || !name) {
        alert("Fill all fields");
        return;
    }

    if (quantity === null) {
        alert("Quantity must be zero or more");
        return;
    }

    if (price === null) {
        alert("Price must be greater than zero");
        return;
    }

    if (editItemId !== null) {
        if (isDuplicateProduct(shopSelect.value, name, editItemId)) {
            alert("This product already exists in the selected shop");
            return;
        }

        const item = findItemById(editItemId);

        if (!item) {
            alert("Item no longer exists");
            editItemId = null;
            stockForm.reset();
            return;
        }

        const previousQuantity = item.quantity;
        const previousName = item.name;
        const previousShop = item.shop;

        item.shop = shopSelect.value;
        item.name = name;
        item.quantity = quantity;
        item.price = price;

        addAdjustment({
            type: "Edit",
            shop: item.shop,
            item: item.name,
            previousQuantity: previousQuantity,
            newQuantity: item.quantity,
            note: `${previousShop} / ${previousName} updated`
        });

        editItemId = null;
    } else {
        const existingItem = findExistingProduct(shopSelect.value, name);

        if (existingItem) {
            const previousQuantity = existingItem.quantity;

            existingItem.quantity += quantity;
            existingItem.price = price;

            addAdjustment({
                type: "Top Up",
                shop: existingItem.shop,
                item: existingItem.name,
                previousQuantity: previousQuantity,
                newQuantity: existingItem.quantity,
                note: `${quantity} added to existing stock`
            });

            saveData();
            stockForm.reset();
            refreshViews();
            return;
        }

        const item = {
            id: createId(),
            shop: shopSelect.value,
            name: name,
            quantity: quantity,
            price: price
        };

        inventory.push(item);

        addAdjustment({
            type: "Add",
            shop: item.shop,
            item: item.name,
            previousQuantity: 0,
            newQuantity: item.quantity,
            note: "New stock item"
        });
    }

    saveData();
    stockForm.reset();
    refreshViews();
}

/* =========================
   EDIT ITEM
========================= */

function editItem(id) {
    const item = findItemById(id);

    if (!item) {
        alert("Item not found");
        return;
    }

    shopSelect.value = item.shop;
    itemNameInput.value = item.name;
    itemQuantityInput.value = item.quantity;
    priceInput.value = item.price;
    editItemId = item.id;
    stockForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* =========================
   DELETE ITEM
========================= */

function deleteItem(id) {
    const item = findItemById(id);

    if (!item) {
        alert("Item not found");
        return;
    }

    const confirmDelete = confirm("Delete item?");

    if (!confirmDelete) {
        return;
    }

    inventory = inventory.filter(function(product) {
        return product.id !== id;
    });

    addAdjustment({
        type: "Delete",
        shop: item.shop,
        item: item.name,
        previousQuantity: item.quantity,
        newQuantity: 0,
        note: "Item removed"
    });

    if (editItemId === id) {
        editItemId = null;
        stockForm.reset();
    }

    saveData();
    refreshViews();
}

/* =========================
   SEARCH
========================= */

function handleSearch() {
    refreshViews();
}

function getInventoryFilteredItems() {
    const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const shop = inventoryShopFilter ? inventoryShopFilter.value : "";
    const itemName = inventoryItemFilter ? inventoryItemFilter.value : "";
    const date = inventoryDateFilter ? inventoryDateFilter.value : "";

    return inventory.filter(function(item) {
        if (term && !item.name.toLowerCase().includes(term)) {
            return false;
        }

        if (shop && item.shop !== shop) {
            return false;
        }

        if (itemName && item.name !== itemName) {
            return false;
        }

        if (date) {
            return formatDateKey(getLatestItemAdjustmentDate(item)) === date;
        }

        return true;
    });
}

function getInventoryFilteredSales() {
    const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const shop = inventoryShopFilter ? inventoryShopFilter.value : "";
    const itemName = inventoryItemFilter ? inventoryItemFilter.value : "";
    const date = inventoryDateFilter ? inventoryDateFilter.value : "";

    return salesHistory.filter(function(sale) {
        if (term && !sale.item.toLowerCase().includes(term)) {
            return false;
        }

        if (shop && sale.shop !== shop) {
            return false;
        }

        if (itemName && sale.item !== itemName) {
            return false;
        }

        if (date) {
            return formatDateKey(getSaleDate(sale)) === date;
        }

        return true;
    });
}

function getSalesTotal(sales) {
    return sales.reduce(function(total, sale) {
        return total + Number(sale.amount);
    }, 0);
}

function populateInventoryItemFilter() {
    if (!inventoryItemFilter) {
        return;
    }

    const selectedItem = inventoryItemFilter.value;
    const selectedShop = inventoryShopFilter ? inventoryShopFilter.value : "";
    const names = [];

    inventory.forEach(function(item) {
        if (selectedShop && item.shop !== selectedShop) {
            return;
        }

        if (!names.includes(item.name)) {
            names.push(item.name);
        }
    });

    names.sort(function(a, b) {
        return a.localeCompare(b);
    });

    inventoryItemFilter.textContent = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "All Items";
    inventoryItemFilter.appendChild(placeholder);

    names.forEach(function(name) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        inventoryItemFilter.appendChild(option);
    });

    if (names.includes(selectedItem)) {
        inventoryItemFilter.value = selectedItem;
    }
}

function resetInventoryFilters() {
    if (inventoryShopFilter) {
        inventoryShopFilter.value = "";
    }

    if (inventoryDateFilter) {
        inventoryDateFilter.value = "";
    }

    if (inventoryItemFilter) {
        inventoryItemFilter.value = "";
    }

    if (searchInput) {
        searchInput.value = "";
    }

    populateInventoryItemFilter();
    refreshViews();
}

/* =========================
   RENDER INVENTORY
========================= */

function renderInventory(items) {
    if (!shop1Body || !shop2Body) {
        return;
    }

    shop1Body.textContent = "";
    shop2Body.textContent = "";

    const selectedShop = inventoryShopFilter ? inventoryShopFilter.value : "";
    const shop1Items = items.filter(function(item) {
        return item.shop === "Shop 1";
    });
    const shop2Items = items.filter(function(item) {
        return item.shop === "Shop 2";
    });
    const visibleShop1Items = showAllShop1Inventory ? shop1Items : shop1Items.slice(0, 3);
    const visibleShop2Items = showAllShop2Inventory ? shop2Items : shop2Items.slice(0, 3);

    if (shop1Section) {
        shop1Section.style.display = selectedShop === "Shop 2" ? "none" : "";
    }

    if (shop2Section) {
        shop2Section.style.display = selectedShop === "Shop 1" ? "none" : "";
    }

    visibleShop1Items.forEach(function(item) {
        renderInventoryRow(item, shop1Body);
    });

    visibleShop2Items.forEach(function(item) {
        renderInventoryRow(item, shop2Body);
    });

    updateInventoryToggle(toggleShop1InventoryBtn, shop1Items.length, showAllShop1Inventory);
    updateInventoryToggle(toggleShop2InventoryBtn, shop2Items.length, showAllShop2Inventory);
}

function renderInventoryRow(item, tableBody) {
    if (!tableBody) {
        return;
    }

    const row = document.createElement("tr");
    const status = getStockStatus(item);
    const statusClass = item.quantity <= 5 ? "low-stock" : "in-stock";

    if (item.quantity <= 5) {
        row.classList.add("low-stock-row");
    }

    row.appendChild(createCell(item.name));
    row.appendChild(createCell(item.quantity));
    row.appendChild(createCell(formatMoney(item.price)));

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = `status ${statusClass}`;
    statusBadge.textContent = status;
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    const actionsCell = document.createElement("td");
    actionsCell.className = "actions-cell";
    actionsCell.appendChild(
        createButton("Edit", "edit-btn", function() {
            editItem(item.id);
        })
    );
    actionsCell.appendChild(
        createButton("Delete", "delete-btn", function() {
            deleteItem(item.id);
        })
    );
    row.appendChild(actionsCell);

    tableBody.appendChild(row);
}

function updateInventoryToggle(button, itemCount, isExpanded) {
    if (!button) {
        return;
    }

    button.hidden = itemCount <= 3;
    button.textContent = isExpanded ? "See Less" : "See More";
}

function toggleShop1Inventory() {
    showAllShop1Inventory = !showAllShop1Inventory;
    renderInventory(getInventoryFilteredItems());
}

function toggleShop2Inventory() {
    showAllShop2Inventory = !showAllShop2Inventory;
    renderInventory(getInventoryFilteredItems());
}

/* =========================
   POPULATE SALES DROPDOWN
========================= */

function populateSalesDropdown() {
    if (!saleItemInput || !salesShopSelect) {
        return;
    }

    const selectedItemId = saleItemInput.value;
    saleItemInput.textContent = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select Product";
    saleItemInput.appendChild(placeholder);

    const products = inventory.filter(function(item) {
        return item.shop === salesShopSelect.value;
    });

    products.forEach(function(item) {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.name} (${item.quantity} available)`;
        saleItemInput.appendChild(option);
    });

    if (products.some(function(item) { return item.id === selectedItemId; })) {
        saleItemInput.value = selectedItemId;
    }
}

/* =========================
   RECORD SALE
========================= */

function recordSale(event) {
    event.preventDefault();

    const item = findItemById(saleItemInput.value);
    const quantity = getPositiveNumber(saleQuantityInput);

    if (!salesShopSelect.value) {
        alert("Select shop");
        return;
    }

    if (!item || item.shop !== salesShopSelect.value) {
        alert("Item not found");
        return;
    }

    if (quantity === null) {
        alert("Sale quantity must be greater than zero");
        return;
    }

    if (quantity > item.quantity) {
        alert("Not enough stock");
        return;
    }

    const previousQuantity = item.quantity;
    item.quantity -= quantity;

    const amount = quantity * item.price;
    totalSalesAmount += amount;

    salesHistory.unshift({
        id: createId(),
        shop: item.shop,
        item: item.name,
        quantity: quantity,
        amount: amount,
        date: new Date().toLocaleString(),
        timestamp: Date.now()
    });

    addAdjustment({
        type: "Sale",
        shop: item.shop,
        item: item.name,
        previousQuantity: previousQuantity,
        newQuantity: item.quantity,
        note: `${quantity} sold`
    });

    saveData();
    salesForm.reset();
    refreshViews();
}

/* =========================
   SALES HISTORY
========================= */

function renderSalesHistory() {
    if (!salesHistoryBody) {
        return;
    }

    salesHistoryBody.textContent = "";

    salesHistory.forEach(function(sale) {
        const row = document.createElement("tr");

        row.appendChild(createCell(sale.shop));
        row.appendChild(createCell(sale.item));
        row.appendChild(createCell(sale.quantity));
        row.appendChild(createCell(formatMoney(sale.amount)));
        row.appendChild(createCell(sale.date));

        salesHistoryBody.appendChild(row);
    });
}

function clearSalesHistory() {
    if (!salesClearPeriod) {
        return;
    }

    if (salesHistory.length === 0) {
        alert("No sales history to clear");
        return;
    }

    const period = salesClearPeriod.value;
    const matches = salesHistory.filter(function(sale) {
        return isSaleInClearPeriod(sale, period);
    });

    if (matches.length === 0) {
        alert(`No ${getClearPeriodLabel(period)} sales history found`);
        return;
    }

    const confirmClear = confirm(`Clear ${matches.length} ${getClearPeriodLabel(period)} sales record(s)?`);

    if (!confirmClear) {
        return;
    }

    salesHistory = salesHistory.filter(function(sale) {
        return !isSaleInClearPeriod(sale, period);
    });

    updateTotalSalesAmount();
    saveData();
    refreshViews();
}

/* =========================
   ADJUSTMENT HISTORY
========================= */

function renderAdjustmentHistory() {
    if (!adjustmentHistoryBody) {
        return;
    }

    adjustmentHistoryBody.textContent = "";

    const visibleAdjustments = showAllAdjustments
        ? adjustmentHistory
        : adjustmentHistory.slice(0, 3);

    visibleAdjustments.forEach(function(entry) {
        const row = document.createElement("tr");

        row.appendChild(createCell(entry.date));
        row.appendChild(createCell(entry.type));
        row.appendChild(createCell(entry.shop));
        row.appendChild(createCell(entry.item));
        row.appendChild(createCell(entry.previousQuantity));
        row.appendChild(createCell(entry.newQuantity));
        row.appendChild(createCell(entry.note));

        adjustmentHistoryBody.appendChild(row);
    });

    if (toggleAdjustmentHistoryBtn) {
        toggleAdjustmentHistoryBtn.hidden = adjustmentHistory.length <= 3;
        toggleAdjustmentHistoryBtn.textContent = showAllAdjustments ? "See Less" : "See More";
    }
}

function toggleAdjustmentHistory() {
    showAllAdjustments = !showAllAdjustments;
    renderAdjustmentHistory();
}

/* =========================
   DASHBOARD
========================= */

function updateDashboard() {
    if (!totalProducts || !stockValue || !totalSales || !lowStock) {
        return;
    }

    const visibleItems = getInventoryFilteredItems();
    const visibleSales = getInventoryFilteredSales();

    totalProducts.textContent = visibleItems.length;

    let value = 0;
    let low = 0;

    visibleItems.forEach(function(item) {
        value += getStockValue(item);

        if (item.quantity <= 5) {
            low++;
        }
    });

    stockValue.textContent = formatMoney(value);
    totalSales.textContent = formatMoney(getSalesTotal(visibleSales));
    lowStock.textContent = low;
}

function getAdjustmentDate(entry) {
    const timestamp = Number(entry.timestamp);

    if (Number.isFinite(timestamp) && timestamp > 0) {
        return new Date(timestamp);
    }

    const parsedDate = new Date(entry.date);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
}

function formatDateKey(date) {
    if (!date) {
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getLatestItemAdjustmentDate(item) {
    const adjustment = adjustmentHistory.find(function(entry) {
        return entry.shop === item.shop && entry.item === item.name;
    });

    return adjustment ? getAdjustmentDate(adjustment) : null;
}

function getStockTakeFilteredItems() {
    const shop = stockTakeShopFilter ? stockTakeShopFilter.value : "";
    const itemName = stockTakeItemFilter ? stockTakeItemFilter.value : "";
    const date = stockTakeDateFilter ? stockTakeDateFilter.value : "";

    return inventory.filter(function(item) {
        if (shop && item.shop !== shop) {
            return false;
        }

        if (itemName && item.name !== itemName) {
            return false;
        }

        if (date) {
            return formatDateKey(getLatestItemAdjustmentDate(item)) === date;
        }

        return true;
    });
}

function populateStockTakeItemFilter() {
    if (!stockTakeItemFilter) {
        return;
    }

    const selectedItem = stockTakeItemFilter.value;
    const selectedShop = stockTakeShopFilter ? stockTakeShopFilter.value : "";
    const names = [];

    inventory.forEach(function(item) {
        if (selectedShop && item.shop !== selectedShop) {
            return;
        }

        if (!names.includes(item.name)) {
            names.push(item.name);
        }
    });

    names.sort(function(a, b) {
        return a.localeCompare(b);
    });

    stockTakeItemFilter.textContent = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "All Items";
    stockTakeItemFilter.appendChild(placeholder);

    names.forEach(function(name) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        stockTakeItemFilter.appendChild(option);
    });

    if (names.includes(selectedItem)) {
        stockTakeItemFilter.value = selectedItem;
    }
}

function resetStockTakeFilters() {
    if (stockTakeShopFilter) {
        stockTakeShopFilter.value = "";
    }

    if (stockTakeDateFilter) {
        stockTakeDateFilter.value = "";
    }

    if (stockTakeItemFilter) {
        stockTakeItemFilter.value = "";
    }

    populateStockTakeItemFilter();
    renderStockTaking();
}

/* =========================
   STOCK TAKING PAGE
========================= */

function renderStockTaking() {
    if (!stockTakeShop1Body || !stockTakeShop2Body) {
        return;
    }

    stockTakeShop1Body.textContent = "";
    stockTakeShop2Body.textContent = "";

    const items = getStockTakeFilteredItems();
    const selectedShop = stockTakeShopFilter ? stockTakeShopFilter.value : "";

    if (stockTakeShop1Section) {
        stockTakeShop1Section.style.display = selectedShop === "Shop 2" ? "none" : "";
    }

    if (stockTakeShop2Section) {
        stockTakeShop2Section.style.display = selectedShop === "Shop 1" ? "none" : "";
    }

    items.forEach(function(item) {
        const row = document.createElement("tr");

        row.appendChild(createCell(item.name));
        row.appendChild(createCell(item.quantity));

        const actualCell = document.createElement("td");
        const actualInput = document.createElement("input");
        actualInput.type = "number";
        actualInput.min = "0";
        actualInput.step = "1";
        actualInput.className = "actual-input";
        actualInput.placeholder = "Actual Count";
        actualCell.appendChild(actualInput);
        row.appendChild(actualCell);

        const differenceCell = createCell("0");
        differenceCell.className = "difference-cell";
        row.appendChild(differenceCell);

        const actionCell = document.createElement("td");
        actionCell.appendChild(
            createButton("Balance", "balance-btn", function() {
                balanceStock(item.id, actualInput);
            })
        );
        row.appendChild(actionCell);

        actualInput.addEventListener("input", function() {
            const actual = getNonNegativeNumber(actualInput);

            differenceCell.classList.remove(
                "negative-difference",
                "positive-difference"
            );

            if (actual === null) {
                differenceCell.textContent = "0";
                return;
            }

            const difference = actual - item.quantity;
            differenceCell.textContent = difference;

            if (difference < 0) {
                differenceCell.classList.add("negative-difference");
            } else if (difference > 0) {
                differenceCell.classList.add("positive-difference");
            }
        });

        if (item.shop === "Shop 1") {
            stockTakeShop1Body.appendChild(row);
        } else {
            stockTakeShop2Body.appendChild(row);
        }
    });
}

function balanceStock(id, actualInput) {
    const item = findItemById(id);
    const actual = getNonNegativeNumber(actualInput);

    if (!item) {
        alert("Item not found");
        return;
    }

    if (actual === null) {
        alert("Enter actual stock");
        return;
    }

    const previousQuantity = item.quantity;
    item.quantity = actual;

    addAdjustment({
        type: "Balance",
        shop: item.shop,
        item: item.name,
        previousQuantity: previousQuantity,
        newQuantity: item.quantity,
        note: `Difference: ${item.quantity - previousQuantity}`
    });

    saveData();
    refreshViews();
    alert("Stock balanced successfully");
}

/* =========================
   SAVE DATA
========================= */

function saveData() {
    persistLocalData();

    if (!firebaseHydrating && firebaseReady && firebaseUser && firebaseDb) {
        scheduleFirebaseSave();
    }
}

/* =========================
   LOAD DATA
========================= */

function loadData() {
    loadFirebaseSettings();

    const savedProfileName = localStorage.getItem("profileName");
    const savedInventory = localStorage.getItem("inventory");
    const savedSales = localStorage.getItem("salesHistory");
    const savedAdjustments = localStorage.getItem("adjustmentHistory");
    const savedTotal = localStorage.getItem("totalSalesAmount");

    if (savedProfileName && savedProfileName.trim()) {
        profileName = savedProfileName.trim();
    }

    if (savedInventory) {
        inventory = JSON.parse(savedInventory).map(function(item) {
            return {
                id: item.id || createId(),
                shop: item.shop,
                name: item.name,
                quantity: Number(item.quantity),
                price: getSavedItemPrice(item)
            };
        });
    }

    if (savedSales) {
        salesHistory = JSON.parse(savedSales).map(function(sale) {
            return {
                id: sale.id || createId(),
                shop: sale.shop,
                item: sale.item,
                quantity: Number(sale.quantity),
                amount: Number(sale.amount),
                date: sale.date,
                timestamp: Number.isFinite(Number(sale.timestamp)) ? Number(sale.timestamp) : null
            };
        });

        updateTotalSalesAmount();
    }

    if (savedAdjustments) {
        adjustmentHistory = JSON.parse(savedAdjustments).map(function(entry) {
            return {
                id: entry.id || createId(),
                date: entry.date,
                type: entry.type,
                shop: entry.shop,
                item: entry.item,
                previousQuantity: Number(entry.previousQuantity),
                newQuantity: Number(entry.newQuantity),
                note: entry.note,
                timestamp: Number.isFinite(Number(entry.timestamp)) ? Number(entry.timestamp) : null
            };
        });
    }

    if (savedTotal && salesHistory.length === 0) {
        totalSalesAmount = Number(savedTotal);
    }

    persistLocalData();
    refreshViews();
}

/* =========================
   START APP
========================= */

loadData();
initializeFirebaseBackend();
