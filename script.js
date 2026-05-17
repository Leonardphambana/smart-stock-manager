/* =========================
   APPLICATION DATA
========================= */

let inventory = [];
let salesHistory = [];
let adjustmentHistory = [];
let totalSalesAmount = 0;
let editItemId = null;

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
const buyingPriceInput = document.getElementById("buyingPrice");
const sellingPriceInput = document.getElementById("sellingPrice");

const salesShopSelect = document.getElementById("salesShopSelect");
const saleItemInput = document.getElementById("saleItem");
const saleQuantityInput = document.getElementById("saleQuantity");
const salesClearPeriod = document.getElementById("salesClearPeriod");
const clearSalesHistoryBtn = document.getElementById("clearSalesHistory");

const stockTakeShop1Body = document.getElementById("stockTakeShop1Body");
const stockTakeShop2Body = document.getElementById("stockTakeShop2Body");

const shop1Body = document.getElementById("shop1Body");
const shop2Body = document.getElementById("shop2Body");
const salesHistoryBody = document.getElementById("salesHistoryBody");
const adjustmentHistoryBody = document.getElementById("adjustmentHistoryBody");

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

if (salesShopSelect) {
    salesShopSelect.addEventListener("change", populateSalesDropdown);
}

if (clearSalesHistoryBtn) {
    clearSalesHistoryBtn.addEventListener("click", clearSalesHistory);
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

function getOptionalNonNegativeNumber(input) {
    if (input.value.trim() === "") {
        return 0;
    }

    return getNonNegativeNumber(input);
}

function getStockValue(item) {
    return item.quantity * item.sellingPrice;
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

function addAdjustment(entry) {
    adjustmentHistory.unshift({
        id: createId(),
        date: new Date().toLocaleString(),
        ...entry
    });
}

function refreshViews() {
    const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const visibleItems = term
        ? inventory.filter(function(item) {
            return item.name.toLowerCase().includes(term);
        })
        : inventory;

    renderInventory(visibleItems);
    renderSalesHistory();
    renderAdjustmentHistory();
    updateDashboard();
    populateSalesDropdown();
    renderStockTaking();
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
                "Buying Price",
                "Selling Price",
                "Stock Value",
                "Status"
            ],
            ...inventory.map(function(item) {
                return [
                    item.shop,
                    item.name,
                    item.quantity,
                    item.buyingPrice,
                    item.sellingPrice,
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
            "Buying Price",
            "Selling Price",
            "Stock Value",
            "Status"
        ],
        ...items.map(function(item) {
            return [
                item.shop,
                item.name,
                item.quantity,
                item.buyingPrice,
                item.sellingPrice,
                getStockValue(item),
                getStockStatus(item)
            ];
        })
    ];
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
            sheets: [["Shop 1 Stock Taking", getStockTakingRows(shop1Items)]]
        },
        stockTakeShop2: {
            fileName: "shop-2-stock-taking",
            sheets: [["Shop 2 Stock Taking", getStockTakingRows(shop2Items)]]
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
    const buyingPrice = getOptionalNonNegativeNumber(buyingPriceInput);
    const sellingPrice = getPositiveNumber(sellingPriceInput);

    if (!shopSelect.value || !name) {
        alert("Fill all fields");
        return;
    }

    if (quantity === null) {
        alert("Quantity must be zero or more");
        return;
    }

    if (buyingPrice === null) {
        alert("Buying price must be zero or more");
        return;
    }

    if (sellingPrice === null) {
        alert("Selling price must be greater than zero");
        return;
    }

    if (isDuplicateProduct(shopSelect.value, name, editItemId)) {
        alert("This product already exists in the selected shop");
        return;
    }

    if (editItemId !== null) {
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
        item.buyingPrice = buyingPrice;
        item.sellingPrice = sellingPrice;

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
        const item = {
            id: createId(),
            shop: shopSelect.value,
            name: name,
            quantity: quantity,
            buyingPrice: buyingPrice,
            sellingPrice: sellingPrice
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
    buyingPriceInput.value = item.buyingPrice;
    sellingPriceInput.value = item.sellingPrice;
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

/* =========================
   RENDER INVENTORY
========================= */

function renderInventory(items) {
    if (!shop1Body || !shop2Body) {
        return;
    }

    shop1Body.textContent = "";
    shop2Body.textContent = "";

    items.forEach(function(item) {
        const row = document.createElement("tr");
        const status = getStockStatus(item);
        const statusClass = item.quantity <= 5 ? "low-stock" : "in-stock";

        if (item.quantity <= 5) {
            row.classList.add("low-stock-row");
        }

        row.appendChild(createCell(item.name));
        row.appendChild(createCell(item.quantity));
        row.appendChild(createCell(formatMoney(item.buyingPrice)));
        row.appendChild(createCell(formatMoney(item.sellingPrice)));

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

        if (item.shop === "Shop 1") {
            shop1Body.appendChild(row);
        } else {
            shop2Body.appendChild(row);
        }
    });
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

    const amount = quantity * item.sellingPrice;
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

    adjustmentHistory.forEach(function(entry) {
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
}

/* =========================
   DASHBOARD
========================= */

function updateDashboard() {
    if (!totalProducts || !stockValue || !totalSales || !lowStock) {
        return;
    }

    totalProducts.textContent = inventory.length;

    let value = 0;
    let low = 0;

    inventory.forEach(function(item) {
        value += getStockValue(item);

        if (item.quantity <= 5) {
            low++;
        }
    });

    stockValue.textContent = formatMoney(value);
    totalSales.textContent = formatMoney(totalSalesAmount);
    lowStock.textContent = low;
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

    inventory.forEach(function(item) {
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
    localStorage.setItem("inventory", JSON.stringify(inventory));
    localStorage.setItem("salesHistory", JSON.stringify(salesHistory));
    localStorage.setItem("adjustmentHistory", JSON.stringify(adjustmentHistory));
    localStorage.setItem("totalSalesAmount", totalSalesAmount);
}

/* =========================
   LOAD DATA
========================= */

function loadData() {
    const savedInventory = localStorage.getItem("inventory");
    const savedSales = localStorage.getItem("salesHistory");
    const savedAdjustments = localStorage.getItem("adjustmentHistory");
    const savedTotal = localStorage.getItem("totalSalesAmount");

    if (savedInventory) {
        inventory = JSON.parse(savedInventory).map(function(item) {
            return {
                id: item.id || createId(),
                shop: item.shop,
                name: item.name,
                quantity: Number(item.quantity),
                buyingPrice: Number.isFinite(Number(item.buyingPrice)) ? Number(item.buyingPrice) : 0,
                sellingPrice: Number(item.sellingPrice)
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
                note: entry.note
            };
        });
    }

    if (savedTotal && salesHistory.length === 0) {
        totalSalesAmount = Number(savedTotal);
    }

    saveData();
    refreshViews();
}

/* =========================
   START APP
========================= */

loadData();
