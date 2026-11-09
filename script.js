// ---------- Back icon fix (inserted via JS to keep HTML clean) ----------
document.querySelectorAll('.backbtn').forEach(b=>{
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#241F13" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
});

// ---------- Clock ----------
function tickClock(){
  const d = new Date();
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  document.getElementById('clock').textContent = h+':'+m;
}
tickClock(); setInterval(tickClock, 15000);

// ---------- Navigation ----------
let history = ['home'];
function go(name){
  const current = document.querySelector('.screen.active');
  const next = document.querySelector('.screen[data-screen="'+name+'"]');
  if(!next || next===current) return;
  if(current){ current.classList.remove('active'); }
  next.classList.add('active');
  history.push(name);
  document.querySelector('.screens').scrollTop = 0;
}

// ---------- Mock user/pet data ----------
let currentUser = null;
const pets = [
  {name:'Rex', initial:'R'},
  {name:'Mimi', initial:'M'},
  {name:'Thor', initial:'T'}
];

function renderPets(){
  const row = document.getElementById('petRow');
  row.innerHTML = '';
  pets.forEach(p=>{
    const el = document.createElement('div');
    el.className='pet-chip';
    el.innerHTML = '<div class="pet-avatar">'+p.initial+'</div><small>'+p.name+'</small>';
    row.appendChild(el);
  });
  const add = document.createElement('div');
  add.className='pet-chip';
  add.style.cursor='pointer';
  add.innerHTML = '<div class="pet-avatar" style="background:transparent;border:2px dashed #8A7B4E;">+</div><small>Adicionar</small>';
  add.onclick = ()=>{
    const name = prompt('Nome do novo pet:');
    if(name && name.trim()){
      pets.push({name:name.trim(), initial:name.trim()[0].toUpperCase()});
      renderPets();
    }
  };
  row.appendChild(add);
}

// ---------- Validation helpers ----------
function setInvalid(fieldId, invalid){
  const f = document.getElementById(fieldId);
  if(!f) return;
  f.classList.toggle('invalid', invalid);
}

function handleLogin(e){
  e.preventDefault();
  const email = document.querySelector('#loginForm #f-login-email input');
  const senha = document.querySelector('#loginForm #f-login-senha input');
  const emailOk = /^\S+@\S+\.\S+$/.test(email.value);
  const senhaOk = senha.value.length >= 4;
  setInvalid('f-login-email', !emailOk);
  setInvalid('f-login-senha', !senhaOk);
  if(emailOk && senhaOk){
    currentUser = { nome: email.value.split('@')[0], email: email.value };
    enterDashboard();
  }
  return false;
}

function handleCadastro(e){
  e.preventDefault();
  const nome = document.querySelector('#f-nome input');
  const sobrenome = document.querySelector('#f-sobrenome input');
  const cpf = document.querySelector('#f-cpf input');
  const telefone = document.querySelector('#f-telefone input');
  const email = document.querySelector('#f-email input');
  const senha = document.querySelector('#f-senha input');
  const senha2 = document.querySelector('#f-senha2 input');

  const cpfDigits = cpf.value.replace(/\D/g,'');
  const telDigits = telefone.value.replace(/\D/g,'');
  const checks = {
    'f-nome': nome.value.trim().length < 2,
    'f-sobrenome': sobrenome.value.trim().length < 2,
    'f-cpf': cpfDigits.length !== 11,
    'f-telefone': telDigits.length < 10,
    'f-email': !/^\S+@\S+\.\S+$/.test(email.value),
    'f-senha': senha.value.length < 4,
    'f-senha2': senha2.value !== senha.value || senha2.value.length < 4
  };
  Object.entries(checks).forEach(([id, invalid])=>setInvalid(id, invalid));
  const allOk = Object.values(checks).every(v=>!v);
  if(allOk){
    currentUser = { nome: nome.value.trim(), sobrenome: sobrenome.value.trim(), email: email.value };
    enterDashboard();
  }
  return false;
}

function enterDashboard(){
  document.getElementById('greetMsg').textContent = 'Bem-vindo(a), ' + (currentUser.nome || 'cliente') + '!';
  renderPets();
  go('dashboard');
}

// ---------- Booking ----------
const catalog = {
  tosa: {
    title: 'Tosa',
    items: [
      {label:'Tosa Higiênica', price:40},
      {label:'Tosa na Máquina', price:60},
      {label:'Tosa na Tesoura', price:90}
    ],
    adicionais: [
      {label:'Nenhum', price:0},
      {label:'Corte de unha', price:15},
      {label:'Limpeza de ouvido', price:10},
      {label:'Perfume', price:5}
    ]
  },
  banho: {
    title: 'Banho',
    items: [
      {label:'Banho Simples', price:35},
      {label:'Banho Especial', price:55}
    ],
    adicionais: [
      {label:'Nenhum', price:0},
      {label:'Escovação de dentes', price:12},
      {label:'Hidratação', price:20},
      {label:'Tosa de higiene', price:25}
    ]
  }
};
const horarios = ['09:00','10:30','13:00','14:30','16:00','17:30'];

let currentService = 'tosa';
let currentTotal = 0;

function startBooking(service){
  currentService = service;
  const cfg = catalog[service];
  document.getElementById('bookingTitle').textContent = cfg.title;

  const petSel = document.getElementById('bk-pet');
  petSel.innerHTML = pets.map(p=>'<option>'+p.name+'</option>').join('');

  const itemSel = document.getElementById('bk-item');
  itemSel.innerHTML = cfg.items.map(i=>'<option value="'+i.price+'">'+i.label+' — R$ '+i.price.toFixed(2)+'</option>').join('');

  const addSel = document.getElementById('bk-adicional');
  addSel.innerHTML = cfg.adicionais.map(i=>'<option value="'+i.price+'">'+i.label+(i.price?(' — R$ '+i.price.toFixed(2)):'')+'</option>').join('');

  const horaSel = document.getElementById('bk-horario');
  horaSel.innerHTML = horarios.map(h=>'<option>'+h+'</option>').join('');

  const dataInput = document.getElementById('bk-data');
  const today = new Date().toISOString().split('T')[0];
  dataInput.min = today;
  dataInput.value = today;

  updateBookingTotal();
  go('booking');
}

function updateBookingTotal(){
  const item = parseFloat(document.getElementById('bk-item').value || 0);
  const add = parseFloat(document.getElementById('bk-adicional').value || 0);
  currentTotal = item + add;
  document.getElementById('bk-total').textContent = 'R$ ' + currentTotal.toFixed(2).replace('.', ',');
}

// ---------- Payment ----------
const methods = [
  {id:'pix', label:'Pix', icon:'<circle cx="12" cy="12" r="9" stroke="#241F13" stroke-width="2"/><path d="M8 12l3 3 5-6" stroke="#241F13" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'},
  {id:'debito', label:'Débito', icon:'<rect x="3" y="6" width="18" height="13" rx="2" stroke="#241F13" stroke-width="2"/><path d="M3 10h18" stroke="#241F13" stroke-width="2"/>'},
  {id:'credito', label:'Crédito', icon:'<rect x="3" y="6" width="18" height="13" rx="2" stroke="#241F13" stroke-width="2"/><path d="M3 10h18M7 15h4" stroke="#241F13" stroke-width="2" stroke-linecap="round"/>'},
  {id:'dinheiro', label:'Dinheiro', icon:'<rect x="3" y="7" width="18" height="11" rx="2" stroke="#241F13" stroke-width="2"/><circle cx="12" cy="12.5" r="2.4" stroke="#241F13" stroke-width="2"/>'},
  {id:'outro', label:'Outro', icon:'<circle cx="12" cy="12" r="9" stroke="#241F13" stroke-width="2"/><path d="M12 8v5M12 16h.01" stroke="#241F13" stroke-width="2" stroke-linecap="round"/>'}
];
let selectedMethod = null;
let amountPaid = 0;

function goToPayment(){
  const paySel = document.getElementById('payMethods');
  paySel.innerHTML = methods.map(m=>
    '<div class="pay-method" id="pm-'+m.id+'" onclick="selectMethod(\''+m.id+'\')">'+
      '<svg viewBox="0 0 24 24" fill="none">'+m.icon+'</svg><span>'+m.label+'</span>'+
    '</div>'
  ).join('');
  selectedMethod = null;
  amountPaid = 0;
  document.getElementById('valorPagoInput').value = '';
  updatePaySummary();
  go('pagamento');
}

function selectMethod(id){
  selectedMethod = id;
  document.querySelectorAll('.pay-method').forEach(el=>el.classList.remove('selected'));
  document.getElementById('pm-'+id).classList.add('selected');
}

function updatePaySummary(){
  amountPaid = parseFloat(document.getElementById('valorPagoInput').value || 0);
  const falta = Math.max(currentTotal - amountPaid, 0);
  document.getElementById('payTotal').textContent = 'R$ ' + currentTotal.toFixed(2).replace('.', ',');
  document.getElementById('payPaid').textContent = 'R$ ' + amountPaid.toFixed(2).replace('.', ',');
  document.getElementById('payFalta').textContent = 'R$ ' + falta.toFixed(2).replace('.', ',');
  const faltaRow = document.getElementById('payFaltaRow');
  faltaRow.classList.toggle('ok', falta <= 0);
  const finalizeBtn = document.getElementById('finalizeBtn');
  finalizeBtn.disabled = !(falta <= 0 && amountPaid > 0 && selectedMethod);
}

// re-check finalize button whenever a method is picked
const origSelectMethod = selectMethod;
selectMethod = function(id){ origSelectMethod(id); updatePaySummary(); };

function finalizePayment(){
  const cfg = catalog[currentService];
  document.getElementById('successMsg').textContent =
    'Serviço de ' + cfg.title.toLowerCase() + ' agendado com sucesso. Pagamento de R$ ' +
    currentTotal.toFixed(2).replace('.', ',') + ' confirmado.';
  go('sucesso');
}

function resetFlow(){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelector('.screen[data-screen="home"]').classList.add('active');
  document.getElementById('loginForm').reset();
  document.getElementById('cadastroForm').reset();
  document.querySelectorAll('.field.invalid').forEach(f=>f.classList.remove('invalid'));
  history = ['home'];
}
