function openAdminConfirmation(form) {
  const dialog = document.createElement("dialog");
  dialog.className = "admin-confirmation";

  const dialogForm = document.createElement("form");
  const heading = document.createElement("h2");
  heading.textContent = "Confirm deletion";

  const message = document.createElement("p");
  message.textContent = form.dataset.confirmMessage;

  const label = document.createElement("label");
  label.textContent = "Admin password";

  const password = document.createElement("input");
  password.type = "password";
  password.name = "admin_password_confirmation";
  password.autocomplete = "new-password";
  password.required = true;
  label.append(password);

  const actions = document.createElement("div");
  actions.className = "form-actions";

  const cancel = document.createElement("button");
  cancel.className = "button button-secondary";
  cancel.type = "button";
  cancel.textContent = "Cancel";

  const confirm = document.createElement("button");
  confirm.className = "button button-danger";
  confirm.type = "submit";
  confirm.textContent = "Delete";

  actions.append(cancel, confirm);
  dialogForm.append(heading, message, label, actions);
  dialog.append(dialogForm);
  document.body.append(dialog);

  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  cancel.addEventListener("click", () => dialog.close());
  dialogForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const passwordField = form.elements.namedItem("admin_password");
    passwordField.value = password.value;
    dialog.close();
    form.submit();
  });

  dialog.showModal();
  password.focus();
}

document.addEventListener("submit", (event) => {
  const form = event.target;

  if (!(form instanceof HTMLFormElement) || !form.hasAttribute("data-admin-delete")) {
    return;
  }

  event.preventDefault();
  openAdminConfirmation(form);
});