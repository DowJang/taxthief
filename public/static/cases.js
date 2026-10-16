"use strict";
const api = "https://taxthief-api.dio0104.workers.dev";
// 옛 주소 cases.html#SFF-2026-A010 → 새 상세 페이지 cases/SFF-2026-A010.html.
// 목록에 실제로 있는 사례만 이동한다. JS가 없으면 목록의 해당 항목으로 스크롤된다.
function followOldCaseLink() {
  const match = location.hash.match(/^#(SFF-\d{4}-A\d{3})$/);
  const item = match && document.getElementById(match[1]);
  if (item && item.closest(".case-index") && /^cases\/SFF-\d{4}-A\d{3}\.html$/.test(item.dataset.detail || "")) {
    location.replace(item.dataset.detail);
  }
}
async function request(path, options = {}) {
  const response = await fetch(api + path, { ...options, headers: { "Content-Type": "application/json" } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.");
  return result;
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
  loadComments(section);
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
addEventListener("hashchange", followOldCaseLink);
followOldCaseLink();
