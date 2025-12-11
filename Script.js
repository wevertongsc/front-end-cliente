document.addEventListener('DOMContentLoaded', () => {
  inicializarEventos();
  carregarListaVeiculos();
});

// --- API SIMULADA (MOCK) ---
// Quando seus amigos terminarem o Back-End, você substituirá ESTA PARTE por fetch()
const apiSimulada = {
  // Simula um "GET /veiculos"
  listar: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        const dados = JSON.parse(localStorage.getItem('veiculos_db')) || [];
        resolve(dados);
      }, 600); // Delay de 600ms para parecer real
    });
  },

  // Simula um "POST /veiculos"
  criar: (veiculo) => {
    return new Promise(resolve => {
      setTimeout(() => {
        const dados = JSON.parse(localStorage.getItem('veiculos_db')) || [];
        const novoVeiculo = { ...veiculo, id: Date.now() }; // Gera ID aleatório
        dados.push(novoVeiculo);
        localStorage.setItem('veiculos_db', JSON.stringify(dados));
        resolve(novoVeiculo);
      }, 600);
    });
  },

  // Simula um "PUT /veiculos/:id"
  atualizar: (id, veiculoAtualizado) => {
    return new Promise(resolve => {
      setTimeout(() => {
        let dados = JSON.parse(localStorage.getItem('veiculos_db')) || [];
        const index = dados.findIndex(v => v.id == id);
        if (index !== -1) {
          dados[index] = { ...veiculoAtualizado, id: Number(id) };
          localStorage.setItem('veiculos_db', JSON.stringify(dados));
        }
        resolve(true);
      }, 600);
    });
  },

  // Simula um "DELETE /veiculos/:id"
  excluir: (id) => {
    return new Promise(resolve => {
      setTimeout(() => {
        let dados = JSON.parse(localStorage.getItem('veiculos_db')) || [];
        dados = dados.filter(v => v.id != id);
        localStorage.setItem('veiculos_db', JSON.stringify(dados));
        resolve(true);
      }, 600);
    });
  }
};

// --- LÓGICA DO FRONT-END ---

function inicializarEventos() {
  document.getElementById('btnAbrir').addEventListener('click', abrirFormularioParaCriar);
  document.getElementById('btnCancelar').addEventListener('click', fecharFormulario);
  document.getElementById('btnSalvar').addEventListener('click', salvarVeiculo);
}

// Variável para armazenar a lista localmente para renderização rápida
let listaLocalVeiculos = [];

async function carregarListaVeiculos() {
  mostrarLoading(true);
  try {
    // Chama a API (simulada)
    listaLocalVeiculos = await apiSimulada.listar();
    renderizarLista(listaLocalVeiculos);
  } catch (error) {
    alert("Erro ao carregar veículos.");
    console.error(error);
  } finally {
    mostrarLoading(false);
  }
}

function renderizarLista(lista) {
  const container = document.getElementById('listaVeiculos');
  container.innerHTML = '';

  if (lista.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#777;">Nenhum veículo cadastrado.</p>';
    return;
  }

  lista.forEach(v => {
    const proximaTroca = Number(v.km) + 10000; // Regra de Negócio: Troca a cada 10k
    
    const card = document.createElement('div');
    card.className = 'card-veiculo';
    card.innerHTML = `
      <h3>${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}</h3>
      <p><strong>Ano:</strong> ${escapeHtml(v.ano)}</p>
      <p><strong>KM Atual:</strong> ${escapeHtml(v.km)} km</p>
      <p class="info-troca">Próxima troca: ${proximaTroca} km</p>
      
      <div class="botoes-card">
        <button class="btn-editar" onclick="prepararEdicao(${v.id})">Editar</button>
        <button class="btn-excluir" onclick="confirmarExclusao(${v.id})">Excluir</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function salvarVeiculo() {
  const id = document.getElementById('veiculoId').value;
  const marca = document.getElementById('marca').value.trim();
  const modelo = document.getElementById('modelo').value.trim();
  const ano = document.getElementById('ano').value;
  const km = document.getElementById('km').value;

  if (!marca || !modelo || !ano || !km) {
    alert('Preencha todos os campos!');
    return;
  }

  const veiculoDados = { marca, modelo, ano, km };

  mostrarLoading(true);
  
  try {
    if (id) {
      // Editar existente
      await apiSimulada.atualizar(id, veiculoDados);
    } else {
      // Criar novo
      await apiSimulada.criar(veiculoDados);
    }
    
    await carregarListaVeiculos(); // Recarrega a lista
    fecharFormulario();
    
  } catch (error) {
    alert('Erro ao salvar.');
  } finally {
    mostrarLoading(false);
  }
}

window.confirmarExclusao = async function(id) {
  if (!confirm('Tem certeza que deseja remover este veículo?')) return;
  
  mostrarLoading(true);
  try {
    await apiSimulada.excluir(id);
    await carregarListaVeiculos();
  } catch (error) {
    alert('Erro ao excluir.');
  } finally {
    mostrarLoading(false);
  }
};

window.prepararEdicao = function(id) {
  const veiculo = listaLocalVeiculos.find(v => v.id == id);
  if (!veiculo) return;

  document.getElementById('veiculoId').value = veiculo.id;
  document.getElementById('marca').value = veiculo.marca;
  document.getElementById('modelo').value = veiculo.modelo;
  document.getElementById('ano').value = veiculo.ano;
  document.getElementById('km').value = veiculo.km;

  document.getElementById('tituloFormulario').textContent = 'Editar Veículo';
  document.getElementById('btnSalvar').textContent = 'Atualizar';
  
  abrirFormulario();
};

function abrirFormularioParaCriar() {
  limparCampos();
  document.getElementById('tituloFormulario').textContent = 'Cadastrar Veículo';
  document.getElementById('btnSalvar').textContent = 'Salvar';
  abrirFormulario();
}

function abrirFormulario() {
  document.getElementById('formulario').classList.remove('form-hidden');
  document.getElementById('telaAdicionar').style.display = 'none';
}

function fecharFormulario() {
  document.getElementById('formulario').classList.add('form-hidden');
  document.getElementById('telaAdicionar').style.display = 'block';
  limparCampos();
}

function limparCampos() {
  document.getElementById('veiculoId').value = '';
  document.getElementById('marca').value = '';
  document.getElementById('modelo').value = '';
  document.getElementById('ano').value = '';
  document.getElementById('km').value = '';
}

function mostrarLoading(show) {
  const loader = document.getElementById('loading');
  if (show) loader.classList.remove('hidden');
  else loader.classList.add('hidden');
}

function escapeHtml(text) {
  if(!text) return text;
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}