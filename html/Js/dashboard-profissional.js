// ============================================
// FUNÇÕES QUE VIRÃO DA API/BANCO DE DADOS
// ============================================

const API = 'http://localhost:8080';

const usuarioLogado = JSON.parse(sessionStorage.getItem('usuario'));

if (!usuarioLogado || usuarioLogado.tipo !== 'Profissional') {
  window.location.href = 'login.html';
}

const profissionalId = usuarioLogado.id;

async function buscarAlunoPorId(alunoId) {
  try {
    const response = await fetch(`${API}/alunos/${alunoId}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();

    } catch (error) {
      console.error("Erro ao buscar aluno:", error);
      return null;
    }
  }

// Buscar dados do profissional logado
async function buscarDadosProfissional() {
  return usuarioLogado;
}

// Buscar agendamentos do profissional
async function buscarAgendamentos() {
  const response = await fetch(
    `${API}/agenda-profissional/profissional/${profissionalId}/todos`
  );

  const agendamentos = await response.json();

  const agendados = agendamentos.filter(ag =>
    ag.statusHorario === 'agendado'
  );

  for (let ag of agendados) {
    const aluno = await buscarAlunoPorId(ag.alunoId);

    ag.alunoNome = aluno?.nomeCompleto || `Aluno ${ag.alunoId}`;
    ag.alunoEmail = aluno?.email || '';
  }

  return agendados;
}

// ============================================
// LÓGICA DO DASHBOARD
// ============================================

// Agrupar agendamentos por aluno
function agruparPorAluno(agendamentos) {

  const alunosMap = new Map();

  agendamentos.forEach(ag => {

    if (!alunosMap.has(ag.alunoId)) {

      alunosMap.set(ag.alunoId, {

        id: ag.alunoId,

        nome: ag.alunoNome || `Aluno ${ag.alunoId}`,

        email: ag.alunoEmail || '',

        totalAgendamentos: 1,

        proximoAgendamento: {

          data: ag.dataDisponivel,

          hora: ag.horaDisponivel
        }
      });

    } else {

      const aluno = alunosMap.get(ag.alunoId);

      aluno.totalAgendamentos++;
    }
  });

  return Array.from(alunosMap.values());
}

// Formatar data para exibição
function formatarData(dataString, horaString) {
  const dataObj = new Date(dataString + "T" + horaString);
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  
  hoje.setHours(0, 0, 0, 0);
  amanha.setHours(0, 0, 0, 0);
  dataObj.setHours(0, 0, 0, 0);
  
  if (dataObj.getTime() === hoje.getTime()) {
    return `Hoje • ${horaString}`;
  } else if (dataObj.getTime() === amanha.getTime()) {
    return `Amanhã • ${horaString}`;
  } else {
    const dataFormatada = dataString.split('-').reverse().join('/');
    return `${dataFormatada} • ${horaString}`;
  }
}

// Renderizar lista de alunos
function renderizarAlunos(agendamentos) {
  const container = document.getElementById("alunosList");
  if (!container) return;
  
  if (!agendamentos || agendamentos.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum agendamento encontrado</p></div>';
    document.getElementById("totalAgendamentos").textContent = "0";
    document.getElementById("alunosUnicos").textContent = "0";
    return;
  }
  
  const alunos = agruparPorAluno(agendamentos);
  const totalAgendamentos = agendamentos.length;
  const alunosUnicos = alunos.length;
  
  document.getElementById("totalAgendamentos").textContent = totalAgendamentos;
  document.getElementById("alunosUnicos").textContent = alunosUnicos;
  
  container.innerHTML = "";
  
  alunos.forEach(aluno => {
    const card = document.createElement("div");
    card.className = "aluno-card";
    
    const infoDiv = document.createElement("div");
    infoDiv.className = "aluno-info";
    
    const nomeStrong = document.createElement("strong");
    nomeStrong.textContent = aluno.nome;
    
    const emailSpan = document.createElement("span");
    emailSpan.textContent = aluno.email;
    
    infoDiv.appendChild(nomeStrong);
    infoDiv.appendChild(emailSpan);
    
    const horarioDiv = document.createElement("div");
    
    if (aluno.proximoAgendamento) {
      const prox = aluno.proximoAgendamento;
      const dataTexto = formatarData(prox.data, prox.hora);
      horarioDiv.innerHTML = `📅 ${dataTexto}`;
      horarioDiv.className = `proximo-horario`;
    } else {
      horarioDiv.innerHTML = `📅 Sem agendamentos futuros`;
      horarioDiv.className = `proximo-horario`;
    }
    
    const btn = document.createElement("button");
    btn.textContent = "⏰ Gerenciar horários";
    btn.className = "horario-btn";
    btn.onclick = () => {
      window.location.href = "agenda-profissional.html";
    };
    
    card.appendChild(infoDiv);
    card.appendChild(horarioDiv);
    card.appendChild(btn);
    container.appendChild(card);
  });
}

// Atualizar nome do profissional
function atualizarNomeProfissional(nome) {
  const nomeElement = document.getElementById("profissionalNome");
  if (nomeElement && nome) {
    nomeElement.textContent = `Olá, ${nome} 👨‍🏫`;
  }
}

// Carregar todos os dados
async function carregarDados() {
  try {
    // Buscar dados do profissional
    const profissional = await buscarDadosProfissional();
    if (profissional && profissional.nome) {
      atualizarNomeProfissional(profissional.nome);
    }
    
    // Buscar agendamentos
    const agendamentos = await buscarAgendamentos();
    renderizarAlunos(agendamentos);
    
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    const container = document.getElementById("alunosList");
    if (container) {
      container.innerHTML = '<div class="empty-state"><p>Erro ao carregar dados. Tente novamente.</p></div>';
    }
  }
}

// ============================================
// NAVEGAÇÃO
// ============================================

document.getElementById("navAlunos")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "dashboard-profissional.html";
});

document.getElementById("navAgenda")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "agenda-profissional.html";
});

// ============================================
// INICIALIZAR
// ============================================

carregarDados();

const logoutBtn = document.getElementById('logoutBtn');
const modalSair = document.getElementById('modalSair');
const cancelarSair = document.getElementById('cancelarSair');
const confirmarSair = document.getElementById('confirmarSair');

if (logoutBtn && modalSair && cancelarSair && confirmarSair) {
  logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    modalSair.classList.add('active');
  });

  cancelarSair.addEventListener('click', function() {
    modalSair.classList.remove('active');
  });

  confirmarSair.addEventListener('click', function() {
    sessionStorage.removeItem('usuario');
    window.location.href = 'login.html';
  });

  modalSair.addEventListener('click', function(e) {
    if (e.target === modalSair) {
      modalSair.classList.remove('active');
    }
  });
}