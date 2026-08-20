const $ = (s) => document.querySelector(s);
let data = [];
let filtered = [];
let selectedKey = null;

const normalize = (value = "") => String(value)
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const keyFor = r => [r.marcaEquipo,r.linea,r.motor,r.capacidad].join("|");
const displayTitle = r => [r.marcaEquipo, r.linea].filter(Boolean).join(" · ") || r.motor || "Motor";

async function init(){
  try{
    const res = await fetch("data.json");
    data = await res.json();
    data.sort((a,b)=>displayTitle(a).localeCompare(displayTitle(b),"es"));
    filtered = data;
    populateCapacities();
  }catch(e){
    $("#results").innerHTML = `<div class="no-results">No fue posible cargar la tabla. Revisa que <strong>data.json</strong> esté en la misma carpeta.</div>`;
  }
}

function populateCapacities(){
  const values = [...new Set(data.map(x=>x.capacidad))].sort((a,b)=>a-b);
  $("#capacitySelect").innerHTML = `<option value="">Selecciona...</option>` + values.map(v=>`<option value="${v}">${v} cuartos</option>`).join("");
}

function renderResults(items, query=""){
  filtered = items;
  const box = $("#results");
  if(!query && items === data){ box.innerHTML = ""; return; }
  if(!items.length){ box.innerHTML = `<div class="no-results">No encontramos coincidencias. Prueba con otra referencia o consulta por capacidad.</div>`; return; }
  box.innerHTML = items.slice(0,30).map(r=>{
    const key = keyFor(r);
    return `<button type="button" class="result-item ${key===selectedKey?'active':''}" data-key="${escapeHtml(key)}">
      <span class="result-main"><strong>${escapeHtml(displayTitle(r))}</strong><small>${escapeHtml(r.motor || "Motor no especificado")}</small></span>
      <span class="result-cap">${r.capacidad} cuartos</span>
    </button>`;
  }).join("");
  box.querySelectorAll(".result-item").forEach(btn=>btn.addEventListener("click",()=>selectRecord(btn.dataset.key)));
}

function search(q){
  const n = normalize(q);
  if(!n){ renderResults(data); return; }
  const terms = n.split(" ").filter(Boolean);
  const items = data.map(r=>{
    const hay = normalize([r.marcaEquipo,r.linea,r.motor].join(" "));
    const hits = terms.filter(t=>hay.includes(t)).length;
    const starts = [r.marcaEquipo,r.linea,r.motor].map(normalize).some(v=>v.startsWith(n)) ? 2 : 0;
    return {r,score:hits+starts};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score || displayTitle(a.r).localeCompare(displayTitle(b.r),"es")).map(x=>x.r);
  renderResults(items,q);
}

function selectRecord(key){
  selectedKey = key;
  const r = data.find(x=>keyFor(x)===key);
  if(!r) return;
  renderResults(filtered, $("#searchInput").value || "seleccion");
  const title = displayTitle(r);
  $("#promoPanel").classList.remove("empty");
  $("#promoPanel").innerHTML = `<div class="promo-content">
    <span class="promo-tag">TU PROMOCIÓN DÍA NARANJA</span>
    <h3 class="vehicle-name">${escapeHtml(title)}</h3>
    <p class="motor-name">Motor: <strong>${escapeHtml(r.motor || "No especificado")}</strong><br>Capacidad de referencia: <strong>${r.capacidad} cuartos</strong></p>
    <div class="promo-numbers">
      <div class="number-card"><span>TÚ PAGAS</span><b>${r.paga}</b><small>cuartos</small></div>
      <div class="number-card highlight"><span>Y RECIBES</span><b>${r.recibe}</b><small>cuartos</small></div>
    </div>
    <div class="gift-line"><span>Gulf te obsequia</span><b>+${r.obsequio}</b><span>cuarto${r.obsequio===1?'':'s'}</span></div>
    <p class="promo-meta">Promoción sujeta a validación de capacidad y aplicación del motor. Disponible en Días Naranja.</p>
    <button type="button" class="consult-btn" id="copyPromo">Copiar promoción para mi asesor</button>
  </div>`;
  $("#copyPromo").addEventListener("click",()=>copyPromo(r));
  if(window.innerWidth < 851) $("#promoPanel").scrollIntoView({behavior:"smooth",block:"center"});
}

async function copyPromo(r){
  const msg = `Hola, consulté Días Naranja Gulf. Mi vehículo/motor es ${displayTitle(r)} - ${r.motor}. Capacidad ${r.capacidad} cuartos. La promoción indica: pago ${r.paga} y recibo ${r.recibe} (${r.obsequio} cuartos de obsequio). Quiero validar la promoción.`;
  try{ await navigator.clipboard.writeText(msg); toast("Promoción copiada ✓"); }
  catch{ toast("Selecciona y copia el texto desde tu navegador"); }
}

function toast(text){ const t=$("#toast");t.textContent=text;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400); }
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}

$("#searchInput").addEventListener("input",e=>search(e.target.value));
$("#clearBtn").addEventListener("click",()=>{$("#searchInput").value="";renderResults(data);$("#searchInput").focus();});
$("#browseBtn").addEventListener("click",()=>{ $("#searchInput").value=""; renderResults(data,"todos"); });
$("#capacityBtn").addEventListener("click",()=>$("#capacityBox").classList.toggle("hidden"));
$("#capacitySearchBtn").addEventListener("click",()=>{
  const value = Number($("#capacitySelect").value);
  if(!value) return;
  const exact = data.filter(r=>r.capacidad===value);
  renderResults(exact,`capacidad ${value}`);
  if(exact.length===1) selectRecord(keyFor(exact[0]));
});

init();
