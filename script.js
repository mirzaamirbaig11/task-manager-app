/* ============================================================
   script.js — Taskr Task Manager
   Features:
     • Add / Delete / Complete tasks
     • Filter: All | Active | Done
     • Persist tasks in localStorage
     • Live task counter in header
   ============================================================ */

/* ---------- 1. GRAB DOM ELEMENTS ---------- */
const taskInput    = document.getElementById('taskInput');    // text input
const addBtn       = document.getElementById('addBtn');       // "Add" button
const taskList     = document.getElementById('taskList');     // <ul> list
const emptyState   = document.getElementById('emptyState');   // empty placeholder
const listFooter   = document.getElementById('listFooter');   // footer row
const clearDoneBtn = document.getElementById('clearDoneBtn'); // "Clear completed"
const leftCount    = document.getElementById('leftCount');    // "X items left"
const taskCount    = document.getElementById('taskCount');    // header badge
const filterBtns   = document.querySelectorAll('.filter-btn');// all filter tabs

/* ---------- 2. APP STATE ---------- */

// Tasks live in an array of objects: { id, text, done }
let tasks = [];

// Which filter is active: 'all' | 'active' | 'done'
let currentFilter = 'all';

/* ---------- 3. LOCALSTORAGE HELPERS ---------- */

/**
 * Load tasks from localStorage into the tasks array.
 * Falls back to an empty array if nothing is stored.
 */
function loadTasks() {
  const stored = localStorage.getItem('taskr_tasks');
  tasks = stored ? JSON.parse(stored) : [];
}

/**
 * Save the current tasks array to localStorage.
 * Called every time tasks change.
 */
function saveTasks() {
  localStorage.setItem('taskr_tasks', JSON.stringify(tasks));
}

/* ---------- 4. RENDER ---------- */

/**
 * Re-render the visible task list based on the active filter.
 * Also updates the counter badge, footer, and empty state.
 */
function render() {
  // Filter tasks to show
  const visible = tasks.filter(t => {
    if (currentFilter === 'active') return !t.done;
    if (currentFilter === 'done')   return  t.done;
    return true; // 'all'
  });

  // Clear existing list items
  taskList.innerHTML = '';

  // Show / hide empty state and footer
  const isEmpty = tasks.length === 0;
  emptyState.hidden  = !isEmpty || visible.length > 0;
  listFooter.hidden  = isEmpty;

  // If there are tasks but none match the filter, show empty state
  if (!isEmpty && visible.length === 0) {
    emptyState.hidden = false;
  }

  // Build a list item for each visible task
  visible.forEach(task => {
    const li = createTaskElement(task);
    taskList.appendChild(li);
  });

  // Update footer counts
  const activeCount = tasks.filter(t => !t.done).length;
  leftCount.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;

  // Update header badge
  taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
}

/**
 * Build and return a <li> DOM element for a single task.
 * @param {Object} task - { id, text, done }
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item${task.done ? ' done' : ''}`;
  li.dataset.id = task.id; // store id for event delegation

  // --- Checkbox (toggle done) ---
  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked   = task.done;
  checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`);

  // Listen for toggle
  checkbox.addEventListener('change', () => toggleTask(task.id));

  // --- Task text ---
  const span = document.createElement('span');
  span.className   = 'task-text';
  span.textContent = task.text;

  // --- Delete button ---
  const delBtn = document.createElement('button');
  delBtn.className  = 'btn-delete';
  delBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
  delBtn.innerHTML  = `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 4.5h12M7.5 8v5M10.5 8v5M4.5 4.5l.75 9h7.5l.75-9"
            stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M7 4.5V3h4v1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;

  // Listen for delete
  delBtn.addEventListener('click', () => deleteTask(task.id, li));

  // Assemble
  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(delBtn);

  return li;
}

/* ---------- 5. TASK OPERATIONS ---------- */

/**
 * Add a new task.
 * Reads the input field, validates, pushes to array, saves, re-renders.
 */
function addTask() {
  const text = taskInput.value.trim();

  // Guard: don't add empty tasks
  if (!text) {
    taskInput.focus();
    taskInput.classList.add('shake'); // optional shake CSS class
    setTimeout(() => taskInput.classList.remove('shake'), 400);
    return;
  }

  // Create task object
  const newTask = {
    id:   Date.now(),   // unique id based on timestamp
    text: text,
    done: false,
  };

  tasks.push(newTask);
  saveTasks();
  render();

  // Clear input and focus for quick successive entries
  taskInput.value = '';
  taskInput.focus();
}

/**
 * Toggle the done state of a task.
 * @param {number} id - task id
 */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasks();
    render();
  }
}

/**
 * Animate out and remove a task.
 * @param {number} id   - task id
 * @param {HTMLLIElement} li - the list element to animate
 */
function deleteTask(id, li) {
  // CSS transition class for fade-out
  li.classList.add('removing');

  // Wait for the CSS transition to finish, then remove from state
  li.addEventListener('transitionend', () => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
  }, { once: true }); // listener fires only once
}

/**
 * Remove all completed tasks at once.
 */
function clearCompleted() {
  tasks = tasks.filter(t => !t.done);
  saveTasks();
  render();
}

/* ---------- 6. FILTER LOGIC ---------- */

/**
 * Switch the active filter and re-render.
 * @param {string} filter - 'all' | 'active' | 'done'
 */
function setFilter(filter) {
  currentFilter = filter;

  // Update active tab styling
  filterBtns.forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  render();
}

/* ---------- 7. EVENT LISTENERS ---------- */

// Add task on button click
addBtn.addEventListener('click', addTask);

// Add task on Enter key inside input
taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

// Filter tabs
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// Clear completed
clearDoneBtn.addEventListener('click', clearCompleted);

/* ---------- 8. INITIALISE ---------- */

// Load data from localStorage, then draw the list
loadTasks();
render();
