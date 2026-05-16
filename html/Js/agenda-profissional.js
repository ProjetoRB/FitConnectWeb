const API = 'http://localhost:8080';
const usuarioLogado = JSON.parse(sessionStorage.getItem('usuario'));

if (!usuarioLogado || usuarioLogado.tipo !== 'Profissional') {
  window.location.href = 'login.html';
}

const profissionalId = usuarioLogado.id;

const WEEK_DAYS = [
  { name: "Segunda-feira", key: "monday" },
  { name: "Terça-feira", key: "tuesday" },
  { name: "Quarta-feira", key: "wednesday" },
  { name: "Quinta-feira", key: "thursday" },
  { name: "Sexta-feira", key: "friday" },
  { name: "Sábado", key: "saturday" },
  { name: "Domingo", key: "sunday" }
];

const START_HOUR = 8;
const END_HOUR = 17;

/*=============================================================================================
GERAR HORÁRIOS BASEADO NA DURAÇÃO (TEMPO DE CADA CONSULTA)
=============================================================================================*/
function generateTimeSlots(durationMinutes) {
  const slots = [];
  let currentMinutes = START_HOUR * 60;
  const endMinutes = END_HOUR * 60;
  
  while (currentMinutes <= endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push(timeString);
    currentMinutes += durationMinutes;
  }
  return slots;
}

/*=============================================================================================
CRIAR AGENDA PADRÃO
=============================================================================================*/
function buildDefaultSchedule() {
  const schedule = {};
  const defaultDuration = 60;
  const defaultSlots = generateTimeSlots(defaultDuration);
  
  WEEK_DAYS.forEach(day => {
    schedule[day.key] = {
      name: day.name,
      enabled: true,
      duration: defaultDuration,
      modality: "both",
      slots: defaultSlots.map(time => ({ time, active: true }))
    };
  });
  
  return schedule;
}

let currentSchedule = buildDefaultSchedule();
const scheduleGrid = document.getElementById("scheduleGrid");
const toastMsg = document.getElementById("toastMsg");

/*=============================================================================================
MOSTRAR NOTIFICAÇÃO
=============================================================================================*/
function showNotification(msg, isError = false) {
  toastMsg.textContent = msg;
  if (isError) toastMsg.style.backgroundColor = "#dc2626";
  else toastMsg.style.backgroundColor = "#22c55e";
  toastMsg.classList.add("show");
  setTimeout(() => {
    toastMsg.classList.remove("show");
    toastMsg.style.backgroundColor = "#22c55e";
  }, 2000);
}

/*=============================================================================================
REGENERAR HORÁRIOS DE UM DIA ESPECÍFICO BASEADO NA DURAÇÃO
=============================================================================================*/
function regenerateDaySlots(dayKey) {
  const dayData = currentSchedule[dayKey];
  if (!dayData) return;
  
  const duration = dayData.duration;
  const newSlots = generateTimeSlots(duration);
  
  const oldActiveMap = new Map();
  dayData.slots.forEach(slot => {
    oldActiveMap.set(slot.time, slot.active);
  });

  const updatedSlots = newSlots.map(time => ({
    time,
    active: oldActiveMap.has(time) ? oldActiveMap.get(time) : true
  }));
  
  dayData.slots = updatedSlots;
}

/*=============================================================================================
ATUALIZAR CONFIGURAÇÃO DO DIA
=============================================================================================*/
function updateDayConfig(dayKey, type, value) {
  const day = currentSchedule[dayKey];
  if (!day) return;
  
  if (type === 'duration') {
    const newVal = parseInt(value);
    if (day.duration !== newVal) {
      day.duration = newVal;
      regenerateDaySlots(dayKey);
      renderSchedule();
      showNotification(`${day.name}: duração alterada para ${newVal} minutos (${day.slots.length} horários)`);
    }
  } else if (type === 'modality') {
    day.modality = value;
    const txt = value === 'both' ? 'Online + Presencial' : value === 'online' ? 'Online' : 'Presencial';
    showNotification(`${day.name}: ${txt}`);
  }
}

/*=============================================================================================
RESETAR TODOS OS HORÁRIOS DO DIA PARA ATIVOS
=============================================================================================*/
function resetDayHours(dayKey) {
  const day = currentSchedule[dayKey];
  if (day) {
    day.slots.forEach(slot => {
      slot.active = true;
    });
    renderSchedule();
    showNotification(`${day.name}: todos os horários resetados para disponíveis`);
  }
}

/*=============================================================================================
RENDERIZAR AGENDA COMPLETA
=============================================================================================*/
function renderSchedule() {
  scheduleGrid.innerHTML = "";
  
  for (let day of WEEK_DAYS) {
    const data = currentSchedule[day.key];
    if (!data) continue;
    
    const isEnabled = data.enabled;

    const card = document.createElement("div");
    card.className = `day-card ${!isEnabled ? 'disabled' : ''}`;
    
    const top = document.createElement("div");
    top.className = "day-top";
    
    const left = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = data.name;
    const status = document.createElement("div");
    status.className = "status-text";
    status.textContent = isEnabled ? "Disponível" : "Indisponível";
    left.appendChild(title);
    left.appendChild(status);
    
    const toggleLabel = document.createElement("label");
    toggleLabel.className = "switch";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = isEnabled;
    toggle.addEventListener("change", () => {
      data.enabled = toggle.checked;
      status.textContent = data.enabled ? "Disponível" : "Indisponível";
      renderSchedule();
    });

    const slider = document.createElement("span");
    slider.className = "slider";
    toggleLabel.appendChild(toggle);
    toggleLabel.appendChild(slider);
    
    top.appendChild(left);
    top.appendChild(toggleLabel);
    
    const configs = document.createElement("div");
    configs.className = "day-configs";
    
    const durItem = document.createElement("div");
    durItem.className = "config-item";
    const durLabel = document.createElement("label");
    durLabel.textContent = "⏱️ Duração da consulta";
    const durSelect = document.createElement("select");
    durSelect.disabled = !isEnabled;

    [30, 60, 90].forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v === 60 ? "1 hora" : v === 30 ? "30 minutos" : "1 hora e 30";

      if (data.duration === v) opt.selected = true;
        durSelect.appendChild(opt);
    });

    durSelect.onchange = (e) => updateDayConfig(day.key, 'duration', e.target.value);
    durItem.appendChild(durLabel);
    durItem.appendChild(durSelect);
    
    const modItem = document.createElement("div");
    modItem.className = "config-item";
    const modLabel = document.createElement("label");
    modLabel.textContent = "🏢 Atendimento";
    const modSelect = document.createElement("select");
    modSelect.disabled = !isEnabled;

    const mods = [
      { value: "both", label: "Online + Presencial" },
      { value: "online", label: "Somente online" },
      { value: "presencial", label: "Somente presencial" }
    ];

    mods.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.value;
      opt.textContent = m.label;

      if (data.modality === m.value) opt.selected = true;
      modSelect.appendChild(opt);
    });

    modSelect.onchange = (e) => updateDayConfig(day.key, 'modality', e.target.value);
    modItem.appendChild(modLabel);
    modItem.appendChild(modSelect);
    
    configs.appendChild(durItem);
    configs.appendChild(modItem);
    
    const hoursContainer = document.createElement("div");
    hoursContainer.className = "hours";
    const sortedSlots = [...data.slots].sort((a, b) => a.time.localeCompare(b.time));
    
    sortedSlots.forEach((slot) => {
      const btn = document.createElement("button");
      btn.textContent = slot.time;
      btn.className = `hour ${slot.active ? 'active' : 'inactive'}`;
      
      if (!isEnabled) {
        btn.disabled = true;

      } else {
        btn.addEventListener("click", () => {
          slot.active = !slot.active;
          btn.className = `hour ${slot.active ? 'active' : 'inactive'}`;
        });
      }
      
      hoursContainer.appendChild(btn);
    });
    
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "↺ Resetar todos os horários";
    resetBtn.className = "reset-btn";
    resetBtn.disabled = !isEnabled;

    resetBtn.onclick = () => {
      if (confirm(`Resetar todos os horários de ${data.name} para disponíveis?`)) {
        resetDayHours(day.key);
      }
    };
    
    card.appendChild(top);
    card.appendChild(configs);
    card.appendChild(hoursContainer);
    card.appendChild(resetBtn);
    scheduleGrid.appendChild(card);
  }
}

/*=============================================================================================
PEGAR A DATA REAL E ADICIONAR NO PROJETO
=============================================================================================*/
function getDateForWeekDay(dayKey) {
  const hoje = new Date();

  const mapaDias = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };

  const diaAlvo = mapaDias[dayKey];
  const diaAtual = hoje.getDay();
  let diferenca = diaAlvo - diaAtual;

  if (diferenca <= 0) {
    diferenca += 7;
  }

  const dataFinal = new Date(hoje);
  dataFinal.setDate(hoje.getDate() + diferenca);

  const ano = dataFinal.getFullYear();
  const mes = String(dataFinal.getMonth() + 1).padStart(2, '0');
  const dia = String(dataFinal.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

/*=============================================================================================
SALVAR AGENDA NO BANCO DE DADOS E NO LOCALSTORAGE
=============================================================================================*/
async function saveAgenda() {
  const responseHorarios = await fetch(
    `${API}/agenda-profissional/profissional/${profissionalId}/todos`
  );

  const horariosExistentes = await responseHorarios.json();

  const horariosBloqueados = new Set(
    horariosExistentes
      .filter(h => h.statusHorario === "agendado")
      .map(h => `${h.dataDisponivel}_${h.horaDisponivel.substring(0, 5)}`)
  );

  await fetch(`${API}/agenda-profissional/profissional/${profissionalId}`, {
    method: 'DELETE'
  });

  let totalSlots = 0;
  let activeDays = 0;

  for (let day of WEEK_DAYS) {
    const d = currentSchedule[day.key];

    if (!d.enabled) continue;

    activeDays++;

    for (let slot of d.slots) {
      if (!slot.active) continue;

      totalSlots++;

      const dataHorario = getDateForWeekDay(day.key);
      const chaveHorario = `${dataHorario}_${slot.time}`;

      if (horariosBloqueados.has(chaveHorario)) {
        continue;
      }

      const dados = {
        profissionalId: profissionalId,
        dataDisponivel: dataHorario,
        horaDisponivel: `${slot.time}:00`,
        descricao: `Horário disponível - ${d.name}`
      };

      await fetch(`${API}/agenda-profissional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
    }
  }

  localStorage.setItem("fitconnect_agenda", JSON.stringify(currentSchedule));

  showNotification(`✓ Agenda salva! ${totalSlots} horários enviados para o banco`);

  setTimeout(() => {
    window.location.href = "dashboard-profissional.html";
  }, 1500);
}

/*=============================================================================================
CARREGAR AGENDA SALVA
=============================================================================================*/
function loadAgenda() {
  const saved = localStorage.getItem("fitconnect_agenda");

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      currentSchedule = parsed;
      
      for (let day of WEEK_DAYS) {
        if (!currentSchedule[day.key]) {
          currentSchedule[day.key] = {
            name: day.name,
            enabled: true,
            duration: 60,
            modality: "both",
            slots: generateTimeSlots(60).map(t => ({ time: t, active: true }))
          };
        }

        if (!currentSchedule[day.key].slots || currentSchedule[day.key].slots.length === 0) {
          currentSchedule[day.key].slots = generateTimeSlots(currentSchedule[day.key].duration || 60).map(t => ({ time: t, active: true }));
        }
      }
      renderSchedule();
      showNotification("Agenda carregada com sucesso");

    } catch(e) {
      console.log("Erro ao carregar agenda");
      currentSchedule = buildDefaultSchedule();
      renderSchedule();
    }
  }
}

/*=============================================================================================
RESET GLOBAL PARA VALORES PADRÃO
=============================================================================================*/
function resetAll() {
  if (confirm("Resetar tudo para os valores padrão?")) {
    currentSchedule = buildDefaultSchedule();
    renderSchedule();
    showNotification("Agenda resetada para padrão");
  }
}

/*=============================================================================================
EVENTOS
=============================================================================================*/
document.getElementById("globalSaveBtn").onclick = saveAgenda;

/*=============================================================================================
RESET COM Ctrl+R
=============================================================================================*/
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === 'r') {
    e.preventDefault();
    resetAll();
  }
});

/*=============================================================================================
INICIALIZAR
=============================================================================================*/
loadAgenda();
renderSchedule();