document.addEventListener('DOMContentLoaded', () => {
    try {
        verificarSessaoEPerfil();
        inicializarEventos();
        
        // Carrega dados conforme a tela
        if (document.getElementById('listaVeiculos')) carregarListaVeiculos();
        
        // Função segura para carregar o select (usada no orçamento e agendamento)
        if (document.getElementById('selectVeiculo')) carregarVeiculosNoSelect();
        
        if (document.getElementById('listaAgendamentos')) carregarListaAgendamentos();
    } catch (e) {
        console.error("Erro crítico na inicialização:", e);
    }
});

/* =========================================
   CATÁLOGO DE PRODUTOS
   ========================================= */
const catalogoOleos = [
    { id: 'mineral', nome: "Mineral 15W40 Lubrax", preco: 35.00 },
    { id: 'semi', nome: "Semissintético 10W40 Shell", preco: 48.00 },
    { id: 'sintetico', nome: "Sintético 5W30 Castrol", preco: 65.00 },
    { id: 'premium', nome: "Sintético Premium 0W20 Motul", preco: 85.00 }
];

/* =========================================
   1. GESTÃO DE SESSÃO
   ========================================= */
function verificarSessaoEPerfil() {
    const path = window.location.pathname;
    const isPublic = path.includes('login') || path.includes('cadastro') || path.includes('recuperar');
    
    const user = localStorage.getItem('usuarioLogado');
    const email = localStorage.getItem('emailLogado');

    if (!user && !isPublic) {
        if (!path.endsWith('login.html') && !path.endsWith('/')) { 
            window.location.href = 'login.html';
        }
        return;
    }

    // Preenche perfil apenas se os elementos existirem
    const displayNome = document.getElementById('displayNome');
    const displayEmail = document.getElementById('displayEmail');
    const avatarLetra = document.getElementById('avatarLetra');
    const btnSair = document.getElementById('btnSair');

    if (displayNome && user) {
        displayNome.textContent = user;
        if(displayEmail) displayEmail.textContent = email || 'Cliente';
        if(avatarLetra) avatarLetra.textContent = user.charAt(0).toUpperCase();
    }

    if (btnSair) {
        // Remove ouvintes anteriores para evitar duplicidade
        const novoBtn = btnSair.cloneNode(true);
        btnSair.parentNode.replaceChild(novoBtn, btnSair);
        novoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if(confirm("Deseja realmente sair?")) {
                localStorage.removeItem('usuarioLogado');
                window.location.href = 'login.html';
            }
        });
    }
}

/* =========================================
   2. INICIALIZAÇÃO DE EVENTOS
   ========================================= */
function inicializarEventos() {
    // Auth
    const formCad = document.getElementById('formCadastro');
    if (formCad) formCad.addEventListener('submit', realizarCadastro);

    const formLog = document.getElementById('formLogin');
    if (formLog) formLog.addEventListener('submit', realizarLogin);

    // Veículos
    const btnAbrir = document.getElementById('btnAbrir');
    if(btnAbrir) btnAbrir.addEventListener('click', () => {
        document.getElementById('formulario').classList.remove('form-hidden');
        document.getElementById('telaAdicionar').style.display = 'none';
        limparCampos();
    });

    const btnCancelar = document.getElementById('btnCancelar');
    if(btnCancelar) btnCancelar.addEventListener('click', () => {
        document.getElementById('formulario').classList.add('form-hidden');
        document.getElementById('telaAdicionar').style.display = 'block';
    });

    const btnSalvar = document.getElementById('btnSalvar');
    if(btnSalvar) btnSalvar.addEventListener('click', salvarVeiculo);
    
    // Orçamento
    const btnOrcamento = document.getElementById('btnGerarOrcamento');
    if(btnOrcamento) btnOrcamento.addEventListener('click', prepararOrcamento);
    
    const selectOleo = document.getElementById('selectOleo');
    if(selectOleo) selectOleo.addEventListener('change', recalcularPreco);

    const inputLitros = document.getElementById('qtdLitros');
    if(inputLitros) inputLitros.addEventListener('input', recalcularPreco);

    // Agendamento
    const btnAgendar = document.getElementById('btnAgendar');
    if(btnAgendar) btnAgendar.addEventListener('click', criarAgendamento);
}

/* =========================================
   3. API E DADOS (Global)
   ========================================= */
const api = {
    get: () => {
        try {
            return JSON.parse(localStorage.getItem('veiculos_db')) || [];
        } catch {
            return [];
        }
    },
    set: (data) => localStorage.setItem('veiculos_db', JSON.stringify(data))
};

/* =========================================
   4. FUNÇÕES DE VEÍCULOS E SELECTS
   ========================================= */
function carregarListaVeiculos() {
    const lista = api.get();
    const container = document.getElementById('listaVeiculos');
    if(!container) return; 

    container.innerHTML = '';
    if (lista.length === 0) container.innerHTML = '<p style="text-align:center">Nenhum veículo cadastrado.</p>';
    
    lista.forEach(v => {
        container.innerHTML += `
        <div class="card-veiculo">
            <h3>${v.marca || 'Marca'} ${v.modelo || 'Modelo'}</h3>
            <p><strong>Ano:</strong> ${v.ano || '----'} | <strong>KM:</strong> ${v.km || '0'}</p>
            <div class="botoes-card">
                <button class="btn-editar" onclick="editar(${v.id})">Editar</button>
                <button class="btn-excluir" onclick="excluir(${v.id})">Excluir</button>
            </div>
        </div>`;
    });
}

function salvarVeiculo() {
    const id = document.getElementById('veiculoId').value;
    const marca = document.getElementById('marca').value;
    const modelo = document.getElementById('modelo').value;
    const ano = document.getElementById('ano').value;
    const km = document.getElementById('km').value;

    if (!marca || !modelo) return alert("Preencha Marca e Modelo!");

    let dados = api.get();
    if (id) {
        const idx = dados.findIndex(v => v.id == id);
        if (idx !== -1) dados[idx] = { id: Number(id), marca, modelo, ano, km };
    } else {
        dados.push({ id: Date.now(), marca, modelo, ano, km });
    }
    api.set(dados);
    carregarListaVeiculos();
    
    // Fecha form
    document.getElementById('formulario').classList.add('form-hidden');
    document.getElementById('telaAdicionar').style.display = 'block';
    limparCampos();
}

function carregarVeiculosNoSelect() {
    const select = document.getElementById('selectVeiculo');
    if(!select) return;
    
    select.innerHTML = '<option value="">-- Selecione seu veículo --</option>'; 
    
    const veiculos = api.get();
    
    if(veiculos.length === 0) {
        const opt = document.createElement('option');
        opt.text = "Nenhum veículo cadastrado";
        select.add(opt);
        select.disabled = true;
        return;
    }
    
    select.disabled = false;
    veiculos.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.text = `${v.marca} ${v.modelo}`;
        
        // Proteção contra dados vazios para evitar erro no toLowerCase()
        opt.dataset.marca = (v.marca || "").toLowerCase();
        opt.dataset.ano = v.ano || 2020;
        select.add(opt);
    });
}

/* =========================================
   5. ORÇAMENTO
   ========================================= */
function prepararOrcamento() {
    const selectVeiculo = document.getElementById('selectVeiculo');
    
    // Proteção: se não selecionou nada
    if (!selectVeiculo || !selectVeiculo.value) return alert("Selecione um veículo primeiro!");

    // Proteção: tenta pegar a opção selecionada
    const opt = selectVeiculo.options[selectVeiculo.selectedIndex];
    if(!opt) return;

    const marca = opt.dataset.marca || "";
    const ano = parseInt(opt.dataset.ano) || 2020;

    let idRecomendado;
    if (marca.includes('honda') || marca.includes('toyota')) idRecomendado = 'premium';
    else if (marca.includes('vw') || marca.includes('fiat') || marca.includes('ford')) idRecomendado = (ano < 2010) ? 'semi' : 'sintetico';
    else if (ano < 2005) idRecomendado = 'mineral';
    else idRecomendado = 'semi';

    const selectOleo = document.getElementById('selectOleo');
    if(!selectOleo) return; 

    selectOleo.innerHTML = ''; 
    catalogoOleos.forEach(oleo => {
        const option = document.createElement('option');
        option.value = oleo.id;
        option.text = `${oleo.nome} (R$ ${oleo.preco.toFixed(2)}/L)`;
        if (oleo.id === idRecomendado) {
            option.selected = true;
            option.text += " ⭐ Recomendado";
        }
        selectOleo.add(option);
    });

    const inputFiltro = document.getElementById('filtroRec');
    if(inputFiltro) inputFiltro.value = `Filtro TecFil (${ano})`;
    
    const nomeRecomendado = catalogoOleos.find(o => o.id === idRecomendado).nome;
    const aviso = document.getElementById('avisoRecomendacao');
    if(aviso) aviso.innerText = `✅ O sistema selecionou: ${nomeRecomendado}`;

    const inputLitros = document.getElementById('qtdLitros');
    if(inputLitros) inputLitros.value = 4;

    recalcularPreco();
    
    const resultado = document.getElementById('resultadoOrcamento');
    if(resultado) resultado.classList.remove('hidden');
}

function recalcularPreco() {
    const selectOleo = document.getElementById('selectOleo');
    const inputLitros = document.getElementById('qtdLitros');
    
    if(!selectOleo || !inputLitros) return;

    const idSelecionado = selectOleo.value;
    const qtdLitros = inputLitros.value;
    
    const oleo = catalogoOleos.find(o => o.id === idSelecionado);
    
    if (oleo && qtdLitros > 0) {
        const total = (oleo.preco * qtdLitros) + 35.00;
        
        const displayLitro = document.getElementById('precoLitroDisplay');
        if(displayLitro) displayLitro.innerText = `R$ ${oleo.preco.toFixed(2)}`;
        
        const displayTotal = document.getElementById('valorTotal');
        if(displayTotal) displayTotal.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
        
        const aviso = document.getElementById('avisoRecomendacao');
        if(aviso) {
            const textoOpcao = selectOleo.options[selectOleo.selectedIndex].text;
            if (!textoOpcao.includes('Recomendado')) {
                aviso.innerText = "⚠ Você escolheu uma opção diferente da recomendada.";
                aviso.style.color = "#d93025";
            } else {
                aviso.innerText = "✅ Excelente escolha baseada na montadora.";
                aviso.style.color = "#28a745";
            }
        }
    }
}

/* =========================================
   6. AGENDAMENTO
   ========================================= */
function criarAgendamento() {
    const selectV = document.getElementById('selectVeiculo');
    const selectS = document.getElementById('selectServico');
    const inputData = document.getElementById('dataAgendamento');
    const inputHora = document.getElementById('horaAgendamento');

    if(!selectV || !selectV.value) return alert("Selecione um veículo!");
    if(!inputData.value || !inputHora.value) return alert("Preencha data e hora!");

    // Proteção ao pegar o texto do select
    let veiculoTexto = "Veículo Desconhecido";
    if (selectV.selectedIndex >= 0) {
        veiculoTexto = selectV.options[selectV.selectedIndex].text;
    }

    const agendamentos = JSON.parse(localStorage.getItem('agendamentos_db')) || [];
    const novo = {
        id: Date.now(),
        veiculo: veiculoTexto,
        servico: selectS.value,
        data: inputData.value,
        hora: inputHora.value,
        status: 'Pendente'
    };

    agendamentos.push(novo);
    localStorage.setItem('agendamentos_db', JSON.stringify(agendamentos));
    alert("Agendamento realizado!");
    
    inputData.value = '';
    inputHora.value = '';
    
    carregarListaAgendamentos();
}

function carregarListaAgendamentos() {
    const container = document.getElementById('listaAgendamentos');
    if(!container) return;
    
    const agendamentos = JSON.parse(localStorage.getItem('agendamentos_db')) || [];
    container.innerHTML = '';

    if(agendamentos.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#777;">Sem agendamentos.</p>';
        return;
    }
    // Ordenar (proteção contra data inválida)
    agendamentos.sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0));

    agendamentos.forEach(a => {
        let dataFormatada = a.data;
        if(a.data) dataFormatada = a.data.split('-').reverse().join('/');
        
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '15px';
        card.style.borderLeft = '6px solid #ffc107'; 
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="margin:0 0 5px 0; color:#333;">${dataFormatada} às ${a.hora}</h3>
                    <p style="margin:0; color:#555;"><strong>${a.veiculo}</strong></p>
                    <p style="margin:0; font-size:14px; color:#777;">${a.servico}</p>
                </div>
                <div style="text-align:right;">
                    <span style="background:#fff3cd; color:#856404; padding:5px 10px; border-radius:15px; font-size:12px; font-weight:bold;">${a.status}</span>
                    <br>
                    <button onclick="cancelarAgendamento(${a.id})" style="color:#d93025; background:none; border:none; cursor:pointer; font-size:12px; margin-top:10px; text-decoration:underline;">Cancelar</button>
                </div>
            </div>`;
        container.appendChild(card);
    });
}

window.cancelarAgendamento = function(id) {
    if(!confirm("Cancelar agendamento?")) return;
    let agendamentos = JSON.parse(localStorage.getItem('agendamentos_db')) || [];
    agendamentos = agendamentos.filter(a => a.id != id);
    localStorage.setItem('agendamentos_db', JSON.stringify(agendamentos));
    carregarListaAgendamentos();
};

/* =========================================
   7. UTILITÁRIOS E AUTH
   ========================================= */
function realizarCadastro(e) {
    e.preventDefault();
    const nome = document.getElementById('nomeCadastro').value;
    const email = document.getElementById('emailCadastro').value;
    const senha = document.getElementById('senhaCadastro').value;
    const conf = document.getElementById('confirmaSenha').value;

    if (senha !== conf) return alert("Senhas não conferem!");
    
    const db = JSON.parse(localStorage.getItem('users_db')) || [];
    if (db.find(u => u.email === email)) return alert("E-mail já existe!");

    db.push({ nome, email, senha });
    localStorage.setItem('users_db', JSON.stringify(db));
    alert("Cadastro realizado! Faça login.");
    window.location.href = 'login.html';
}

function realizarLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    const db = JSON.parse(localStorage.getItem('users_db')) || [];
    const user = db.find(u => u.email === email && u.senha === senha);

    if (user || (email === 'admin@email.com' && senha === '123')) {
        const nomeFinal = user ? user.nome : 'Administrador';
        const emailFinal = user ? user.email : 'admin@email.com';
        
        localStorage.setItem('usuarioLogado', nomeFinal);
        localStorage.setItem('emailLogado', emailFinal);
        window.location.href = 'dashboard.html';
    } else {
        alert("E-mail ou senha incorretos.");
    }
}

// Funções globais de edição/exclusão (Necessárias para o HTML chamar onclick)
window.editar = function(id) {
    const v = api.get().find(x => x.id == id);
    if(v) {
        document.getElementById('veiculoId').value = v.id;
        document.getElementById('marca').value = v.marca;
        document.getElementById('modelo').value = v.modelo;
        document.getElementById('ano').value = v.ano;
        document.getElementById('km').value = v.km;
        
        // Abre e muda o título
        document.getElementById('formulario').classList.remove('form-hidden');
        document.getElementById('telaAdicionar').style.display = 'none';
        document.getElementById('tituloFormulario').textContent = 'Editar Veículo';
    }
};

window.excluir = function(id) {
    if(confirm("Tem certeza que deseja excluir?")) {
        const dados = api.get().filter(x => x.id != id);
        api.set(dados);
        carregarListaVeiculos();
    }
};

function limparCampos() {
    const ids = ['veiculoId', 'marca', 'modelo', 'ano', 'km'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    const titulo = document.getElementById('tituloFormulario');
    if(titulo) titulo.textContent = 'Cadastrar Veículo';
}