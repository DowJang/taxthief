"use strict";
const dialog = document.getElementById("feedback-dialog");
const form = document.getElementById("feedback-form");
const body = form.elements.body;
const submit = form.querySelector("[type=submit]");
const status = form.querySelector(".feedback-status");
const close = form.querySelector(".feedback-close");
let sending = false;
function updateFeedback() {
  const count = Array.from(body.value).length;
  form.querySelector(".feedback-count").textContent = `${count} / 2000`;
  submit.disabled = sending || !body.value.trim() || count > 2000;
}
document.querySelector(".feedback-open").addEventListener("click", () => {
  dialog.showModal();
  body.focus();
});
close.addEventListener("click", () => { if (!sending) dialog.close(); });
dialog.addEventListener("cancel", event => { if (sending) event.preventDefault(); });
body.addEventListener("input", updateFeedback);
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (submit.disabled || sending) return;
  sending = true;
  body.readOnly = true;
  close.disabled = true;
  updateFeedback();
  status.textContent = "보내는 중…";
  try {
    const response = await fetch("https://taxthief-api.dio0104.workers.dev/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.value, website: form.elements.website.value }),
      signal: AbortSignal.timeout(30000)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "보내지 못했습니다. 잠시 후 다시 시도해주세요.");
    form.reset();
    status.textContent = "보냈습니다. 고맙습니다.";
  } catch (error) {
    status.textContent = error.name === "TimeoutError" || error instanceof TypeError
      ? "전송 결과를 확인하지 못했습니다. 작성한 글은 남겨 두었습니다."
      : error.message;
  } finally {
    sending = false;
    body.readOnly = false;
    close.disabled = false;
    updateFeedback();
  }
});
