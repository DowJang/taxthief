"use strict";
const api = "https://taxthief-api.dio0104.workers.dev";
async function request(path, options = {}) {
  const response = await fetch(api + path, { ...options, headers: { "Content-Type": "application/json" } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.");
  return result;
}
function selectedCases() {
  const id = location.hash.slice(1);
  const target = document.getElementById(id);
  const valid = target && target.classList.contains("case-card");
  document.querySelectorAll(".detail-list .case-card").forEach(card => { card.hidden = Boolean(valid && card !== target); });
  document.querySelectorAll(".comments").forEach(section => { if (!section.closest("[hidden]")) loadComments(section); });
}
async function loadComments(section) {
  const list = section.querySelector(".comment-list");
  try {
    const result = await request(`/cases/${section.dataset.case}/comments`);
    list.replaceChildren();
    for (const item of result.comments) {
      const li = document.createElement("li");
      const date = document.createElement("small");
      date.textContent = "익명 · " + new Date(item.created_at).toLocaleString("ko-KR");
      const body = document.createElement("p");
      body.textContent = item.body;
      li.append(date, body);
      list.append(li);
    }
    if (!result.comments.length) list.textContent = "첫 의견을 남겨주세요.";
  } catch (error) { list.textContent = "댓글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."; }
}
for (const section of document.querySelectorAll(".comments")) {
  section.querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector("button"), status = form.querySelector(".comment-status");
    button.disabled = true;
    try {
      await request(`/cases/${section.dataset.case}/comments`, { method: "POST", body: JSON.stringify({ body: form.elements.body.value, website: form.elements.website.value }) });
      form.reset();
      status.textContent = "익명 댓글을 등록했습니다.";
      await loadComments(section);
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
}
for (const button of document.querySelectorAll(".press-button")) {
  button.addEventListener("click", async () => {
    const status = button.parentElement.querySelector(".press-status");
    button.disabled = true;
    status.textContent = "전송 상태를 확인하고 있습니다…";
    try {
      const result = await request(`/cases/${button.dataset.case}/press`, { method: "POST", body: "{}" });
      status.textContent = result.sent === 10 ? "10개 주요 언론사에 해당 사항을 메일로 보냈습니다" : result.message;
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
}
addEventListener("hashchange", selectedCases);
selectedCases();
