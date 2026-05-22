/*=============================================================================================
  PERFIL DO PROFISSIONAL
  Carrega os dados do profissional logado e gerencia o modo de edição.
=============================================================================================*/

document.addEventListener('DOMContentLoaded', function () {

    const API_BASE = 'http://localhost:8080';

    /*=============================================================================================
    RECUPERAR USUÁRIO DA SESSÃO
    =============================================================================================*/
    const usuarioSessao = JSON.parse(sessionStorage.getItem('usuario'));

    if (!usuarioSessao || usuarioSessao.tipo !== 'Profissional') {
        alert('Sessão inválida. Faça login novamente.');
        window.location.href = 'index.html';
        return;
    }

    /*=============================================================================================
    REFERÊNCIAS AOS CAMPOS DO FORMULÁRIO
    =============================================================================================*/
    const campos = {
        nome:       document.getElementById('perfilNome'),
        nascimento: document.getElementById('perfilNascimento'),
        sexo:       document.getElementById('perfilSexo'),
        email:      document.getElementById('perfilEmail'),
        cpf:        document.getElementById('perfilCpf'),
        area:       document.getElementById('perfilArea'),
        documento:  document.getElementById('perfilDocumento'),
        senha:      document.getElementById('perfilSenha'),
    };

    const documentoLabel = document.getElementById('documentoLabel');
    const btnEditar       = document.getElementById('btnEditar');
    const btnCancelar     = document.getElementById('btnCancelar');
    const formActions     = document.getElementById('formActions');
    const formPerfil      = document.getElementById('formPerfil');

    // Guarda os valores originais para poder cancelar a edição
    let dadosOriginais = {};

    if (campos.nascimento) {
        aplicarMascaraData(campos.nascimento);
    }

    /*=============================================================================================
    MAPA: área profissional → label do documento
    =============================================================================================*/
    const documentosPorArea = {
        Nutricionista:     'CRN',
        Fisioterapeuta:    'CREFITO',
        'Personal Trainer': 'CREF',
    };

    function atualizarLabelDocumento(area) {
        if (documentoLabel) {
            documentoLabel.innerText = documentosPorArea[area] || 'Documento Profissional';
        }
    }

    /*=============================================================================================
    FORMATAR DATA: converte "YYYY-MM-DD" → "DD/MM/YYYY"
    =============================================================================================*/
    function formatarDataParaExibicao(dataISO) {
        if (!dataISO) return '';
        // Suporta tanto "YYYY-MM-DD" quanto "YYYY-MM-DDTHH:mm:ss"
        const parte = dataISO.split('T')[0];
        const [ano, mes, dia] = parte.split('-');
        if (!ano || !mes || !dia) return dataISO;
        return `${dia}/${mes}/${ano}`;
    }

    /*=============================================================================================
    FORMATAR DATA: converte "DD/MM/YYYY" → "YYYY-MM-DD" (para enviar à API)
    =============================================================================================*/
    function formatarDataParaAPI(dataBR) {
        if (!dataBR) return null;
        const [dia, mes, ano] = dataBR.split('/');
        if (!dia || !mes || !ano) return null;
        return `${ano}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`;
    }

    /*=============================================================================================
    APLICAR MÁSCARA DE CPF (somente leitura, apenas para exibição)
    =============================================================================================*/
    function mascararCPF(cpf) {
        const s = cpf.replace(/\D/g, '');
        if (s.length !== 11) return cpf;
        return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    function aplicarMascaraData(input) {

        input.addEventListener('input', function () {

            let valor = input.value.replace(/\D/g, '');

            if (valor.length > 2) {
                valor = valor.substring(0, 2) + '/' + valor.substring(2);
            }

            if (valor.length > 5) {
                valor = valor.substring(0, 5) + '/' + valor.substring(5, 9);
            }

            input.value = valor.substring(0, 10);

            input.classList.remove('erro');
        });

        input.addEventListener('blur', function () {

            if (
                input.value &&
                !validarData(input.value)
            ) {
                input.classList.add('erro');
            }
        });
    }

    function validarData(data) {

        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

        if (!regex.test(data)) return false;

        const [dia, mes, ano] = data.split('/').map(Number);

        if (ano < 1900 || ano > new Date().getFullYear()) {
            return false;
        }

        if (mes < 1 || mes > 12) {
            return false;
        }

        const dataObj = new Date(ano, mes - 1, dia);

        return (
            dataObj.getFullYear() === ano &&
            dataObj.getMonth() === mes - 1 &&
            dataObj.getDate() === dia
        );
    }

    /*=============================================================================================
    PREENCHER OS CAMPOS COM OS DADOS RECEBIDOS DA API
    =============================================================================================*/
    function preencherFormulario(dados) {
        if (campos.nome) campos.nome.value = dados.nomeCompleto || '';
        if (campos.nascimento) campos.nascimento.value = formatarDataParaExibicao(dados.dataNascimento);
        if (campos.email) campos.email.value = dados.email || '';
        if (campos.cpf) campos.cpf.value = mascararCPF(dados.cpf || '');
        if (campos.documento) campos.documento.value = dados.documentoProfissional || '';

        if (campos.sexo && dados.sexo) {
            campos.sexo.value = dados.sexo;
        }

        if (campos.area && dados.areaProfissional) {
            campos.area.value = dados.areaProfissional;
            atualizarLabelDocumento(dados.areaProfissional);
        }

        // Salva cópia para restaurar ao cancelar
        dadosOriginais = {
            nomeCompleto: campos.nome?.value || '',
            dataNascimento: campos.nascimento?.value || '',
            sexo: campos.sexo?.value || '',
            email: campos.email?.value || '',
            cpf: campos.cpf?.value || '',
            areaProfissional: campos.area?.value || '',
            documentoProfissional: campos.documento?.value || '',
        };
    }

    /*=============================================================================================
    BUSCAR DADOS DO PROFISSIONAL NA API
    =============================================================================================*/
    async function carregarDados() {
        try {
            const response = await fetch(`${API_BASE}/profissionais/${usuarioSessao.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const profissional = await response.json();
                preencherFormulario(profissional);
            } else {
                alert('Não foi possível carregar os dados do perfil.');
            }

        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            alert('Erro de conexão com o servidor. Verifique se a API está rodando.');
        }
    }

    /*=============================================================================================
    HABILITAR MODO DE EDIÇÃO
    =============================================================================================*/
    function ativarEdicao() {
        Object.values(campos).forEach(campo => {
            if (campo) campo.disabled = false;
        });

        // CPF nunca pode ser editado
        if (campos.cpf) campos.cpf.disabled = true;

        formActions?.classList.remove('hidden');
        btnEditar?.classList.add('hidden');
    }

    /*=============================================================================================
    DESABILITAR MODO DE EDIÇÃO (cancelar ou após salvar)
    =============================================================================================*/
    function desativarEdicao() {
        Object.values(campos).forEach(campo => {
            if (campo) campo.disabled = true;
        });

        formActions?.classList.add('hidden');
        btnEditar?.classList.remove('hidden');

        // Limpa campo de senha sempre que sai do modo edição
        if (campos.senha) campos.senha.value = '';
    }

    /*=============================================================================================
    RESTAURAR VALORES ORIGINAIS (ao cancelar)
    =============================================================================================*/
    function restaurarDados() {
        if (campos.nome) campos.nome.value = dadosOriginais.nomeCompleto;
        if (campos.nascimento) campos.nascimento.value = dadosOriginais.dataNascimento;
        if (campos.email) campos.email.value = dadosOriginais.email;
        if (campos.cpf) campos.cpf.value = dadosOriginais.cpf;
        if (campos.area) campos.area.value = dadosOriginais.areaProfissional;
        if (campos.documento) campos.documento.value = dadosOriginais.documentoProfissional;
        if (campos.sexo) campos.sexo.value = dadosOriginais.sexo;

        atualizarLabelDocumento(dadosOriginais.areaProfissional);
    }

    /*=============================================================================================
    ATUALIZAR LABEL DO DOCUMENTO AO MUDAR A ÁREA (somente no modo edição)
    =============================================================================================*/
    if (campos.area) {
        campos.area.addEventListener('change', () => {
            atualizarLabelDocumento(campos.area.value);
        });
    }

    /*=============================================================================================
    BOTÃO EDITAR
    =============================================================================================*/
    if (btnEditar) {
        btnEditar.addEventListener('click', ativarEdicao);
    }

    /*=============================================================================================
    BOTÃO CANCELAR
    =============================================================================================*/
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            restaurarDados();
            desativarEdicao();
        });
    }

    /*=============================================================================================
    SALVAR ALTERAÇÕES
    =============================================================================================*/
    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();

            const novaSenha = campos.senha?.value?.trim();

            if (campos.nascimento?.value && !validarData(campos.nascimento.value)) {
                campos.nascimento.classList.add('erro');
                alert('Data de nascimento inválida.');
                return;
            }

            const dados = {
                nomeCompleto:          campos.nome?.value      || undefined,
                dataNascimento:        formatarDataParaAPI(campos.nascimento?.value) || undefined,
                sexo:                  campos.sexo?.value      || undefined,
                email:                 campos.email?.value     || undefined,
                areaProfissional:      campos.area?.value      || undefined,
                documentoProfissional: campos.documento?.value || undefined,
            };

            // Só envia a senha se o usuário digitou algo
            if (novaSenha) {
                dados.senha = novaSenha;
            }

            try {
                const response = await fetch(`${API_BASE}/profissionais/${usuarioSessao.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados),
                });

                if (response.ok) {
                    const profissionalAtualizado = await response.json();

                    alert('Dados atualizados com sucesso!');

                    preencherFormulario(profissionalAtualizado);
                    desativarEdicao();

                    // Atualiza o nome na sessão caso tenha mudado
                    usuarioSessao.nome = profissionalAtualizado.nomeCompleto;
                    sessionStorage.setItem('usuario', JSON.stringify(usuarioSessao));

                } else {
                    const erro = await response.text();
                    alert(`Erro ao salvar: ${erro}`);
                }

            } catch (error) {
                console.error('Erro ao salvar perfil:', error);
                alert('Erro de conexão com o servidor.');
            }
        });
    }

    /*=============================================================================================
    INICIALIZAR: carrega os dados ao abrir a página
    =============================================================================================*/
    carregarDados();
});