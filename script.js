// DOM references
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskTime = document.getElementById("taskTime");
const taskReminder = document.getElementById("taskReminder");
const submitTaskButton = document.getElementById("submitTaskButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const taskList = document.getElementById("taskList");
const clearAllButton = document.getElementById("clearAllButton");
const totalTasksCounter = document.getElementById("totalTasks");
const completedTasksCounter = document.getElementById("completedTasks");
const remainingTasksCounter = document.getElementById("remainingTasks");

const STORAGE_KEY = "modernTodoTasks";

// Single source of truth for the app state
let tasks = [];
let editingTaskIndex = null;

// Persist the current task array.
function saveTasksToStorage() {
  if (tasks.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Read and validate the current form values.
function getTaskFormValues() {
  const text = taskInput.value.trim();

  if (!text) {
    taskInput.focus();
    return null;
  }

  return {
    text,
    date: taskDate.value,
    time: taskTime.value,
    reminder: taskReminder.checked
  };
}

// Reset the form after adding, updating, or canceling.
function resetTaskForm() {
  taskInput.value = "";
  taskDate.value = "";
  taskTime.value = "";
  taskReminder.checked = false;
  editingTaskIndex = null;
  submitTaskButton.textContent = "Add";
  cancelEditButton.hidden = true;
  taskInput.focus();
}

// Add a valid task, then reset the input field.
function addTask() {
  const taskValues = getTaskFormValues();

  if (!taskValues) {
    return;
  }

  tasks.push({
    text: taskValues.text,
    completed: false,
    date: taskValues.date,
    time: taskValues.time,
    reminder: taskValues.reminder
  });

  saveTasksToStorage();
  renderTasks();
  resetTaskForm();
}

// Load an existing task into the form for editing.
function editTask(index) {
  const task = tasks[index];

  taskInput.value = task.text;
  taskDate.value = task.date;
  taskTime.value = task.time;
  taskReminder.checked = task.reminder;
  editingTaskIndex = index;
  submitTaskButton.textContent = "Update";
  cancelEditButton.hidden = false;
  taskInput.focus();
}

// Save edited form values back to the selected task.
function updateTask(index) {
  const taskValues = getTaskFormValues();

  if (!taskValues) {
    return;
  }

  tasks[index] = {
    ...tasks[index],
    text: taskValues.text,
    date: taskValues.date,
    time: taskValues.time,
    reminder: taskValues.reminder
  };

  saveTasksToStorage();
  renderTasks();
  resetTaskForm();
}

// Remove one task by index.
function deleteTask(index) {
  tasks.splice(index, 1);

  if (editingTaskIndex === index) {
    resetTaskForm();
  } else if (editingTaskIndex !== null && index < editingTaskIndex) {
    editingTaskIndex -= 1;
  }

  saveTasksToStorage();
  renderTasks();
}

// Flip a task between complete and incomplete.
function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasksToStorage();
  renderTasks();
}

// Clear the UI, the array, and localStorage.
function clearAllTasks() {
  tasks = [];
  resetTaskForm();
  saveTasksToStorage();
  renderTasks();
}

// Keep the task counters in sync with the array.
function updateTaskCounters() {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const remainingTasks = totalTasks - completedTasks;

  totalTasksCounter.textContent = totalTasks;
  completedTasksCounter.textContent = completedTasks;
  remainingTasksCounter.textContent = remainingTasks;
}

// Format date and time values into friendly labels.
function getScheduleLabel(task) {
  const hasDate = Boolean(task.date);
  const hasTime = Boolean(task.time);

  if (!hasDate && !hasTime) {
    return "";
  }

  const dateLabel = hasDate
    ? new Date(`${task.date}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "";

  const timeLabel = hasTime
    ? new Date(`2000-01-01T${task.time}`).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit"
      })
    : "";

  return [dateLabel, timeLabel].filter(Boolean).join(" at ");
}

// Render all task items from the single source of truth.
function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const taskItem = document.createElement("li");
    taskItem.className = `task-item${task.completed ? " completed" : ""}`;
    taskItem.dataset.index = index;

    const completeButton = document.createElement("button");
    completeButton.className = "complete-button";
    completeButton.type = "button";
    completeButton.dataset.action = "toggle";
    completeButton.setAttribute("aria-label", task.completed ? "Mark task incomplete" : "Mark task complete");
    completeButton.textContent = "\u2713";

    const taskText = document.createElement("span");
    taskText.className = "task-text";
    taskText.dataset.action = "toggle";
    taskText.textContent = task.text;

    const taskContent = document.createElement("div");
    taskContent.className = "task-content";
    taskContent.append(taskText);

    const scheduleLabel = getScheduleLabel(task);
    const hasReminder = Boolean(task.reminder);

    if (scheduleLabel || hasReminder) {
      const taskMeta = document.createElement("div");
      taskMeta.className = "task-meta";

      if (scheduleLabel) {
        const schedulePill = document.createElement("span");
        schedulePill.className = "meta-pill";
        schedulePill.textContent = scheduleLabel;
        taskMeta.append(schedulePill);
      }

      if (hasReminder) {
        const reminderPill = document.createElement("span");
        reminderPill.className = "meta-pill reminder-pill";
        reminderPill.textContent = "Reminder On";
        taskMeta.append(reminderPill);
      }

      taskContent.append(taskMeta);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${task.text}`);

    const editButton = document.createElement("button");
    editButton.className = "edit-button";
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit ${task.text}`);

    const taskActions = document.createElement("div");
    taskActions.className = "task-actions";
    taskActions.append(editButton, deleteButton);

    taskItem.append(completeButton, taskContent, taskActions);
    taskList.append(taskItem);
  });

  updateTaskCounters();
}

// Load saved data defensively in case localStorage contains invalid JSON.
function loadTasksFromStorage() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    tasks = [];
    return;
  }

  try {
    const parsedTasks = JSON.parse(savedTasks);
    tasks = Array.isArray(parsedTasks)
      ? parsedTasks.map((task) => ({
          text: task.text || "",
          completed: Boolean(task.completed),
          date: task.date || "",
          time: task.time || "",
          reminder: Boolean(task.reminder)
        }))
      : [];
  } catch {
    tasks = [];
  }
}

// Event listeners
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (editingTaskIndex !== null) {
    updateTask(editingTaskIndex);
    return;
  }

  addTask();
});

cancelEditButton.addEventListener("click", resetTaskForm);

clearAllButton.addEventListener("click", clearAllTasks);

taskList.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  const taskItem = event.target.closest(".task-item");

  if (!actionTarget || !taskItem) {
    return;
  }

  const taskIndex = Number(taskItem.dataset.index);

  if (actionTarget.dataset.action === "toggle") {
    toggleTask(taskIndex);
  }

  if (actionTarget.dataset.action === "edit") {
    editTask(taskIndex);
  }

  if (actionTarget.dataset.action === "delete") {
    deleteTask(taskIndex);
  }
});

loadTasksFromStorage();
renderTasks();
