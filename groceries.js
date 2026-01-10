// Consolidated grocery list app script
// Features: two lists (groceries, struckGroceries), inline edit, delete (only on main list),
// move-to-struck by clicking item text (with animation), undo history, dark mode, localStorage.

window.addEventListener('DOMContentLoaded', () => {
    const HISTORY_LIMIT = 200;

    // Load from localStorage
    let groceries = JSON.parse(localStorage.getItem('groceries') || '[]');
    groceries = groceries.map(item => (typeof item === 'string' ? { text: item } : item));
    let struckGroceries = JSON.parse(localStorage.getItem('struckGroceries') || '[]');

    // Undo history stacks (store JSON snapshots)
    let groceriesHistory = [];
    let struckGroceriesHistory = [];

    // Element refs
    const list = document.getElementById('groceries');
    const struckList = document.getElementById('struckList');
    const input = document.getElementById('itemInput');
    const button = document.getElementById('button');
    const delAllBtn = document.getElementById('del-all-btn');
    const undoBtn = document.getElementById('undo-btn');
    const darkModeBtn = document.getElementById('darkModeToggle');

    function pushHistory() {
        groceriesHistory.push(JSON.stringify(groceries));
        struckGroceriesHistory.push(JSON.stringify(struckGroceries));
        if (groceriesHistory.length > HISTORY_LIMIT) groceriesHistory.shift();
        if (struckGroceriesHistory.length > HISTORY_LIMIT) struckGroceriesHistory.shift();
    }

    function undo() {
        if (groceriesHistory.length === 0 && struckGroceriesHistory.length === 0) return;
        // Pop latest snapshots if available
        if (groceriesHistory.length) groceries = JSON.parse(groceriesHistory.pop());
        if (struckGroceriesHistory.length) struckGroceries = JSON.parse(struckGroceriesHistory.pop());
        saveAndRender(false);
    }

    function saveAndRender(push = false) {
        if (push) pushHistory();
        localStorage.setItem('groceries', JSON.stringify(groceries));
        localStorage.setItem('struckGroceries', JSON.stringify(struckGroceries));
        renderList();
        renderStruckList();
    }

    function addItem() {
        const val = input.value.trim();
        if (!val) return;
        pushHistory();
        groceries.push({ text: val });
        input.value = '';
        saveAndRender();
        input.focus();
    }

    function renderList() {
        if (!list) return;
        list.innerHTML = '';
        groceries.forEach((item, idx) => {
            const li = document.createElement('li');

            const textSpan = document.createElement('span');
            textSpan.textContent = item.text;
            textSpan.className = 'item-text';

            // Click text -> move to struck list (with animation)
            textSpan.addEventListener('click', () => {
                pushHistory();
                struckGroceries.push(item);
                groceries.splice(idx, 1);
                saveAndRender();
                // add animation to the newly added struck item after render
                setTimeout(() => {
                    if (struckList && struckList.lastChild) struckList.lastChild.classList.add('struck-animate');
                }, 50);
            });

            // Edit button (inline edit) - use an image icon inside the button
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'edit-btn';
            // Inline SVG icon (replaces external PNG) - uses currentColor for easy theming
            editBtn.setAttribute('aria-label', 'Edit item');
            editBtn.title = 'Edit item';
            const svgNS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('class', 'edit-icon');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');
            const path = document.createElementNS(svgNS, 'path');
            // pencil/edit icon path (Material-like)
            path.setAttribute('d', 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z');
            path.setAttribute('fill', 'currentColor');
            svg.appendChild(path);
            editBtn.appendChild(svg);
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const inputEdit = document.createElement('input');
                inputEdit.type = 'text';
                inputEdit.value = item.text;
                inputEdit.className = 'edit-input';
                li.replaceChild(inputEdit, textSpan);
                inputEdit.focus();

                function saveEdit() {
                    const newVal = inputEdit.value.trim();
                    if (!newVal) {
                        alert('Item text cannot be empty');
                        inputEdit.focus();
                        return;
                    }
                    pushHistory();
                    groceries[idx].text = newVal;
                    saveAndRender();
                }

                function cancelEdit() {
                    renderList();
                }

                inputEdit.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter') saveEdit();
                    if (ev.key === 'Escape') cancelEdit();
                });
            });

            // Delete button (only on groceries list)
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.className = 'delete-btn';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!confirm('Are you sure you want to delete this item?')) return;
                pushHistory();
                groceries.splice(idx, 1);
                saveAndRender();
            });

            li.appendChild(textSpan);
            li.appendChild(editBtn);
            li.appendChild(delBtn);
            list.appendChild(li);
        });

        // placeholder text handling
        const itemInput = document.getElementById('itemInput');
        if (itemInput) itemInput.placeholder = groceries.length === 0 ? 'Nothing yet! Add something tasty!' : 'Add a grocery item';
    }

    function renderStruckList() {
        if (!struckList) return;
        struckList.innerHTML = '';
        struckGroceries.forEach((item, idx) => {
            const li = document.createElement('li');
            li.textContent = item.text;
            li.className = 'struck';
            // allow clicking a struck item to move it back to main list
            li.addEventListener('click', () => {
                pushHistory();
                groceries.push(item);
                struckGroceries.splice(idx, 1);
                saveAndRender();
            });
            struckList.appendChild(li);
        });
    }

    // Delete all struck items
    function delAll() {
        if (!struckGroceries || struckGroceries.length === 0) return;
        if (!confirm('Are you sure you want to delete all acquired items?')) return;
        pushHistory();
        struckGroceries = [];
        saveAndRender();
    }

    // Wiring events
    if (delAllBtn) delAllBtn.addEventListener('click', delAll);
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'D') delAll();
    });

    if (button) button.addEventListener('click', addItem);
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addItem(); });

    if (undoBtn) undoBtn.addEventListener('click', undo);

    // Dark mode toggle
    function setDarkMode(on) {
        document.body.classList.toggle('dark-mode', on);
        localStorage.setItem('darkMode', on ? '1' : '0');
        if (darkModeBtn) darkModeBtn.textContent = on ? 'Light Mode' : 'Dark Mode';
    }
    setDarkMode(localStorage.getItem('darkMode') === '1');
    if (darkModeBtn) darkModeBtn.addEventListener('click', () => setDarkMode(!document.body.classList.contains('dark-mode')));

    // Initial render
    saveAndRender(false);
});