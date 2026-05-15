// ============================================
// FUNÇÕES QUE VIRÃO DA API/BANCO DE DADOS
// ============================================

// Buscar dados do profissional logado
async function buscarDadosProfissional() {
  // TODO: Conectar com sua API
  // const response = await fetch('/api/profissional/dados');
  // const data = await response.json();
  // return data;
  
  // Aguardando implementação da API
  console.log("Aguardando conexão com a API...");
  return null;
}

// Buscar agendamentos do profissional
async function buscarAgendamentos() {
  // TODO: Conectar com sua API
  // const response = await fetch('/api/profissional/agendamentos');
  // const agendamentos = await response.json();
  // return agendamentos;
  
  // Aguardando implementação da API
  console.log("Aguardando conexão com a API...");
  return [];
}

// ============================================
// LÓGICA DO DASHBOARD
// ============================================

// Agrupar agendamentos por aluno
function agruparPorAluno(agendamentos) {
  const alunosMap = new Map();
  
  agendamentos.forEach(ag => {
    if (!alunosMap.has(ag.aluno_id)) {
      alunosMap.set(ag.aluno_id, {
        id: ag.aluno_id,
        nome: ag.aluno_nome,
        email: ag.aluno_email,
        foto: ag.aluno_foto || null,
        totalAgendamentos: 0,
        proximoAgendamento: null
      });
    }
    
    const aluno = alunosMap.get(ag.aluno_id);
    aluno.totalAgendamentos++;
    
    // Verificar próximo agendamento
    const dataAgenda = new Date(ag.data + "T" + ag.hora);
    const hoje = new Date();
    
    if (!aluno.proximoAgendamento || dataAgenda < aluno.proximoAgendamento.dataObj) {
      if (dataAgenda >= hoje) {
        aluno.proximoAgendamento = {
          id: ag.id,
          data: ag.data,
          hora: ag.hora,
          tipo: ag.tipo,
          status: ag.status,
          dataObj: dataAgenda
        };
      }
    }
  });
  
  // Ordenar por próximo agendamento
  return Array.from(alunosMap.values()).sort((a, b) => {
    if (!a.proximoAgendamento) return 1;
    if (!b.proximoAgendamento) return -1;
    return a.proximoAgendamento.dataObj - b.proximoAgendamento.dataObj;
  });
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
  
  // Atualizar stats
  document.getElementById("totalAgendamentos").textContent = totalAgendamentos;
  document.getElementById("alunosUnicos").textContent = alunosUnicos;
  
  container.innerHTML = "";
  
  alunos.forEach(aluno => {
    const card = document.createElement("div");
    card.className = "aluno-card";
    
    // Info do aluno
    const infoDiv = document.createElement("div");
    infoDiv.className = "aluno-info";
    
    const nomeStrong = document.createElement("strong");
    nomeStrong.textContent = aluno.nome;
    
    const emailSpan = document.createElement("span");
    emailSpan.textContent = aluno.email;
    
    infoDiv.appendChild(nomeStrong);
    infoDiv.appendChild(emailSpan);
    
    // Próximo horário
    const horarioDiv = document.createElement("div");
    
    if (aluno.proximoAgendamento) {
      const prox = aluno.proximoAgendamento;
      const dataTexto = formatarData(prox.data, prox.hora);
      horarioDiv.innerHTML = `📅 ${dataTexto}`;
      horarioDiv.className = `proximo-horario ${prox.tipo}`;
    } else {
      horarioDiv.innerHTML = `📅 Sem agendamentos futuros`;
      horarioDiv.className = `proximo-horario`;
    }
    
    // Botão gerenciar horários
    const btn = document.createElement("button");
    btn.textContent = "⏰ Gerenciar horários";
    btn.className = "horario-btn";
    btn.onclick = () => {
      // Redirecionar para a tela de agenda profissional
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