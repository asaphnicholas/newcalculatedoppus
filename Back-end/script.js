// Função para adicionar máscara de moeda
function mascaraMoeda(event) {
  let value = event.target.value.replace(/\D/g, "");
  value = (value / 100).toFixed(2) + "";
  value = value.replace(".", ",");
  event.target.value = "R$ " + value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Adiciona evento de máscara aos inputs de valor monetário
document
  .getElementById("faturamento_medio")
  .addEventListener("input", mascaraMoeda);
document.getElementById("ticket_medio").addEventListener("input", mascaraMoeda);
document
  .getElementById("valor_por_transacao")
  .addEventListener("input", mascaraMoeda);

function converteParaFloat(valor) {
  return parseFloat(
    valor.replace("R$", "").replace(/\./g, "").replace(",", ".")
  );
}

// Abre o modal ao clicar em "Calcular"
// function openModal() {
//   const formulario = document.getElementById("calculatorForm");

//   if (formulario.checkValidity()) {
//     // Exibe o pop-up se todos os campos estiverem preenchidos
//     document.getElementById("modal").style.display = "flex";
//   } else {
//     // Exibe uma mensagem de alerta caso algum campo esteja vazio
//     alert("Por favor, preencha todos os campos antes de enviar.");
//   }
// }

// Função para adicionar máscara ao campo de telefone
function aplicarMascaraTelefone(input) {
  input.addEventListener("input", function () {
    let valor = input.value.replace(/\D/g, ""); // Remove qualquer caractere que não seja número

    if (valor.length > 10) {
      // Formato (00) 00000-0000
      valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (valor.length > 5) {
      // Formato (00) 0000-0000
      valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (valor.length > 2) {
      // Formato (00) 0000
      valor = valor.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else {
      // Formato (00
      valor = valor.replace(/^(\d{0,2})/, "($1");
    }

    input.value = valor;
  });
}

// Aplica a máscara ao campo de telefone no popup
const campoTelefone = document.getElementById("phone");
if (campoTelefone) {
  aplicarMascaraTelefone(campoTelefone);
}

// Calculo dos inputs

let lucroAproximadoGlobal = 0;

// Função principal da calculadora
function calculadoraTransacoes(
  faturamentoMedio,
  ticketMedio,
  percentualPix,
  percentualBoleto,
  percentualPlataformaPixBoleto,
  percentualPlataformaCartao,
  valorPorTransacao
) {
  // Calculando os valores separados por tipo de transação
  const valorPix = faturamentoMedio * (percentualPix / 100);
  const valorBoleto = faturamentoMedio * (percentualBoleto / 100);
  const valorCartao = faturamentoMedio - (valorPix + valorBoleto);

  // Calculando o número de transações
  const transacoesPix = valorPix / ticketMedio;
  const transacoesBoleto = valorBoleto / ticketMedio;
  const transoesCartao = valorCartao / ticketMedio;
  const transoesTotal = transacoesPix + transacoesBoleto + transoesCartao;

  // Tabela de porcentagens de adquirente por parcela
  const taxaAdquirente = {
    1: 0.0308,
    2: 0.0535,
    3: 0.0619,
    4: 0.0702,
    5: 0.0744,
    6: 0.0787,
    7: 0.0815,
    8: 0.0892,
    9: 0.0968,
    10: 0.1066,
    11: 0.1114,
    12: 0.1169,
  };

  // Calculando a tabela de parcelas com juros e taxas
  const resultados = [];
  const subtotal = valorCartao / 12;
  const taxaJuros = 0.0299;

  for (let parcela = 1; parcela <= 12; parcela++) {
    let valorJuros = 0;
    if (parcela > 1) {
      valorJuros =
        ((subtotal * taxaJuros) / (1 - Math.pow(1 + taxaJuros, -parcela))) *
          parcela -
        subtotal;
    }

    const totalPagoValor = subtotal + valorJuros;
    const taxaPlataforma = totalPagoValor * (percentualPlataformaCartao / 100);
    const taxaTransacao = (transoesCartao / 12) * valorPorTransacao;
    const taxaAdquirenteParcela = taxaAdquirente[parcela];
    const valorAdquirente = totalPagoValor * taxaAdquirenteParcela;
    const produtorDoppus = subtotal - taxaPlataforma - taxaTransacao;
    const produtorAdquirente = totalPagoValor - valorAdquirente;

    resultados.push({
      parcela,
      subtotal,
      valorJuros,
      totalPago: totalPagoValor,
      taxaPlataforma,
      taxaTransacao,
      valorAdquirente,
      produtorDoppus,
      produtorAdquirente,
    });
  }

  const custoAtual =
    (valorBoleto + valorPix) * (percentualPlataformaPixBoleto / 100) +
    valorCartao * (percentualPlataformaCartao / 100) +
    transoesTotal * valorPorTransacao;

  let custoNovo;
  if (transoesTotal <= 100) {
    custoNovo = 179.9 + transoesTotal * 1.69;
  } else if (transoesTotal <= 500) {
    custoNovo = 347.9 + transoesTotal * 1.49;
  } else if (transoesTotal <= 1000) {
    custoNovo = 874.9 + transoesTotal * 1.29;
  } else if (transoesTotal <= 5000) {
    custoNovo = 2970.9 + transoesTotal * 1.09;
  } else {
    custoNovo = 5790.9 + transoesTotal * 0.89;
  }

  const taxaBoletoPixAdquirente =
    valorPix * 0.0399 +
    transacoesPix * 0.99 +
    (valorBoleto * 0.0399 + transacoesBoleto * 3.49);

  const aumentoFaturamento =
    resultados.reduce((sum, r) => sum + r.produtorAdquirente, 0) -
    resultados.reduce((sum, r) => sum + r.produtorDoppus, 0) -
    taxaBoletoPixAdquirente;

  const custoFinal = custoNovo + taxaBoletoPixAdquirente - aumentoFaturamento;
  const lucroAproximado = (custoAtual - custoFinal) * 12;

  return {
    resultados,
    custoAtual,
    custoNovo,
    aumentoFaturamento,
    taxaBoletoPixAdquirente,
    custoFinal,
    lucroAproximado,
  };
}

// Função para formatar números em formato brasileiro
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Função para criar a tabela de resultados
function criarTabelaResultados(resultados) {
  let html = `
          <table>
              <tr>
                  <th>Parcela</th>
                  <th>Subtotal</th>
                  <th>Valor Juros</th>
                  <th>Total Pago</th>
                  <th>Taxa Plataforma</th>
                  <th>Taxa Transação</th>
                  <th>Valor Adquirente</th>
                  <th>Produtor Doppus</th>
                  <th>Produtor Adquirente</th>
              </tr>
      `;

  resultados.forEach((r) => {
    html += `
              <tr>
                  <td>${r.parcela}</td>
                  <td>${formatarMoeda(r.subtotal)}</td>
                  <td>${formatarMoeda(r.valorJuros)}</td>
                  <td>${formatarMoeda(r.totalPago)}</td>
                  <td>${formatarMoeda(r.taxaPlataforma)}</td>
                  <td>${formatarMoeda(r.taxaTransacao)}</td>
                  <td>${formatarMoeda(r.valorAdquirente)}</td>
                  <td>${formatarMoeda(r.produtorDoppus)}</td>
                  <td>${formatarMoeda(r.produtorAdquirente)}</td>
              </tr>
          `;
  });

  html += "</table>";
  return html;
}

// Event listener para o formulário
document
  .getElementById("calculatorForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    // Obtendo os valores dos inputs
    const faturamentoMedio = converteParaFloat(
      document.getElementById("faturamento_medio").value
    );
    const ticketMedio = converteParaFloat(
      document.getElementById("ticket_medio").value
    );
    const percentualPix = converteParaFloat(
      document.getElementById("percentual_pix").value
    );
    const percentualBoleto = converteParaFloat(
      document.getElementById("percentual_boleto").value
    );
    const percentualPlataformaPixBoleto = converteParaFloat(
      document.getElementById("percentual_plataforma_pix_boleto").value
    );
    const percentualPlataformaCartao = converteParaFloat(
      document.getElementById("percentual_plataforma_cartao").value
    );
    const valorPorTransacao = converteParaFloat(
      document.getElementById("valor_por_transacao").value
    );

    // Calculando os resultados
    const resultado = calculadoraTransacoes(
      faturamentoMedio,
      ticketMedio,
      percentualPix,
      percentualBoleto,
      percentualPlataformaPixBoleto,
      percentualPlataformaCartao,
      valorPorTransacao
    );

    // Atualizando a tabela de resultados
    // document.getElementById('resultsTable').innerHTML = criarTabelaResultados(resultado.resultados);

    const resultsContainer = document.getElementById("results");
    const errorMessageDiv = document.getElementById("error-message");
    const calculationResults = document.getElementById("calculation-results");

    // Atualiza a variável global com o valor de lucro aproximado
    lucroAproximadoGlobal = resultado.lucroAproximado;

    // Verifica se o lucro aproximado é menor ou igual a zero
    if (resultado.lucroAproximado <= 0) {
      // Esconde os resultados dos cálculos
      if (calculationResults) {
        calculationResults.style.display = "none";
      }

      // Mostra a mensagem de erro
      if (!errorMessageDiv) {
        const errorDiv = document.createElement("div");
        errorDiv.id = "error-message";
        errorDiv.className = "error-message";
        resultsContainer.appendChild(errorDiv);
      } else {
        errorMessageDiv.style.display = "block";
      }
    } else {
      // Esconde a mensagem de erro se existir
      if (errorMessageDiv) {
        errorMessageDiv.style.display = "none";
      }

      // Mostra os resultados dos cálculos
      if (!calculationResults) {
        const resultsDiv = document.createElement("div");
        resultsDiv.id = "calculation-results";
        resultsContainer.appendChild(resultsDiv);
      }

      // Atualiza os valores dos resultados
      document.getElementById(
        "custoAtual"
      ).innerText = `R$ ${resultado.custoAtual.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
      document.getElementById(
        "custoNovo"
      ).innerText = `R$ ${resultado.custoNovo.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
      document.getElementById(
        "aumentoFaturamento"
      ).innerText = `R$ ${resultado.aumentoFaturamento.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
      // document.getElementById('taxaBoletoPixAdquirente').textContent = formatarMoeda(resultado.taxaBoletoPixAdquirente);
      // document.getElementById('custoFinal').textContent = formatarMoeda(resultado.custoFinal);
      document.getElementById(
        "lucroAproximado"
      ).innerText = `R$ ${resultado.lucroAproximado.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

      // Mostra a div de resultados
      calculationResults.style.display = "block";
      document.querySelector("#calculatorForm").style.display = "none";
    }

    // Mostra o container principal de resultados
    resultsContainer.style.display = "block";
  });


// Animações na Página

const myObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    } else {
      entry.target.classList.remove("show");
    }
  });
});

const elements = document.querySelectorAll(".hidden");

elements.forEach((elements) => myObserver.observe(elements));

// Bloquear o botão direito do mause

if (document.addEventListener) {
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    return false;
  });
} else {
  //Versões antigas do IE
  document.attachEvent("oncontextmenu", function (e) {
    e = e || window.event;
    e.returnValue = false;
    return false;
  });
}

// pixel do facebook

!(function (f, b, e, v, n, t, s) {
  if (f.fbq) return;
  n = f.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = !0;
  n.version = "2.0";
  n.queue = [];
  t = b.createElement(e);
  t.async = !0;
  t.src = v;
  s = b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t, s);
})(
  window,
  document,
  "script",
  "https://connect.facebook.net/en_US/fbevents.js"
);
fbq("init", "3965173153742123");
fbq("track", "PageView");

// Função que será chamada quando a div "resultsTable" estiver visível
let handleVisibility = function (entries) {
  entries.forEach((entry) => {
    // Verifica se a div "resultsTable" está visível e se a "error-message" NÃO está visível
    if (
      entry.isIntersecting &&
      !document.getElementById("error-message").offsetParent
    ) {
      fbq("track", "Lead"); // Aciona o evento do Facebook Pixel

      observer.unobserve(entry.target); // Desativa o observador após o acionamento para evitar múltiplas ativações
    }
  });
};

// Cria um novo observador com a função de callback acima
let observer = new IntersectionObserver(handleVisibility, {
  root: null, // Usa o viewport como root
  threshold: 0.5, // Define 50% de visibilidade da div para acionar o evento
});

// Seleciona a div "resultsTable" e inicia a observação
let targetDiv = document.getElementById("calculation-results");
if (targetDiv) {
  observer.observe(targetDiv);
}
