/* =========================
   APPLICATION DATA
========================= */

let inventory = [];

let salesHistory = [];

let totalSalesAmount = 0;

let editIndex = null;

/* =========================
   DOM ELEMENTS
========================= */

/* FORMS */

const stockForm =
    document.getElementById("stockForm");

const salesForm =
    document.getElementById("salesForm");

const stockTakeForm =
    document.getElementById("stockTakeForm");

/* SEARCH */

const searchInput =
    document.getElementById("searchInput");

/* STOCK INPUTS */

const shopSelect =
    document.getElementById("shopSelect");

const itemNameInput =
    document.getElementById("itemName");

const itemQuantityInput =
    document.getElementById("itemQuantity");

const buyingPriceInput =
    document.getElementById("buyingPrice");

const sellingPriceInput =
    document.getElementById("sellingPrice");

/* SALES */

const salesShopSelect =
    document.getElementById("salesShopSelect");

const saleItemInput =
    document.getElementById("saleItem");

const saleQuantityInput =
    document.getElementById("saleQuantity");

/* STOCK TAKING */

const stockTakeShop1Body =
    document.getElementById(
        "stockTakeShop1Body"
    );

const stockTakeShop2Body =
    document.getElementById(
        "stockTakeShop2Body"
    );

/* TABLES */

const shop1Body =
    document.getElementById("shop1Body");

const shop2Body =
    document.getElementById("shop2Body");

const salesHistoryBody =
    document.getElementById("salesHistoryBody");

/* DASHBOARD */

const totalProducts =
    document.getElementById("totalProducts");

const stockValue =
    document.getElementById("stockValue");

const totalSales =
    document.getElementById("totalSales");

const lowStock =
    document.getElementById("lowStock");

/* =========================
   EVENT LISTENERS
========================= */

if (stockForm) {

    stockForm.addEventListener(
        "submit",
        addStock
    );

}

if (salesForm) {

    salesForm.addEventListener(
        "submit",
        recordSale
    );

}

if (searchInput) {

    searchInput.addEventListener(
        "input",
        handleSearch
    );

}

if (salesShopSelect) {

    salesShopSelect.addEventListener(
        "change",
        populateSalesDropdown
    );

}

/* =========================
   ADD STOCK
========================= */

function addStock(event) {

    event.preventDefault();

    const item = {

        shop: shopSelect.value,

        name: itemNameInput.value.trim(),

        quantity: Number(
            itemQuantityInput.value
        ),

        buyingPrice: Number(
            buyingPriceInput.value
        ),

        sellingPrice: Number(
            sellingPriceInput.value
        )

    };

    /* VALIDATION */

    if (
        item.shop === "" ||
        item.name === ""
    ) {

        alert("Fill all fields");

        return;

    }

    /* EDIT */

    if (editIndex !== null) {

        inventory[editIndex] = item;

        editIndex = null;

    } else {

        inventory.push(item);

    }

    saveData();

    renderInventory(inventory);

    updateDashboard();

    populateSalesDropdown();

    stockForm.reset();

}

/* =========================
   EDIT ITEM
========================= */

function editItem(index) {

    const item = inventory[index];

    shopSelect.value =
        item.shop;

    itemNameInput.value =
        item.name;

    itemQuantityInput.value =
        item.quantity;

    buyingPriceInput.value =
        item.buyingPrice;

    sellingPriceInput.value =
        item.sellingPrice;

    editIndex = index;

}

/* =========================
   DELETE ITEM
========================= */

function deleteItem(index) {

    const confirmDelete =
        confirm("Delete item?");

    if (!confirmDelete) {

        return;

    }

    inventory.splice(index, 1);

    saveData();

    renderInventory(inventory);

    updateDashboard();

    populateSalesDropdown();

}

/* =========================
   SEARCH
========================= */

function handleSearch() {

    const term =
        searchInput.value.toLowerCase();

    const filtered =
        inventory.filter(function(item) {

            return item.name
                .toLowerCase()
                .includes(term);

        });

    renderInventory(filtered);

}

/* =========================
   RENDER INVENTORY
========================= */

function renderInventory(items) {

    if (!shop1Body || !shop2Body) {

        return;

    }

    shop1Body.innerHTML = "";

    shop2Body.innerHTML = "";

    items.forEach(function(item, index) {

        const row =
            document.createElement("tr");

        const status =
            item.quantity <= 5
            ? "Low Stock"
            : "In Stock";

        const statusClass =
            item.quantity <= 5
            ? "low-stock"
            : "in-stock";

        if (item.quantity <= 5) {

            row.classList.add(
                "low-stock-row"
            );

        }

        row.innerHTML = `

            <td>${item.name}</td>

            <td>${item.quantity}</td>

            <td>MK ${item.buyingPrice}</td>

            <td>MK ${item.sellingPrice}</td>

            <td>

                <span class="status ${statusClass}">
                    ${status}
                </span>

            </td>

            <td>

                <button
                    class="edit-btn"
                >
                    Edit
                </button>

                <button
                    class="delete-btn"
                >
                    Delete
                </button>

            </td>

        `;

        row.querySelector(".edit-btn")
            .addEventListener(
                "click",
                function() {

                    editItem(index);

                }
            );

        row.querySelector(".delete-btn")
            .addEventListener(
                "click",
                function() {

                    deleteItem(index);

                }
            );

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

    if (
        !saleItemInput ||
        !salesShopSelect
    ) {

        return;

    }

    saleItemInput.innerHTML = `
        <option value="">
            Select Product
        </option>
    `;

    const products =
        inventory.filter(function(item) {

            return (
                item.shop ===
                salesShopSelect.value
            );

        });

    products.forEach(function(item) {

        const option =
            document.createElement("option");

        option.value =
            item.name;

        option.textContent =
            item.name;

        saleItemInput.appendChild(option);

    });

}

/* =========================
   RECORD SALE
========================= */

function recordSale(event) {

    event.preventDefault();

    const item =
        inventory.find(function(product) {

            return (
                product.shop ===
                salesShopSelect.value
                &&
                product.name ===
                saleItemInput.value
            );

        });

    const quantity =
        Number(
            saleQuantityInput.value
        );

    if (!item) {

        alert("Item not found");

        return;

    }

    if (quantity > item.quantity) {

        alert("Not enough stock");

        return;

    }

    item.quantity -= quantity;

    const amount =
        quantity *
        item.sellingPrice;

    totalSalesAmount += amount;

    salesHistory.push({

        shop: item.shop,

        item: item.name,

        quantity: quantity,

        amount: amount,

        date:
            new Date().toLocaleString()

    });

    saveData();

    renderInventory(inventory);

    renderSalesHistory();

    updateDashboard();

    salesForm.reset();

}

/* =========================
   SALES HISTORY
========================= */

function renderSalesHistory() {

    if (!salesHistoryBody) {

        return;

    }

    salesHistoryBody.innerHTML = "";

    salesHistory.forEach(function(sale) {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>${sale.shop}</td>

            <td>${sale.item}</td>

            <td>${sale.quantity}</td>

            <td>MK ${sale.amount}</td>

            <td>${sale.date}</td>

        `;

        salesHistoryBody.appendChild(row);

    });

}

/* =========================
   DASHBOARD
========================= */

function updateDashboard() {

    if (
        !totalProducts ||
        !stockValue ||
        !totalSales ||
        !lowStock
    ) {

        return;

    }

    totalProducts.textContent =
        inventory.length;

    let value = 0;

    let low = 0;

    inventory.forEach(function(item) {

        value +=
            item.quantity *
            item.buyingPrice;

        if (item.quantity <= 5) {

            low++;

        }

    });

    stockValue.textContent =
        `MK ${value}`;

    totalSales.textContent =
        `MK ${totalSalesAmount}`;

    lowStock.textContent =
        low;

}

/* =========================
   STOCK TAKING PAGE
========================= */

function renderStockTaking() {

    if (
        !stockTakeShop1Body ||
        !stockTakeShop2Body
    ) {

        return;

    }

    stockTakeShop1Body.innerHTML = "";

    stockTakeShop2Body.innerHTML = "";

    inventory.forEach(function(item, index) {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>${item.name}</td>

            <td>${item.quantity}</td>

            <td>

                <input
                    type="number"
                    class="actual-input"
                    placeholder="Actual Count"
                >

            </td>

            <td class="difference-cell">
                0
            </td>

            <td>

                <button
                    class="balance-btn"
                >
                    Balance
                </button>

            </td>

        `;

        const actualInput =
            row.querySelector(
                ".actual-input"
            );

        const differenceCell =
            row.querySelector(
                ".difference-cell"
            );

        /* LIVE DIFFERENCE */

        actualInput.addEventListener(
            "input",
            function() {

                const actual =
                    Number(
                        actualInput.value
                    );

                const difference =
                    actual -
                    item.quantity;

                differenceCell.textContent =
                    difference;

                differenceCell.classList.remove(
                    "negative-difference"
                );

                differenceCell.classList.remove(
                    "positive-difference"
                );

                if (difference < 0) {

                    differenceCell.classList.add(
                        "negative-difference"
                    );

                } else if (
                    difference > 0
                ) {

                    differenceCell.classList.add(
                        "positive-difference"
                    );

                }

            }
        );

        /* BALANCE */

        row.querySelector(
            ".balance-btn"
        ).addEventListener(
            "click",
            function() {

                const actual =
                    Number(
                        actualInput.value
                    );

                if (
                    isNaN(actual)
                ) {

                    alert(
                        "Enter actual stock"
                    );

                    return;

                }

                item.quantity =
                    actual;

                saveData();

                renderInventory(
                    inventory
                );

                renderStockTaking();

                updateDashboard();

                alert(
                    "Stock balanced successfully"
                );

            }
        );

        if (item.shop === "Shop 1") {

            stockTakeShop1Body
                .appendChild(row);

        } else {

            stockTakeShop2Body
                .appendChild(row);

        }

    });

}

/* =========================
   SAVE DATA
========================= */

function saveData() {

    localStorage.setItem(
        "inventory",
        JSON.stringify(inventory)
    );

    localStorage.setItem(
        "salesHistory",
        JSON.stringify(salesHistory)
    );

    localStorage.setItem(
        "totalSalesAmount",
        totalSalesAmount
    );

}

/* =========================
   LOAD DATA
========================= */

function loadData() {

    const savedInventory =
        localStorage.getItem(
            "inventory"
        );

    if (savedInventory) {

        inventory =
            JSON.parse(savedInventory);

    }

    const savedSales =
        localStorage.getItem(
            "salesHistory"
        );

    if (savedSales) {

        salesHistory =
            JSON.parse(savedSales);

    }

    const savedTotal =
        localStorage.getItem(
            "totalSalesAmount"
        );

    if (savedTotal) {

        totalSalesAmount =
            Number(savedTotal);

    }

    renderInventory(inventory);

    renderSalesHistory();

    updateDashboard();

    populateSalesDropdown();

    renderStockTaking();

}

/* =========================
   START APP
========================= */

loadData();