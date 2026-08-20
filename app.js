let promociones = [];

const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const emptyState = document.getElementById("emptyState");


/* =========================
   CARGAR BASE
========================= */

fetch("data.json")
  .then(response => response.json())
  .then(data => {
    promociones = data;
    console.log(`${promociones.length} registros cargados`);
  })
  .catch(error => {
    console.error("Error cargando data.json:", error);
  });


/* =========================
   NORMALIZAR TEXTO
========================= */

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}


/* =========================
   LEER CAMPOS
========================= */

function valor(item, opciones) {

  for (const key of opciones) {

    if (
      item[key] !== undefined &&
      item[key] !== null &&
      item[key] !== ""
    ) {
      return item[key];
    }

  }

  return "";
}


/* =========================
   ORGANIZAR PROMOCIÓN
========================= */

function prepararPromo(item) {

  const marcaEquipo = valor(item, [
    "marcaEquipo",
    "Marca del Equipo",
    "marca_equipo",
    "Marca"
  ]);

  const linea = valor(item, [
    "linea",
    "Linea",
    "Línea",
    "modeloEquipo",
    "Modelo Equipo"
  ]);

  const marcaMotor = valor(item, [
    "marcaMotor",
    "Marca Motor",
    "marca_motor"
  ]);

  const modeloMotor = valor(item, [
    "modeloMotor",
    "Modelo Motor",
    "modelo_motor"
  ]);

  const capacidadTexto = valor(item, [
    "capacidad",
    "capacidadCarter",
    "Capacidad Carter",
    "Capacidad del Carter",
    "Capacidad del cárter"
  ]);

  const capacidad =
    Number(
      String(capacidadTexto)
        .replace(",", ".")
        .match(/\d+(\.\d+)?/)?.[0]
    ) || 0;

  const promocion = valor(item, [
    "promocion",
    "PROMOCION",
    "Promoción",
    "Promocion"
  ]);

  const obsequioTexto = valor(item, [
    "obsequio",
    "OBSEQUIO",
    "Obsequio"
  ]);

  let obsequio = 0;

  if (typeof obsequioTexto === "number") {

    obsequio = obsequioTexto;

  } else {

    const encontrado = String(obsequioTexto).match(/\d+/);

    if (encontrado) {
      obsequio = Number(encontrado[0]);
    }

  }

  let paga = 0;
  let recibe = capacidad;

  if (promocion) {

    const numeros = String(promocion).match(/\d+/g);

    if (numeros && numeros.length >= 2) {

      paga = Number(numeros[0]);
      recibe = Number(numeros[1]);

    }

  }

  if (!paga && capacidad && obsequio) {
    paga = capacidad - obsequio;
  }

  if (!recibe && capacidad) {
    recibe = capacidad;
  }

  if (!obsequio && recibe && paga) {
    obsequio = recibe - paga;
  }

  if (
    recibe &&
    paga &&
    recibe < paga &&
    capacidad
  ) {

    recibe = capacidad;
    obsequio = recibe - paga;

  }

  return {
    marcaEquipo,
    linea,
    marcaMotor,
    modeloMotor,
    capacidad,
    paga,
    recibe,
    obsequio
  };
}


/* =========================
   BUSCAR
========================= */

searchInput.addEventListener("input", function () {

  const busqueda = normalizar(this.value);

  if (!busqueda) {

    resultsContainer.innerHTML = "";
    emptyState.style.display = "block";

    return;
  }


  const numeroBuscado =
    busqueda.match(/\d+(\.\d+)?/);

  const buscaCapacidad =
    /^\d+(\.\d+)?$/.test(busqueda) ||
    busqueda.includes("cuarto") ||
    busqueda.includes("carter");


  const coincidencias = promociones
    .map(item => prepararPromo(item))
    .filter(promo => {

      if (
        buscaCapacidad &&
        numeroBuscado
      ) {

        const numero = Number(numeroBuscado[0]);

        return promo.capacidad === numero;

      }


      const texto = normalizar(
        [
          promo.marcaEquipo,
          promo.linea,
          promo.marcaMotor,
          promo.modeloMotor
        ].join(" ")
      );

      return texto.includes(busqueda);

    })
    .slice(0, 20);


  mostrarOpciones(coincidencias);

});


/* =========================
   MOSTRAR OPCIONES
========================= */

function mostrarOpciones(opciones) {

  emptyState.style.display = "none";

  if (!opciones.length) {

    resultsContainer.innerHTML = `

      <div class="no-results">

        <strong>
          No encontramos coincidencias.
        </strong>

        <p>
          Intenta buscar por marca, modelo, motor
          o por la capacidad del cárter.
        </p>

        <span>
          Ejemplo:
          <strong>24 cuartos</strong>
        </span>

      </div>

    `;

    return;
  }


  window.resultadosActuales = opciones;


  resultsContainer.innerHTML = `

    <div class="search-options">

      ${opciones.map((promo, index) => {

        const titulo = [
          promo.marcaEquipo,
          promo.linea
        ]
          .filter(
            value =>
              value &&
              value !== "-"
          )
          .join(" ");


        const motor = [
          promo.marcaMotor,
          promo.modeloMotor
        ]
          .filter(
            value =>
              value &&
              value !== "-"
          )
          .join(" ");


        return `

          <button
            class="vehicle-option"
            onclick="seleccionarVehiculo(${index})"
          >

            <div class="vehicle-option-main">

              <strong class="vehicle-title">
                ${titulo || motor || "Otras Marcas"}
              </strong>


              ${
                motor &&
                motor !== titulo
                  ? `
                    <span class="vehicle-motor">
                      ${motor}
                    </span>
                  `
                  : ""
              }


              ${
                promo.capacidad
                  ? `
                    <div class="capacity-result">
                      CAPACIDAD DEL CÁRTER:
                      <strong>
                        ${promo.capacidad} CUARTOS
                      </strong>
                    </div>
                  `
                  : ""
              }

            </div>


            <div class="vehicle-arrow">
              ›
            </div>

          </button>

        `;

      }).join("")}

    </div>

  `;

}


/* =========================
   SELECCIONAR VEHÍCULO
========================= */

function seleccionarVehiculo(index) {

  const promo =
    window.resultadosActuales[index];

  mostrarPromocion(promo);

}


/* =========================
   MOSTRAR PROMOCIÓN
========================= */

function mostrarPromocion(promo) {

  const titulo = [
    promo.marcaEquipo,
    promo.linea
  ]
    .filter(
      value =>
        value &&
        value !== "-"
    )
    .join(" ");


  const motor = [
    promo.marcaMotor,
    promo.modeloMotor
  ]
    .filter(
      value =>
        value &&
        value !== "-"
    )
    .join(" ");


  resultsContainer.innerHTML = `

    <button
      class="back-search"
      onclick="volverABuscar()"
    >
      ← Buscar otro vehículo
    </button>


    <article class="promo-card">


      <div class="promo-vehicle">

        <span>
          TU PROMOCIÓN DÍA NARANJA
        </span>

        <h3>
          ${titulo || motor || "Otras Marcas"}
        </h3>

        ${
          motor &&
          motor !== titulo
            ? `
              <p>
                ${motor}
              </p>
            `
            : ""
        }

      </div>


      <div class="gulf-gift">

        <span>
          GULF TE DA
        </span>

        <strong>
          +${promo.obsequio}
        </strong>

        <b>
          CUARTO${promo.obsequio === 1 ? "" : "S"}
          ADICIONAL${promo.obsequio === 1 ? "" : "ES"}
        </b>

        <small>
          para completar el servicio de tu motor
        </small>

      </div>


      <div class="promo-summary">


        <div>

          <span>
            TÚ PAGAS
          </span>

          <strong>
            ${promo.paga}
          </strong>

          <small>
            cuartos
          </small>

        </div>


        <div class="promo-total">

          <span>
            RECIBES
          </span>

          <strong>
            ${promo.recibe}
          </strong>

          <small>
            cuartos
          </small>

        </div>


      </div>


      ${
        promo.capacidad
          ? `

            <div class="motor-capacity">

              CAPACIDAD DEL CÁRTER

              <strong>
                ${promo.capacidad} CUARTOS
              </strong>

            </div>

          `
          : ""
      }


    </article>

  `;

}


/* =========================
   VOLVER AL BUSCADOR
========================= */

function volverABuscar() {

  searchInput.value = "";

  resultsContainer.innerHTML = "";

  emptyState.style.display = "block";

  searchInput.focus();

}
