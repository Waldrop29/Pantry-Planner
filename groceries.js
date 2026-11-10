// *initialize app*
window.addEventListener("DOMContentLoaded", () => {

  // *history limit*
  const HISTORY_LIMIT = 200;

  // *load popup settings*
  const STORAGE_KEY = "popupSettings";
  const popupSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

  // *show welcome message if needed*
  if (!popupSettings.hide) showWelcomeMessage(false);

  // *keyboard shortcut for popup*
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === "m") {
      showWelcomeMessage(true);
    }
  });

  // *popup function*
  function showWelcomeMessage(force = false) {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (!force && settings.hide) return;

    const modal = document.getElementById("welcome-modal");
    const okBtn = document.getElementById("modal-ok-btn");
    const cancelBtn = document.getElementById("modal-cancel-btn");

    // Guard statement in case HTML modal boilerplate is missing
    if (!modal || !okBtn || !cancelBtn) return;

    // Show custom UI overlay
    modal.classList.remove("hidden");

    // Click 'Keep Showing' (Re-appears on next browser refresh)
    okBtn.onclick = function() {
      settings.hide = false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      modal.classList.add("hidden");
    };

    // Click 'Don't Show Again' (Hidden permanently until Ctrl+M forced)
    cancelBtn.onclick = function() {
      settings.hide = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      modal.classList.add("hidden");
    };
  }

  // *unit list*
  const UNIT_LIST = [
    "packets", "cartons", "lbs", "oz", "doz", "cups",
    "tbsp", "tsp", "gallons", "liters",
    "bags", "bottles", "jars", "cans", "boxes", "Miscellaneous",
    "Pieces", "Spoons", "Slices", "Cloves", "Heads", "Strips", "Sprigs", "Bulbs", "Bunches", "Feet", "Inches", "Yards", "Meters", "Centimeters", "Other", ""
  ];

  // *load saved lists*
  let groceries = JSON.parse(localStorage.getItem("groceries") || "[]")
    .map(item => {
      if (typeof item === "string") {
        return { text: item, qtyNumber: 1, qtyUnit: "packets" };
      }
      if (item.qtyNumber === undefined) item.qtyNumber = 1;
      if (item.qtyUnit === undefined) item.qtyUnit = "";
      return item;
    });

  let struckGroceries = JSON.parse(localStorage.getItem("struckGroceries") || "[]")
    .map(item => {
      if (item.qtyNumber === undefined) item.qtyNumber = 1;
      if (item.qtyUnit === undefined) item.qtyUnit = "packets";
      return item;
    });

  // *history stacks*
  let groceriesHistory = [];
  let struckHistory = [];

  // *DOM references*
  const list = document.getElementById("groceries");
  const struckList = document.getElementById("struckList");
  const input = document.getElementById("itemInput");
  const addBtn = document.getElementById("button");
  const undoBtn = document.getElementById("undo-btn");
  const delAllBtn = document.getElementById("del-all-btn");
  const delMainBtn = document.getElementById("deletemainlist");
  const darkModeBtn = document.getElementById("darkModeToggle");

  // *push history*
  function pushHistory() {
    groceriesHistory.push(JSON.stringify(groceries));
    struckHistory.push(JSON.stringify(struckGroceries));

    if (groceriesHistory.length > HISTORY_LIMIT) groceriesHistory.shift();
    if (struckHistory.length > HISTORY_LIMIT) struckHistory.shift();
  }

  // *undo*
  function undo() {
    if (!groceriesHistory.length && !struckHistory.length) return;
    if (groceriesHistory.length) groceries = JSON.parse(groceriesHistory.pop());
    if (struckHistory.length) struckGroceries = JSON.parse(struckHistory.pop());
    console.log("undone");
    saveAndRender(false);
  }

  // *save + render*
  function saveAndRender(push = true) {
    if (push) pushHistory();

    localStorage.setItem("groceries", JSON.stringify(groceries));
    localStorage.setItem("struckGroceries", JSON.stringify(struckGroceries));

    renderList();
    renderStruckList();
  }

  // *add item*
  function addItem() {
    const val = input.value.trim();
    if (!val) return;
    pushHistory();
    groceries.push({
      text: val,
      qtyNumber: 1,
      qtyUnit: "packets"
    });

    input.value = "";
    saveAndRender(false);
    input.focus();
    console.log("added " + val);
  }
  // *render main list*
  function renderList() {
    list.innerHTML = "";

    groceries.forEach((item, idx) => {
      if (item.qtyNumber === undefined) item.qtyNumber = 1;
      if (item.qtyUnit === undefined) item.qtyUnit = "packets";

      const li = document.createElement("li");
      li.classList.add("fade-in");

      const textSpan = document.createElement("span");
      textSpan.textContent = item.text;
      textSpan.className = "item-text";

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

      const qtyNumber = document.createElement("select");
      qtyNumber.className = "qty-select";

      for (let i = 1; i <= 20; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        if (item.qtyNumber === i) opt.selected = true;
        qtyNumber.appendChild(opt);
      }

      qtyNumber.addEventListener("change", () => {
        pushHistory();
        groceries[idx].qtyNumber = parseInt(qtyNumber.value);
        saveAndRender(false);
      });

      const qtyUnit = document.createElement("select");
      qtyUnit.className = "qty-select";

      UNIT_LIST.forEach(unit => {
        const opt = document.createElement("option");
        opt.value = unit;
        opt.textContent = unit;
        if (item.qtyUnit === unit) opt.selected = true;
        qtyUnit.appendChild(opt);
      });

      qtyUnit.addEventListener("change", () => {
        pushHistory();
        groceries[idx].qtyUnit = qtyUnit.value;
        saveAndRender(false);
      });

      const qtyControls = document.createElement("div");
      qtyControls.className = "qty-controls";
      qtyControls.appendChild(qtyNumber);
      qtyControls.appendChild(qtyUnit);

      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";

      // Fixed Namespace URI to comply with official W3C XML graphics standards
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.classList.add("edit-icon");

      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z");
      path.setAttribute("fill", "currentColor");

      svg.appendChild(path);
      editBtn.appendChild(svg);

      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        const inputEdit = document.createElement("input");
        inputEdit.type = "text";
        inputEdit.value = item.text;
        inputEdit.className = "edit-input";

        const oldVal = item.text;

        itemRow.replaceChild(inputEdit, textSpan);
        inputEdit.focus();

        let isSaving = false;

        function saveEdit() {
          if (isSaving) return;
          isSaving = true;
          const newVal = inputEdit.value.trim();
          if (!newVal) {
            alert("Item text cannot be empty");
            cancelEdit();
            return;
          }
          pushHistory();
          groceries[idx].text = newVal;
          console.log("edited " + oldVal + " to " + newVal);
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
          saveEdit();
        });
      });

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.className = "delete-btn";

      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!confirm("Delete this item?")) return;

        pushHistory();
        groceries.splice(idx, 1);
        saveAndRender(false);
        console.log("deleted " + item.text);
      });

      const itemRow = document.createElement("div");
      itemRow.className = "item-row";
      itemRow.appendChild(textSpan);
      itemRow.appendChild(qtyControls);

      const itemActions = document.createElement("div");
      itemActions.className = "item-actions";
      itemActions.appendChild(editBtn);
      itemActions.appendChild(delBtn);

      li.appendChild(itemRow);
      li.appendChild(itemActions);
      list.appendChild(li);
    });

    input.placeholder = groceries.length === 0 ? "Nothing yet! Add something tasty!" : "Add a grocery item";
  }

  function renderStruckList() {
    struckList.innerHTML = "";

    struckGroceries.forEach((item, idx) => {
      const li = document.createElement("li");
      li.textContent = `${item.qtyNumber} ${item.qtyUnit} ${item.text}`;

      li.addEventListener("click", () => {
        pushHistory();
        groceries.push(item);
        struckGroceries.splice(idx, 1);
        saveAndRender(false);
      });

      struckList.appendChild(li);
    });
  }

  // *delete all struck*
  function deleteAllStruck() {
    if (!struckGroceries.length) return;
    if (!confirm("Delete all acquired items?")) return;
    pushHistory();
    struckGroceries = [];
    saveAndRender(false);
    console.log("struck cleared");
  }

  // *dark mode*
  function setDarkMode(on) {
    document.body.classList.toggle("dark-mode", on);
    localStorage.setItem("darkMode", on ? "1" : "0");
    darkModeBtn.textContent = on ? "Light Mode" : "Dark Mode";
  }

  setDarkMode(localStorage.getItem("darkMode") === "1");

  // *event listeners*
  addBtn.addEventListener("click", addItem);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addItem();
  });

  undoBtn.addEventListener("click", undo);

  delAllBtn.addEventListener("click", deleteAllStruck);

  function clearMainList() {
    if (!groceries.length) return;
    if (!confirm("Delete all items in main list?")) return;
    pushHistory();
    groceries = [];
    saveAndRender(false);
  }

  delMainBtn.addEventListener("click", clearMainList);

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") clearMainList();
  });

  darkModeBtn.addEventListener("click", () =>
    setDarkMode(!document.body.classList.contains("dark-mode"))
  );

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
      clearMainList();
    }
  })

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === "z") undo();
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") deleteAllStruck();
  });

  // *initial render*
  saveAndRender(false);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.error("Service Worker registration failed:", error);
  });
}