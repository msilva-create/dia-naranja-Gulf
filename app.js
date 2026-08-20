let promociones = [];

const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const emptyState = document.getElementById("emptyState");


/* ==========================================
   RANGOS DE CÁRTER - OTRAS MARCAS
========================================== */

const rangosCarter = [
  {
    min: 6,
    max: 11,
    regalo: 1
  },
  {
    min: 16,
    max: 22,
    regalo: 2
  },
  {
    min: 24,
    max: 26,
    regalo: 3
  },
  {
    min: 30,
    max: 48,
    regalo: 4
  }
];


/* ==========================================
   CARGAR BASE
========================================== */

fetch("data.json")
  .then(response => response.json())
  .then(data => {
    promociones = data;
    console.log(`${promociones.length} registros cargados`);
  })
  .catch(error => {
    console.error("Error cargando data.json:", error);
  });


/* ==========================================
   NORMALIZAR TEXTO
========================================== */

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}


/* ==========================================
   LEER CAMPOS
========================================== */

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


/* ==========================================
   IDENTIFICAR OTRAS MARCAS
========================================== */

function esRegistroOtrasMarcas(item) {

  const textoCompleto = normalizar(
    Object.values(item).join(" ")
  );

  return (
    textoCompleto.includes("otras marcas") ||
    textoCompleto.includes("otros modelos")
  );
}


/* ==========================================
   PREPARAR PROMOCIÓN
========================================== */

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

    const encontrado =
      String(obsequioTexto).match(/\d+/);

    if (encontrado) {
      obsequio = Number(encontrado[0]);
    }

  }


  let paga = 0;
  let recibe = capacidad;


  if (promocion) {

    const numeros =
      String(promocion).match(/\d+/g);

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


/* ==========================================
   ENCONTRAR RANGO POR CAPACIDAD
========================================== */

function encontrarRango(numero) {

  return rangosCarter.find(
    rango =>
      numero >= rango.min &&
      numero <= rango.max
  );

}


/* ==========================================
   BUSCADOR
========================================== */

searchInput.addEventListener("input", function () {

  const busqueda = normalizar(this.value);


  if (!busqueda) {

    resultsContainer.innerHTML = "";
    emptyState.style.display = "block";

    return;
  }


  emptyState.style.display = "none";


  /* ======================================
     SI ESCRIBE OTR / OTRA / OTRAS...
     MOSTRAR RANGOS DE CÁRTER
  ====================================== */

  if (
    busqueda === "otr" ||
    busqueda.startsWith("otra") ||
    busqueda.startsWith("otro")
  ) {

    mostrarRangos(rangosCarter);

    return;
  }


  /* ======================================
     SI ESCRIBE SOLO UN NÚMERO
  ====================================== */

  if (/^\d+$/.test(busqueda)) {

    const numero = Number(busqueda);

    const rango = encontrarRango(numero);


    if (rango) {

      mostrarRangos([rango]);

    } else {

      mostrarSinResultadosCapacidad();

    }

    return;
  }


  /* ======================================
     BÚSQUEDA NORMAL
  ====================================== */

  const coincidencias = promociones

    /* QUITAR COMPLETAMENTE OTRAS MARCAS */

    .filter(item => {
      return !esRegistroOtrasMarcas(item);
    })

    .map(item => prepararPromo(item))

    .filter(promo => {

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

    .slice(0, 15);


  mostrarVehiculos(coincidencias);

});


/* ==========================================
   MOSTRAR RANGOS DE CÁRTER
========================================== */

function mostrarRangos(rangos) {

  emptyState.style.display = "none";


  resultsContainer.innerHTML = `

    <div class="range-search-title">

      <strong>
        Selecciona la capacidad del cárter
      </strong>

      <span>
        Toca el rango que corresponde a tu vehículo.
      </span>

    </div>


    <div class="range-options">

      ${rangos.map(rango => `

        <button
          class="range-option"
          onclick="seleccionarRango(${rango.min}, ${rango.max})"
        >

          <div class="range-option-content">

            <span class="range-label">
              OTRAS MARCAS
            </span>

            <strong class="range-main">
              CÁRTER DE ${rango.min} A ${rango.max} CUARTOS
            </strong>

            <div class="range-gift-preview">

              Gulf te da

              <strong>
                +${rango.regalo}
                cuarto${rango.regalo === 1 ? "" : "s"}
              </strong>

            </div>

          </div>


          <div class="vehicle-arrow">
            ›
          </div>

        </button>

      `).join("")}

    </div>

  `;

}


/* ==========================================
   SELECCIONAR RANGO
========================================== */

function seleccionarRango(min, max) {

  const rango = rangosCarter.find(
    r =>
      r.min === min &&
      r.max === max
  );


  if (!rango) {
    return;
  }


  mostrarPromocionRango(rango);

}


/* ==========================================
   PROMOCIÓN POR CÁRTER
========================================== */

function mostrarPromocionRango(rango) {

  resultsContainer.innerHTML = `

    <button
      class="back-search"
      onclick="volverABuscar()"
    >
      ← Buscar otra opción
    </button>


    <article class="promo-card">


      <div class="promo-vehicle">

        <span>
          TU PROMOCIÓN DÍA NARANJA
        </span>

        <h3>
          Otras Marcas
        </h3>


        <div class="selected-range">

          <span>
            CAPACIDAD DEL CÁRTER
          </span>

          <strong>
            CÁRTER DE ${rango.min} A ${rango.max} CUARTOS
          </strong>

        </div>

      </div>


      <div class="gulf-gift">

        <span>
          GULF TE DA
        </span>

        <strong>
          +${rango.regalo}
        </strong>

        <b>
          CUARTO${rango.regalo === 1 ? "" : "S"}
          ADICIONAL${rango.regalo === 1 ? "" : "ES"}
        </b>

        <small>
          para tu cambio de aceite
        </small>

      </div>


    </article>

  `;

}


/* ==========================================
   MOSTRAR VEHÍCULOS
========================================== */

function mostrarVehiculos(opciones) {

  emptyState.style.display = "none";


  if (!opciones.length) {

    resultsContainer.innerHTML = `

      <div class="no-results">

        <strong>
          No encontramos ese vehículo.
        </strong>

        <p>
          Intenta escribir parte de la marca,
          modelo o referencia del motor.
        </p>

        <p>
          Si no lo encuentras, escribe
          <strong>Otras Marcas</strong>
          o directamente la capacidad del cárter.
        </p>

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
                ${titulo || motor}
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


/* ==========================================
   SELECCIONAR VEHÍCULO
========================================== */

function seleccionarVehiculo(index) {

  const promo =
    window.resultadosActuales[index];

  mostrarPromocionVehiculo(promo);

}


/* ==========================================
   PROMOCIÓN VEHÍCULO ESPECÍFICO
========================================== */

function mostrarPromocionVehiculo(promo) {


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
          ${titulo || motor}
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


    </article>

  `;

}


/* ==========================================
   CAPACIDAD FUERA DE RANGO
========================================== */

function mostrarSinResultadosCapacidad() {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <strong>
        Esa capacidad no está dentro de los rangos disponibles.
      </strong>

      <p>
        Los rangos disponibles son:
      </p>

      <div class="mini-ranges">

        <span>Cárter de 6 a 11 cuartos</span>
        <span>Cárter de 16 a 22 cuartos</span>
        <span>Cárter de 24 a 26 cuartos</span>
        <span>Cárter de 30 a 48 cuartos</span>

      </div>

    </div>

  `;

}


/* ==========================================
   VOLVER
========================================== */

function volverABuscar() {

  searchInput.value = "";

  resultsContainer.innerHTML = "";

  emptyState.style.display = "block";

  searchInput.focus();

}
