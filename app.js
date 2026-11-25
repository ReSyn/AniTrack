const API = "https://api.jikan.moe/v4";
const ANIKOTO = "https://anikoto.cz";
const STATUSES = ["Currently watching","Waiting for new release","Completed","Gave up on","On pause"];
const STATUS_CLASS = s => "status-" + s.replaceAll(" ","-");
let library = loadLibrary();
let currentFilter = "All";
let activeAnime = null;
let toastTimer;

function loadLibrary(){try{return JSON.parse(localStorage.getItem("anitrack-library")||"[]")}catch{return []}}
function saveLibrary(){localStorage.setItem("anitrack-library",JSON.stringify(library));updateStats()}
function updateStats(){
  const rated=library.filter(x=>x.rating!==null&&x.rating!==undefined);
  document.querySelector("#list-count").textContent=library.length;
  document.querySelector("#stat-total").textContent=library.length;
  document.querySelector("#stat-completed").textContent=library.filter(x=>x.status==="Completed").length;
  document.querySelector("#stat-average").textContent=rated.length?(rated.reduce((a,x)=>a+Number(x.rating),0)/rated.length).toFixed(1):"—";
  document.querySelector("#filter-all").textContent=library.length;
}
function toast(msg){const el=document.querySelector("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2200)}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function animeUrl(a){return a.url || `${ANIKOTO}/filter`}
function poster(a){return a.images?.webp?.large_image_url||a.images?.jpg?.large_image_url||""}
function year(a){return a.year||a.aired?.prop?.from?.year||"—"}
function card(a, opts={}){
  const inList=library.some(x=>x.mal_id===a.mal_id);
  return `<article class="anime-card" data-anime="${a.mal_id}">
    <div class="poster-wrap"><img loading="lazy" src="${esc(poster(a))}" alt="${esc(a.title)} poster" onerror="this.style.opacity='.15'">
    <span class="score-chip">★ ${a.score?Number(a.score).toFixed(1):"N/A"}</span><div class="poster-overlay"></div>
    ${opts.add!==false?`<button class="add-chip" data-add="${a.mal_id}" title="${inList?"Already in your list":"Add to your list"}">${inList?"✓":"＋"}</button>`:""}
    </div><h3>${esc(a.title)}</h3><div class="anime-meta">${esc(a.type||"Anime")} · ${esc(year(a))}${a.episodes?` · ${a.episodes} eps`:""}</div>
  </article>`;
}
async function api(path){
  const r=await fetch(API+path); if(!r.ok) throw new Error("Anime catalogue is temporarily unavailable"); return r.json();
}
async function loadHome(){
  try{
    const [season,popular]=await Promise.all([api("/seasons/now?limit=10"),api("/top/anime?filter=airing&limit=10")]);
    document.querySelector("#trending-grid").innerHTML=season.data.map(a=>card(a)).join("")||"No current-season anime found.";
    document.querySelector("#popular-grid").innerHTML=popular.data.map(a=>card(a)).join("");
  }catch(e){
    document.querySelector("#trending-grid").innerHTML=`<div class="loading-state">Couldn't load the live anime catalogue. Check your connection and refresh.</div>`;
    document.querySelector("#popular-grid").innerHTML=`<div class="loading-state">Popular anime will appear here when the catalogue is available.</div>`;
  }
}
function showPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));
  document.querySelectorAll("[data-page]").forEach(a=>a.classList.toggle("active",a.dataset.page===page));
  const names={home:"OVERVIEW",list:"YOUR LIST",ranking:"YOUR RANKING",discover:"DISCOVER"};
  document.querySelector("#breadcrumb").innerHTML=`${names[page]} <span>/</span> ${page.toUpperCase()}`;
  if(page==="list")renderList(); if(page==="ranking")renderRanking();
  window.scrollTo({top:0,behavior:"smooth"});
}
function renderList(){
  const rows=currentFilter==="All"?library:library.filter(x=>x.status===currentFilter);
  document.querySelector("#list-grid").innerHTML=rows.map(a=>`
    <article class="anime-card list-card" data-library="${a.mal_id}">
      <div class="poster-wrap"><img loading="lazy" src="${esc(a.image)}" alt="${esc(a.title)} poster"><span class="score-chip">${a.rating==null?"—":`★ ${Number(a.rating).toFixed(1)}`}</span></div>
      <h3>${esc(a.title)}</h3><div class="anime-meta">${esc(a.type||"Anime")} · ${esc(a.year||"—")}</div>
      <span class="status-pill ${STATUS_CLASS(a.status)}">${esc(a.status)}</span>
    </article>`).join("");
  document.querySelector("#list-empty").classList.toggle("show",library.length===0);
  document.querySelector("#list-grid").style.display=library.length?"grid":"none";
}
function renderRanking(){
  const rows=library.filter(x=>x.rating!==null&&x.rating!==undefined).sort((a,b)=>b.rating-a.rating||a.title.localeCompare(b.title));
  document.querySelector("#ranked-count").textContent=`${rows.length} rated anime`;
  document.querySelector("#ranking-list").innerHTML=rows.map((a,i)=>`<div class="rank-row" data-library="${a.mal_id}">
    <span class="rank-number">${String(i+1).padStart(2,"0")}</span><img src="${esc(a.image)}" alt="">
    <div><div class="rank-title">${esc(a.title)}</div><div class="rank-sub">${esc(a.status)} · ${esc(a.year||"")}</div></div>
    <strong class="rank-score">${Number(a.rating).toFixed(1)}<small style="font-size:9px;color:#888">/10</small></strong><button class="rank-edit" data-edit="${a.mal_id}">Edit</button></div>`).join("");
  document.querySelector("#ranking-empty").classList.toggle("show",rows.length===0);
}
function openModal(a, existing=false){
  activeAnime=a;
  const saved=library.find(x=>x.mal_id===a.mal_id);
  const initial=saved||{status:"Currently watching",rating:null,comment:""};
  document.querySelector("#modal-content").innerHTML=`
    <div class="modal-anime-head"><img src="${esc(a.image||poster(a))}" alt=""><div><div class="eyebrow">${saved?"IN YOUR LIBRARY":"ADD TO YOUR LIBRARY"}</div><h2 id="modal-title">${esc(a.title)}</h2><div class="modal-muted">${esc(a.type||"Anime")} · ${esc(a.year||"")} ${a.episodes?`· ${a.episodes} episodes`:""}<br>${a.score?`Catalogue score: ${a.score}/10`:""}</div><a class="modal-link" href="${esc(a.url||ANIKOTO)}" target="_blank" rel="noopener">Open on Anikoto ↗</a></div></div>
    <div class="modal-section"><label for="anime-status">WATCH STATUS</label><select id="anime-status">${STATUSES.map(s=>`<option ${initial.status===s?"selected":""}>${s}</option>`).join("")}</select></div>
    <div class="modal-section"><label for="anime-rating">YOUR RATING <span style="color:#777;font-weight:400;letter-spacing:0">(OPTIONAL)</span></label><div class="rating-line"><input id="anime-rating" type="range" min="1" max="10" step=".5" value="${initial.rating??8}" ${initial.rating==null?"data-unrated='true'":""}><strong class="rating-value" id="rating-value">${initial.rating==null?"Rate later":Number(initial.rating).toFixed(1)+"/10"}</strong></div><button class="secondary-button" id="rate-later" style="margin-top:9px">Rate later</button></div>
    <div class="modal-section"><label for="anime-comment">YOUR COMMENT / NOTES</label><textarea id="anime-comment" placeholder="What did you think? Add a note...">${esc(initial.comment||"")}</textarea></div>
    <div class="modal-actions">${saved?`<button class="danger-button" id="remove-anime">Remove from list</button>`:`<span></span>`}<div class="modal-actions-right"><button class="secondary-button" id="cancel-modal">Cancel</button><button class="primary-button" id="save-anime">${saved?"Save changes":"Add to list"}</button></div></div>`;
  const rating=document.querySelector("#anime-rating"), value=document.querySelector("#rating-value");
  rating.addEventListener("input",()=>{rating.dataset.unrated="false";value.textContent=Number(rating.value).toFixed(1)+"/10"});
  document.querySelector("#rate-later").onclick=()=>{rating.dataset.unrated="true";value.textContent="Rate later"};
  document.querySelector("#cancel-modal").onclick=closeModal;
  document.querySelector("#save-anime").onclick=()=>{
    const ratingValue=rating.dataset.unrated==="true"?null:Number(rating.value);
    const record={mal_id:a.mal_id,title:a.title,image:a.image||poster(a),url:a.url||`${ANIKOTO}/filter`,type:a.type||"Anime",year:a.year||"—",status:document.querySelector("#anime-status").value,rating:ratingValue,comment:document.querySelector("#anime-comment").value,updatedAt:Date.now()};
    const idx=library.findIndex(x=>x.mal_id===a.mal_id); if(idx>=0)library[idx]=record;else library.push(record);
    saveLibrary();closeModal();renderList();renderRanking();refreshCardButtons();toast(idx>=0?"Anime updated":"Added to your list");
  };
  const remove=document.querySelector("#remove-anime"); if(remove)remove.onclick=()=>{library=library.filter(x=>x.mal_id!==a.mal_id);saveLibrary();closeModal();renderList();renderRanking();refreshCardButtons();toast("Removed from your list")};
  document.querySelector("#modal-backdrop").classList.remove("hidden");
}
function closeModal(){document.querySelector("#modal-backdrop").classList.add("hidden");activeAnime=null}
function refreshCardButtons(){document.querySelectorAll("[data-add]").forEach(b=>{const exists=library.some(x=>x.mal_id===Number(b.dataset.add));b.textContent=exists?"✓":"＋";b.title=exists?"Already in your list":"Add to your list"})}
function getAnimeFromCard(id){
  const saved=library.find(x=>x.mal_id===id);
  if(saved)return {...saved,image:saved.image};
  return null;
}
async function searchAnime(q){
  const grid=document.querySelector("#discover-grid"),empty=document.querySelector("#discover-empty");
  if(!q.trim()){grid.innerHTML="";document.querySelector("#discover-caption").textContent="Popular searches to get you started";empty.classList.add("hidden");return}
  grid.innerHTML='<div class="loading-state">Searching anime catalogue...</div>';empty.classList.add("hidden");
  try{const data=await api(`/anime?q=${encodeURIComponent(q)}&limit=20&sfw=true`);const results=data.data||[];
    document.querySelector("#discover-caption").textContent=`${results.length} results for “${q}”`;
    grid.innerHTML=results.map(a=>card(a)).join("");empty.classList.toggle("hidden",results.length>0);
  }catch(e){grid.innerHTML='<div class="loading-state">Search is temporarily unavailable. Please try again.</div>'}
}
function animeFromApi(id, source){
  const a=source;
  return {mal_id:a.mal_id,title:a.title,image:poster(a),url:`${ANIKOTO}/filter`,type:a.type,year:year(a),score:a.score,episodes:a.episodes};
}
document.addEventListener("click",async e=>{
  const page=e.target.closest("[data-page]");if(page){e.preventDefault();location.hash=page.dataset.page;return}
  const add=e.target.closest("[data-add]");if(add){e.stopPropagation();const id=Number(add.dataset.add);if(library.some(x=>x.mal_id===id)){toast("Already in your list");return}
    const cardEl=add.closest(".anime-card");const img=cardEl.querySelector("img");const title=cardEl.querySelector("h3").textContent;const score=cardEl.querySelector(".score-chip").textContent.replace("★","").trim();
    const meta=cardEl.querySelector(".anime-meta").textContent.split(" · ");
    openModal({mal_id:id,title,image:img.src,url:`${ANIKOTO}/filter`,type:meta[0],year:meta[1],score:score==="N/A"?null:Number(score)});return}
  const lib=e.target.closest("[data-library]");if(lib){const a=library.find(x=>x.mal_id===Number(lib.dataset.library));if(a)openModal({...a,image:a.image},true);return}
  const anime=e.target.closest(".anime-card[data-anime]");if(anime){const id=Number(anime.dataset.anime);const saved=getAnimeFromCard(id);if(saved){openModal(saved,true);return}
    const title=anime.querySelector("h3").textContent, img=anime.querySelector("img").src, score=anime.querySelector(".score-chip").textContent.replace("★","").trim(), meta=anime.querySelector(".anime-meta").textContent.split(" · ");
    openModal({mal_id:id,title,image:img,url:`${ANIKOTO}/filter`,type:meta[0],year:meta[1],score:score==="N/A"?null:Number(score)});return}
  const edit=e.target.closest("[data-edit]");if(edit){const a=library.find(x=>x.mal_id===Number(edit.dataset.edit));if(a)openModal({...a,image:a.image},true)}
});
document.querySelectorAll("[data-page]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();location.hash=a.dataset.page}));
window.addEventListener("hashchange",()=>showPage(location.hash.slice(1)||"home"));
document.querySelector("#modal-close").onclick=closeModal;
document.querySelector("#modal-backdrop").addEventListener("click",e=>{if(e.target.id==="modal-backdrop")closeModal()});
document.querySelector("#status-filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;currentFilter=b.dataset.filter;document.querySelectorAll(".filter-tab").forEach(x=>x.classList.toggle("active",x===b));renderList()});
document.querySelector("#add-from-list").onclick=()=>{location.hash="discover";setTimeout(()=>document.querySelector("#anime-search").focus(),50)};
document.querySelector("#empty-add").onclick=()=>{location.hash="discover";setTimeout(()=>document.querySelector("#anime-search").focus(),50)};
let searchTimer;document.querySelector("#anime-search").addEventListener("input",e=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>searchAnime(e.target.value),450)});
document.querySelector("#anime-search").addEventListener("keydown",e=>{if(e.key==="Enter")searchAnime(e.target.value)});
document.querySelector("#quick-search").onclick=()=>{location.hash="discover";setTimeout(()=>document.querySelector("#anime-search").focus(),80)};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
updateStats();showPage(location.hash.slice(1)||"home");loadHome();
