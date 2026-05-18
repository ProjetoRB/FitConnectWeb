/*=============================================================================================
FUNÇÕES QUE VIRÃO DA API/BANCO DE DADOS
=============================================================================================*/

const API = 'http://localhost:8080';
const usuarioLogado = JSON.parse(sessionStorage.getItem('usuario'));

if (!usuarioLogado || usuarioLogado.tipo !== 'Profissional') {
  window.location.href = 'login.html';
}

const profissionalId = usuarioLogado.id;

/*=============================================================================================
BUSCAR ALUNO POR ID
=============================================================================================*/
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

/*=============================================================================================
BUSCAR DADOS DO PROFISSIONAL LOGADO
=============================================================================================*/
async function buscarDadosProfissional() {

  try {
    const response = await fetch(`${API}/profissionais`);

    if (!response.ok) {
      return usuarioLogado;
    }

    const profissionais = await response.json();

    const profissionalCompleto = profissionais.find(
      prof => prof.id === profissionalId
    );

    return profissionalCompleto || usuarioLogado;

  } catch (error) {
    console.error("Erro ao buscar profissional:", error);
    return usuarioLogado;
  }
}

/*=============================================================================================
BUSCAR AGENDAMENTOS DO PROFISSIONAL
=============================================================================================*/
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

/*=============================================================================================
LÓGICA DO DASHBOARD - AGRUPAR AGENDAMENTOS POR ALUNO
=============================================================================================*/
function agruparPorAluno(agendamentos) {

  const alunosMap = new Map();

  agendamentos.forEach(ag => {

    if (!alunosMap.has(ag.alunoId)) {
      alunosMap.set(ag.alunoId, {
        id: ag.alunoId,
        nome: ag.alunoNome || `Aluno ${ag.alunoId}`,
        email: ag.alunoEmail || '',
        totalAgendamentos: 0,
        agendamentos: [],
        proximoAgendamento: null
      });
    }

    const aluno = alunosMap.get(ag.alunoId);
    aluno.totalAgendamentos++;

    aluno.agendamentos.push({
      id: ag.id,
      data: ag.dataDisponivel,
      hora: ag.horaDisponivel,
      status: ag.statusHorario
    });
  });

  const alunos = Array.from(alunosMap.values());

  alunos.forEach(aluno => {
    aluno.agendamentos.sort((a, b) => {
      const dataHoraA = new Date(`${a.data}T${a.hora}`);
      const dataHoraB = new Date(`${b.data}T${b.hora}`);

      return dataHoraA - dataHoraB;
    });

    aluno.proximoAgendamento = aluno.agendamentos[0];
  });

  return alunos;
}

/*=============================================================================================
FORMATAR DATA PARA EXIBIÇÃO
=============================================================================================*/
function formatarData(dataString, horaString) {

  const partes = dataString.split("-");

  const dataObj = new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  );

  const diasSemana = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];

  const diaSemana = diasSemana[dataObj.getDay()];
  const hoje = new Date();
  const amanha = new Date();

  amanha.setDate(hoje.getDate() + 1);

  hoje.setHours(0, 0, 0, 0);
  amanha.setHours(0, 0, 0, 0);
  dataObj.setHours(0, 0, 0, 0);

  const hora = horaString.substring(0, 5);

  if (dataObj.getTime() === hoje.getTime()) {
    return `Hoje • ${hora}`;
  }

  if (dataObj.getTime() === amanha.getTime()) {
    return `Amanhã • ${hora}`;
  }

  return `${diaSemana} • ${partes[2]}/${partes[1]}/${partes[0]} às ${hora}`;
}

/*=============================================================================================
RENDERIZAR LISTA DE ALUNOS
=============================================================================================*/
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
      horarioDiv.innerHTML = `📅 Próximo: ${formatarData(
        aluno.proximoAgendamento.data,
        aluno.proximoAgendamento.hora
      )}`;
      horarioDiv.className = "proximo-horario";
    }

    const listaDiv = document.createElement("div");
    listaDiv.className = "lista-agendamentos-aluno hidden";

    listaDiv.innerHTML = aluno.agendamentos.map(ag => `
      <div class="agendamento-item">
        <span>📌 ${formatarData(ag.data, ag.hora)}</span>

        <button onclick="abrirModalCancelamento(${ag.id})" class="btn-cancelar-agendamento">
          Cancelar consulta
        </button>
      </div>
    `).join("");

    const btnVer = document.createElement("button");
    btnVer.textContent = "Ver agendamentos";
    btnVer.className = "horario-btn";

/*=============================================================================================
ADICIONADO O BOTÃO DE CONVERSA
=============================================================================================*/
    const btnConversar = document.createElement("button");
btnConversar.textContent = "💬 Conversar";
btnConversar.className = "horario-btn";

btnConversar.onclick = () => {
  window.location.href =
    `chat-profissional.html?alunoId=${aluno.id}&alunoNome=${encodeURIComponent(aluno.nome)}`;
};

    btnVer.onclick = () => {
      listaDiv.classList.toggle("hidden");

      btnVer.textContent = listaDiv.classList.contains("hidden")
        ? "Ver agendamentos"
        : "Ocultar agendamentos";
    };

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "acoes-botoes";

    actionsDiv.appendChild(btnConversar);
    actionsDiv.appendChild(btnVer);

    card.appendChild(infoDiv);
    card.appendChild(horarioDiv);
    card.appendChild(actionsDiv);
    card.appendChild(listaDiv);

    container.appendChild(card);
  });
}

/*=============================================================================================
ATUALIZAR NOME DO PROFISSIONAL
=============================================================================================*/
function atualizarNomeProfissional(nome, profissao) {
  const nomeElement = document.getElementById("profissionalNome");

  if (nomeElement && nome) {
    nomeElement.textContent = profissao
      ? `Olá, ${nome} (${profissao})`
      : `Olá, ${nome}`;
  }
}

/*=============================================================================================
CARREGAR TODOS OS DADOS
=============================================================================================*/
async function carregarDados() {

  try {
    const profissional = await buscarDadosProfissional();

    if (profissional) {
      atualizarNomeProfissional(
        profissional.nomeCompleto || profissional.nome,
        profissional.areaProfissional
      );
    }

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

/*=============================================================================================
NAVEGAÇÃO
=============================================================================================*/
document.getElementById("navAlunos")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "dashboard-profissional.html";
});

document.getElementById("navAgenda")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "agenda-profissional.html";
});

/*=============================================================================================
INICIALIZAR
=============================================================================================*/
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

/*=============================================================================================
MODAL CANCELAR CONSULTA PROFISSIONAL
=============================================================================================*/
let consultaParaCancelar = null;
const modalCancelarConsulta = document.getElementById("modalCancelarConsulta");
const fecharModalCancelamento = document.getElementById("fecharModalCancelamento");
const confirmarCancelamentoConsulta = document.getElementById("confirmarCancelamentoConsulta");

window.abrirModalCancelamento = function(horarioId) {
  consultaParaCancelar = horarioId;
  modalCancelarConsulta.classList.add("active");
};

window.cancelarConsultaProfissional = async function() {

  if (!consultaParaCancelar) return;

  try {
    const response = await fetch(`${API}/agenda-profissional/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        horarioId: consultaParaCancelar,
        status: "cancelado_profissional"
      })
    });

    if (response.ok) {
      modalCancelarConsulta.classList.remove("active");
      consultaParaCancelar = null;
      carregarDados();

    } else {
        alert("Erro ao cancelar consulta.");
    }

  } catch (error) {
    console.error(error);
    alert("Erro de conexão com o servidor.");
  }
};

fecharModalCancelamento?.addEventListener("click", () => {
  modalCancelarConsulta.classList.remove("active");
});

confirmarCancelamentoConsulta?.addEventListener("click", () => {
  cancelarConsultaProfissional();
});

modalCancelarConsulta?.addEventListener("click", (e) => {
  if (e.target === modalCancelarConsulta) {
    modalCancelarConsulta.classList.remove("active");
  }
});