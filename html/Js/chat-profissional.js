/*=============================================================================================
CHAT - PROFISSIONAL CONVERSANDO COM ALUNO
=============================================================================================*/

const API = 'http://localhost:8080';

const usuarioLogado = JSON.parse(sessionStorage.getItem('usuario'));

if (!usuarioLogado || usuarioLogado.tipo !== 'Profissional') {
    window.location.href = 'login.html';
}

const params = new URLSearchParams(window.location.search);

const alunoId = params.get('alunoId');
const alunoNome = params.get('alunoNome');

const alunoChatNome = document.getElementById('alunoChatNome');
const chatMessages = document.getElementById('chatMessages');
const mensagemTexto = document.getElementById('mensagemTexto');
const btnEnviarMsg = document.getElementById('btnEnviarMsg');

let conversaId = null;

if (!alunoId) {
    alert('Aluno não informado.');
    window.location.href = 'dashboard-profissional.html';
}

if (alunoChatNome) {
    alunoChatNome.textContent = alunoNome || 'Aluno';
}

/*=============================================================================================
CRIAR OU BUSCAR CONVERSA
=============================================================================================*/
async function criarOuBuscarConversa() {
    try {
        const response = await fetch(`${API}/chat/conversa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                alunoId: Number(alunoId),
                profissionalId: usuarioLogado.id
            })
        });

        if (!response.ok) {
            alert('Erro ao iniciar conversa.');
            return;
        }

        const conversa = await response.json();

        conversaId = conversa.id;

        carregarMensagens();

    } catch (error) {
        console.error(error);
        alert('Erro de conexão com o servidor.');
    }
}

/*=============================================================================================
CARREGAR MENSAGENS
=============================================================================================*/
async function carregarMensagens() {
    if (!conversaId) return;

    try {
        const response = await fetch(`${API}/chat/mensagens/${conversaId}`);

        if (!response.ok) {
            alert('Erro ao carregar mensagens.');
            return;
        }

        const mensagens = await response.json();

        renderizarMensagens(mensagens);

    } catch (error) {
        console.error(error);
        alert('Erro ao buscar mensagens.');
    }
}

/*=============================================================================================
RENDERIZAR MENSAGENS
=============================================================================================*/
let mensagensRenderizadas = new Set();

function renderizarMensagens(mensagens) {
    if (!chatMessages) return;

    const mensagemSistema = chatMessages.querySelector('.mensagem-sistema');

    if (mensagemSistema && mensagens.length > 0) {
        mensagemSistema.remove();
    }

    if (!mensagens || mensagens.length === 0) {
        if (!chatMessages.querySelector('.mensagem-sistema')) {
            chatMessages.innerHTML = `
                <div class="mensagem-sistema">
                    Nenhuma mensagem ainda. Envie a primeira resposta.
                </div>
            `;
        }
        return;
    }

    mensagens.forEach(msg => {
        if (mensagensRenderizadas.has(msg.id)) return;

        const div = document.createElement('div');

        div.className = msg.remetenteTipo === 'Profissional'
            ? 'mensagem minha-mensagem'
            : 'mensagem outra-mensagem';

        div.innerHTML = `
            <p>${msg.mensagem}</p>
            <span>${formatarDataHora(msg.dataEnvio)}</span>
        `;

        chatMessages.appendChild(div);
        mensagensRenderizadas.add(msg.id);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/*=============================================================================================
ENVIAR MENSAGEM
=============================================================================================*/
async function enviarMensagem() {
    if (!mensagemTexto) return;

    const texto = mensagemTexto.value.trim();

    if (!texto) {
        alert('Digite uma mensagem.');
        return;
    }

    if (!conversaId) {
        alert('Conversa ainda não foi carregada.');
        return;
    }

    try {
        const response = await fetch(`${API}/chat/mensagem`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversaId: conversaId,
                remetenteTipo: 'Profissional',
                mensagem: texto
            })
        });

        if (!response.ok) {
            alert('Erro ao enviar mensagem.');
            return;
        }

        mensagemTexto.value = '';

        carregarMensagens();

    } catch (error) {
        console.error(error);
        alert('Erro de conexão ao enviar mensagem.');
    }
}

/*=============================================================================================
FORMATAR DATA
=============================================================================================*/
function formatarDataHora(dataString) {
    if (!dataString) return '';

    const data = new Date(dataString);

    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/*=============================================================================================
EVENTOS
=============================================================================================*/
btnEnviarMsg?.addEventListener('click', enviarMensagem);

mensagemTexto?.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
    }
});

/*=============================================================================================
ATUALIZAR AUTOMATICAMENTE
=============================================================================================*/
setInterval(() => {
    carregarMensagens();
}, 3000);

/*=============================================================================================
INICIALIZAÇÃO
=============================================================================================*/
criarOuBuscarConversa();