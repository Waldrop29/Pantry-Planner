window.addEventListener("DOMContentLoaded", () => {
    const HISTORY_LIMIT = 200;

    // POPUP MESSAGE LOGIC
    const STORAGE_KEY = "popupSettings";
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    if (!settings.hide) showWelcomeMessage(false);

    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.key.toLowerCase() === "m") {
            showWelcomeMessage(true);
        }
    });

    function showWelcomeMessage(force = false) {
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

        if (!force && settings.hide) return;

        const dontShow = confirm(
            "Welcome to the Grocery List App! To add an item, type it in the input box and click 'Add' or press Enter. Click an item to mark it as acquired. Use the edit button to modify items, and the delete button to remove them. You can undo actions with Ctrl+Z. To toggle dark mode, click the 'Dark Mode' button. Enjoy organizing your groceries! Click OK to hide this message next time, or Cancel to show it again."
        );

        if (dontShow) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ hide: true }));
        }
    }

    // Initialize state
    let groceries = JSON.parse(localStorage.getItem("groceries") || "[]")
        .map(item => (typeof item === "string" ? { text: item } : item));

    let struckGroceries = JSON.parse(localStorage.getItem("struckGroceries") || "[]");

    let groceriesHistory = [];
    let struckHistory = [];

    // DOM elements
    const list = document.getElementById("groceries");
    const struckList = document.getElementById("struckList");
    const input = document.getElementById("itemInput");
    const addBtn = document.getElementById("button");
    const undoBtn = document.getElementById("undo-btn");
    const delAllBtn = document.getElementById("del-all-btn");
    const delMainBtn = document.getElementById("deletemainlist");
    const darkModeBtn = document.getElementById("darkModeToggle");

    // History management
    function pushHistory() {
        groceriesHistory.push(JSON.stringify(groceries));
        struckHistory.push(JSON.stringify(struckGroceries));

        if (groceriesHistory.length > HISTORY_LIMIT) groceriesHistory.shift();
        if (struckHistory.length > HISTORY_LIMIT) struckHistory.shift();
    }

    function undo() {
        if (!groceriesHistory.length && !struckHistory.length) return;

        if (groceriesHistory.length) groceries = JSON.parse(groceriesHistory.pop());
        if (struckHistory.length) struckGroceries = JSON.parse(struckHistory.pop());

        saveAndRender(false);
    }

    // Save + render
    function saveAndRender(push = true) {
        if (push) pushHistory();

        localStorage.setItem("groceries", JSON.stringify(groceries));
        localStorage.setItem("struckGroceries", JSON.stringify(struckGroceries));

        renderList();
        renderStruckList();
    }

    // Add item
    function addItem() {
        const val = input.value.trim();
        if (!val) return;

        pushHistory();
        groceries.push({ text: val });
        input.value = "";
        saveAndRender(false);
        input.focus();
    }

    // Render main list
    function renderList() {
        list.innerHTML = "";

        groceries.forEach((item, idx) => {
            const li = document.createElement("li");
            li.classList.add("fade-in");

            const textSpan = document.createElement("span");
            textSpan.textContent = item.text;
            textSpan.className = "item-text";

            // Move to struck list
            textSpan.addEventListener("click", () => {
                pushHistory();
                struckGroceries.push(item);
                groceries.splice(idx, 1);
                saveAndRender(false);

                setTimeout(() => {
                    if (struckList.lastChild) {
                        struckList.lastChild.classList.add("struck-animate");
                    }
                }, 30);
            });

            // Edit button
            const editBtn = document.createElement("button");
            editBtn.className = "edit-btn";
            editBtn.title = "Edit item";

            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.classList.add("edit-icon");

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute(
                "d",
                "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
            );
            path.setAttribute("fill", "currentColor");

            svg.appendChild(path);
            editBtn.appendChild(svg);

            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();

                const inputEdit = document.createElement("input");
                inputEdit.type = "text";
                inputEdit.value = item.text;
                inputEdit.className = "edit-input";

                li.replaceChild(inputEdit, textSpan);
                inputEdit.focus();

                function saveEdit() {
                    const newVal = inputEdit.value.trim();
                    if (!newVal) {
                        alert("Item text cannot be empty");
                        return inputEdit.focus();
                    }
                    pushHistory();
                    groceries[idx].text = newVal;
                    saveAndRender(false);
                }

                function cancelEdit() {
                    renderList();
                }

                inputEdit.addEventListener("keydown", (ev) => {
                    if (ev.key === "Enter") saveEdit();
                    if (ev.key === "Escape") cancelEdit();
                });

                inputEdit.addEventListener("blur", () => {
                    if (document.activeElement !== inputEdit) saveEdit();
                });
            });

            // Delete button
            const delBtn = document.createElement("button");
            delBtn.textContent = "Delete";
            delBtn.className = "delete-btn";

            delBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (!confirm("Delete this item?")) return;

                pushHistory();
                groceries.splice(idx, 1);
                saveAndRender(false);
            });

            li.appendChild(textSpan);
            li.appendChild(editBtn);
            li.appendChild(delBtn);
            list.appendChild(li);
        });

        input.placeholder =
            groceries.length === 0
                ? "Nothing yet! Add something tasty!"
                : "Add a grocery item";
    }

    // Render struck list
    function renderStruckList() {
        struckList.innerHTML = "";

        struckGroceries.forEach((item, idx) => {
            const li = document.createElement("li");
            li.textContent = item.text;

            li.addEventListener("click", () => {
                pushHistory();
                groceries.push(item);
                struckGroceries.splice(idx, 1);
                saveAndRender(false);
            });

            struckList.appendChild(li);
        });
    }

    // Delete all struck
    function deleteAllStruck() {
        if (!struckGroceries.length) return;
        if (!confirm("Delete all acquired items?")) return;

        pushHistory();
        struckGroceries = [];
        saveAndRender(false);
    }

    // DARK MODE — CLEAN, SINGLE VERSION
    function setDarkMode(on) {
        document.body.classList.toggle("dark-mode", on);
        localStorage.setItem("darkMode", on ? "1" : "0");
        if (darkModeBtn) darkModeBtn.textContent = on ? "Light Mode" : "Dark Mode";
    }

    // Load saved mode
    setDarkMode(localStorage.getItem("darkMode") === "1");

    // Toggle button
    if (darkModeBtn) {
        darkModeBtn.addEventListener("click", () =>
            setDarkMode(!document.body.classList.contains("dark-mode"))
        );
    }

    // EVENT LISTENERS
    addBtn.addEventListener("click", addItem);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") addItem();
    });

    undoBtn.addEventListener("click", undo);
    delAllBtn.addEventListener("click", deleteAllStruck);
    delMainBtn.addEventListener("click", () => {
        if (!confirm("Clear the main list?")) return;
        pushHistory();
        groceries = [];
        saveAndRender(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.key.toLowerCase() === "z") undo();
        if (event.ctrlKey && event.shiftKey && event.key === "D") deleteAllStruck();
    });

    // Clear main list (duplicate listener cleaned)
    const delmainlistbtn = document.getElementById("deletemainlist");
    document.addEventListener("click", (e) => {
        if (e.target === delmainlistbtn) {
            if (groceries.length === 0) return;

            if (!confirm("Are you sure you want to clear the main list?")) return;
            pushHistory();
            groceries = [];
            saveAndRender();
        }
    });

    // INITIAL RENDER
    saveAndRender(false);
});
