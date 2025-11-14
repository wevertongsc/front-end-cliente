
document.addEventListener('DOMContentLoaded', () => {
  const btnAbrir = document.getElementById('btnAbrir');
  const btnSalvar = document.getElementById('btnSalvar');
  const btnCancelar = document.getElementById('btnCancelar');

  btnAbrir.addEventListener('click', abrirFormulario);
  btnCancelar.addEventListener('click', fecharFormulario);
  btnSalvar.addEventListener('click', salvarVeiculo);

  window.veiculos = [];
  window.editIndex = null;
  atualizarLista();
});

function abrirFormulario() {
  document.getElementById('formulario').classList.remove('form-hidden');
  document.getElementById('telaAdicionar').style.display = 'none';
  document.getElementById('btnSalvar').textContent = 'Salvar';
}

function fecharFormulario() {
  document.getElementById('formulario').classList.add('form-hidden');
  document.getElementById('telaAdicionar').style.display = 'block';
  limparCampos();
  window.editIndex = null;
}

function salvarVeiculo() {
  const marca = document.getElementById('marca').value.trim();
  const modelo = document.getElementById('modelo').value.trim();
  const ano = document.getElementById('ano').value.trim();
  const km = document.getElementById('km').value.trim();

  if (!marca || !modelo || !ano || !km) {
    alert('Preencha todos os campos!');
    return;
  }

  const dados = { marca, modelo, ano, km };

  if (window.editIndex !== null && window.editIndex !== undefined) {
    window.veiculos[window.editIndex] = dados;
  } else {
    window.veiculos.push(dados);
  }

  atualizarLista();
  fecharFormulario();
}

function atualizarLista() {
  const lista = document.getElementById('listaVeiculos');
  lista.innerHTML = '';

  (window.veiculos || []).forEach((v, i) => {
    const card = document.createElement('div');
    card.className = 'card-veiculo';

    card.innerHTML = `
      <h3>${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}</h3>
      <p><strong>Ano:</strong> ${escapeHtml(v.ano)}</p>
      <p><strong>KM:</strong> ${escapeHtml(v.km)} km</p>
      <div class="botoes-card">
        <button class="btn-editar" data-index="${i}">Editar</button>
        <button class="btn-excluir" data-index="${i}">Excluir</button>
      </div>
    `;

    lista.appendChild(card);
  });

  lista.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.getAttribute('data-index'));
      editarVeiculo(idx);
    });
  });
  lista.querySelectorAll('.btn-excluir').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.getAttribute('data-index'));
      excluirVeiculo(idx);
    });
  });
}

function editarVeiculo(i) {
  const v = window.veiculos[i];
  document.getElementById('marca').value = v.marca;
  document.getElementById('modelo').value = v.modelo;
  document.getElementById('ano').value = v.ano;
  document.getElementById('km').value = v.km;

  window.editIndex = i;
  document.getElementById('btnSalvar').textContent = 'Atualizar';
  abrirFormulario();
}

function excluirVeiculo(i) {
  if (!confirm('Deseja remover este veículo?')) return;
  window.veiculos.splice(i, 1);
  atualizarLista();
}

function limparCampos() {
  document.getElementById('marca').value = '';
  document.getElementById('modelo').value = '';
  document.getElementById('ano').value = '';
  document.getElementById('km').value = '';
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
