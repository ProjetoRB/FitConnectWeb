// ========================
// DASHBOARD - PROFISSIONAIS E AGENDAMENTOS
// ========================

const API = 'http://localhost:8080';

const usuarioLogado = JSON.parse(sessionStorage.getItem('usuario'));

let currentAlunoId = usuarioLogado?.id || 1;

// ------------------------
// CARREGAR PROFISSIONAIS
// ------------------------
async function carregarProfissionais(filtro = 'todos') {
    try {
        const res = await fetch(`${API}/profissionais`);

        let profissionais = await res.json();

        if (filtro !== 'todos') {
            profissionais = profissionais.filter(p => p.areaProfissional === filtro);
        }

        const container = document.getElementById('profissionaisContainer');

        if (!container) return;

        if (!profissionais.length) {
            container.innerHTML = '<p class="placeholder">Nenhum profissional encontrado.</p>';
            return;
        }

        container.innerHTML = profissionais.map(prof => `
            <div class="card-profissional" data-id="${prof.id}">
                <h4>${prof.nomeCompleto}</h4>
                <p>${prof.areaProfissional}</p>

                <div class="horarios" id="horarios-${prof.id}">
                    <span class="horario-badge">Horários ainda não implementados</span>
                </div>

                <div class="acoes">
                    <button class="conversar-btn" data-id="${prof.id}" data-nome="${prof.nomeCompleto}">
                        💬 Conversar
                    </button>

                    <button class="agendar-btn" data-id="${prof.id}" data-nome="${prof.nomeCompleto}" data-area="${prof.areaProfissional}">
                        📅 Agendar
                    </button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.conversar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                alert('Chat ainda não implementado no backend.');
            });
        });

        document.querySelectorAll('.agendar-btn').forEach(btn => {

    btn.addEventListener('click', () => {

        abrirModalAgendamento(
            btn.dataset.id,
            btn.dataset.nome,
            btn.dataset.area
        );
    });
});

    } catch (err) {
        console.error(err);
        alert('Erro ao carregar profissionais.');
    }
}

// ------------------------
// MODAL DE AGENDAMENTO
// OBS: Backend ainda não possui horários/agendamentos
// ------------------------
let profSelecionadoId = null;

async function abrirModalAgendamento(id, nome, area) {
    document.getElementById('profAreaModal').innerText = area;
    profSelecionadoId = id;
    const profNomeModal = document.getElementById('profNomeModal');
    const profId = document.getElementById('profId');
    const modalAgendar = document.getElementById('modalAgendar');
    const selectHorario = document.getElementById('horaConsulta');

    if (profNomeModal) profNomeModal.innerText = nome;
    if (profId) profId.value = id;

    try {

        const response = await fetch(
            `${API}/agenda-profissional/profissional/${id}`
        );

        let horarios = await response.json();

        const agora = new Date();

        horarios = horarios.filter(horario => {
            const dataHora = new Date(`${horario.dataDisponivel}T${horario.horaDisponivel}`);
            return dataHora > agora;
        });

        horarios.sort((a, b) => {
            const dataHoraA = new Date(`${a.dataDisponivel}T${a.horaDisponivel}`);
            const dataHoraB = new Date(`${b.dataDisponivel}T${b.horaDisponivel}`);

            return dataHoraA - dataHoraB;
        });

        selectHorario.innerHTML = '';

        if (!horarios.length) {
            selectHorario.innerHTML = '<option>Nenhum horário disponível</option>';

        } else {

            horarios.forEach(horario => {

                const option = document.createElement('option');

                option.value = horario.id;

                const partesData = horario.dataDisponivel.split("-");

                const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

                const dataObj = new Date(
                    Number(partesData[0]),
                    Number(partesData[1]) - 1,
                    Number(partesData[2])
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

                const hora = horario.horaDisponivel.substring(0, 5);

                option.textContent = `${diaSemana} • ${dataFormatada} às ${hora}`;

                selectHorario.appendChild(option);
            });
        }

        modalAgendar.classList.remove('hidden');

    } catch (error) {

        console.error(error);

        alert('Erro ao carregar horários.');
    }
}

// ------------------------
// FORM AGENDAMENTO
// OBS: Ainda não funciona de verdade sem backend
// ------------------------
document.getElementById('formAgendamento')?.addEventListener('submit', async (e) => {

    e.preventDefault();

    const horarioId =
        document.getElementById('horaConsulta').value;

    const dados = {
        alunoId: currentAlunoId,
        horarioId: horarioId
    };

    try {

        const response = await fetch(
            `${API}/agenda-profissional/agendar`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            }
        );

        if (response.ok) {
            alert('Agendamento realizado com sucesso!');

            document.getElementById('modalAgendar')
            .classList.add('hidden');

            carregarConsultasPendentes();
            carregarProfissionais();

        } else {

            alert('Erro ao realizar agendamento.');
        }

    } catch (error) {

        console.error(error);

        alert('Erro de conexão com o servidor.');
    }
});

// ------------------------
// CONSULTAS PENDENTES
// OBS: Ainda não existe endpoint no backend
// ------------------------
async function carregarConsultasPendentes() {
    const div = document.getElementById('pendingList');

    if (!div) return;

    try {
        const response = await fetch(`${API}/agenda-profissional/aluno/${currentAlunoId}`);

        const consultas = await response.json();

        const consultasAtivas = consultas.filter(c =>
            c.statusHorario === 'agendado'
        );

        if (!consultasAtivas.length) {
            div.innerHTML = '<p class="placeholder">Nenhuma consulta pendente.</p>';
            return;
        }

        div.innerHTML = consultasAtivas.map(c => `
            <div class="consulta-item">
                <p><strong>Data:</strong> ${c.dataDisponivel}</p>
                <p><strong>Horário:</strong> ${c.horaDisponivel}</p>
                <p><strong>Status:</strong> ${c.statusHorario}</p>

                <button onclick="abrirModalCancelamentoAluno(${c.id})" class="btn-cancelar-consulta">
                    Cancelar consulta
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        div.innerHTML = '<p class="placeholder">Erro ao carregar consultas.</p>';
    }
}

// ------------------------
// BOTÕES DE NAVEGAÇÃO
// ------------------------
document.getElementById('verMinhasConsultas')?.addEventListener('click', () => {
    alert('Minhas consultas ainda não foram implementadas.');
});

document.getElementById('verHistorico')?.addEventListener('click', () => {
    alert('Histórico ainda não foi implementado.');
});

// ------------------------
// FECHAR MODAL
// ------------------------
document.querySelector('.fechar-modal')?.addEventListener('click', () => {
    document.getElementById('modalAgendar')?.classList.add('hidden');
});

// ------------------------
// FILTROS
// ------------------------
document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));

        btn.classList.add('active');

        carregarProfissionais(btn.dataset.area);
    });
});

// =========================
// MODAL DE SAIR
// =========================

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

let consultaAlunoParaCancelar = null;
const modalCancelarConsulta = document.getElementById("modalCancelarConsulta");
const fecharModalCancelamento = document.getElementById("fecharModalCancelamento");
const confirmarCancelamentoConsulta = document.getElementById("confirmarCancelamentoConsulta");

window.abrirModalCancelamentoAluno = function(horarioId) {
    consultaAlunoParaCancelar = horarioId;
    modalCancelarConsulta.classList.add("active");
};

async function cancelarConsultaAluno() {
    if (!consultaAlunoParaCancelar) return;

    try {
        const response = await fetch(`${API}/agenda-profissional/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                horarioId: consultaAlunoParaCancelar,
                status: 'cancelado_aluno'
            })
        });

        if (response.ok) {
            modalCancelarConsulta.classList.remove("active");
            consultaAlunoParaCancelar = null;

            carregarConsultasPendentes();
            carregarProfissionais();
        } else {
            alert('Erro ao cancelar consulta.');
        }

    } catch (error) {
        console.error(error);
        alert('Erro de conexão com o servidor.');
    }
}

fecharModalCancelamento?.addEventListener("click", () => {
    modalCancelarConsulta.classList.remove("active");
});

confirmarCancelamentoConsulta?.addEventListener("click", () => {
    cancelarConsultaAluno();
});

modalCancelarConsulta?.addEventListener("click", (e) => {
    if (e.target === modalCancelarConsulta) {
        modalCancelarConsulta.classList.remove("active");
    }
});

// ------------------------
// INICIALIZAÇÃO
// ------------------------
carregarProfissionais();
carregarConsultasPendentes();