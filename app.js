let promotions = [];

const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const emptyState = document.getElementById("emptyState");


/* =========================
   CARGAR DATOS
========================= */

fetch("data.json")
  .then((response) => {

    if (!response.ok) {
      throw new Error("No se pudo cargar data.json");
    }

    return response.json();

  })
  .then((data) => {

    promotions = data;

    console.log(
      `Días Naranja: ${promotions.length} registros cargados`
    );

  })
  .catch((error) => {

    console.error(error);

    emptyState.innerHTML = `
      <div class="empty-icon">⚠️</div>

      <h3>No pudimos cargar la información</h3>

      <p>
        Revisa que el archivo data.json esté ubicado en la raíz del proyecto.
      </p>
    `;

  });


/* =========================
   NORMALIZAR TEXTO
========================= */

function normalizeText(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

}


/* =========================
   OBTENER VALOR
   Permite diferentes nombres
   de columnas del JSON
========================= */

function getValue(item, keys) {

  for (const key of keys) {

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
   DATOS DEL REGISTRO
========================= */

function parsePromotion(item) {

  const marcaEquipo = getValue(
    item,
    [
      "marcaEquipo",
      "Marca del Equipo",
      "marca_equipo"
    ]
  );

  const linea = getValue(
    item,
    [
      "linea",
      "Linea",
      "Línea"
    ]
  );

  const modeloMotor = getValue(
    item,
    [
      "modeloMotor",
      "Modelo Motor",
      "modelo_motor"
    ]
  );

  const marcaMotor = getValue(
    item,
    [
      "marcaMotor",
      "Marca Motor",
      "marca_motor"
    ]
  );

  const capacidad = Number(
    getValue(
      item,
      [
        "capacidad",
        "capacidadCarter",
        "capacidad del carter",
        "Capacidad Carter"
      ]
    )
  ) || 0;

  let obsequioRaw = getValue(
    item,
    [
      "obsequio",
      "OBSEQUIO",
      "Obsequio"
    ]
  );

  let obsequio = 0;

  if (typeof obsequioRaw === "number") {

    obsequio = obsequioRaw;

  } else {

    const match = String(obsequioRaw).match(/\d+/);

    if (match) {
      obsequio = Number(match[0]);
    }

  }


  let promocion = getValue(
    item,
    [
      "promocion",
      "PROMOCION",
      "Promoción",
      "Promocion"
    ]
  );


  let paga = 0;
  let recibe = capacidad;


  /*
    Lee textos como:
    PAGUE 32 Y LLEVE 36
  */

  if (promocion) {

    const numbers = String(promocion).match(/\d+/g);

    if (numbers && numbers.length >= 2) {

      paga = Number(numbers[0]);

      const promoRecibe = Number(numbers[1]);

      /*
        Si el segundo número tiene un error
        de digitación y no coincide con la
        capacidad, usamos la capacidad
        registrada en la tabla.
      */

      if (
        capacidad > 0 &&
        promoRecibe < paga
      ) {

        recibe = capacidad;

      } else {

        recibe = promoRecibe;

      }

    }

  }


  /*
    Si no se logra calcular por la promoción,
    usamos capacidad - obsequio
  */

  if (!paga && capacidad) {

    paga = capacidad - obsequio;

  }

  if (!recibe && capacidad) {

    recibe = capacidad;

  }

  /*
    Si el obsequio no está informado,
    se calcula
  */

  if (!obsequio && recibe && paga) {

    obsequio = recibe - paga;

  }


  return {
    marcaEquipo,
    linea,
    modeloMotor,
    marcaMotor,
    capacidad,
    promocion,
    paga,
    recibe,
    obsequio
  };

}


/* =========================
   BUSCADOR
========================= */

searchInput.addEventListener(
  "input",
  function () {

    const search = normalizeText(this.value);

    if (search.length < 2) {

      resultsContainer.innerHTML = "";

      emptyState.style.display = "block";

      return;

    }


    const terms = search
      .split(" ")
      .filter(Boolean);


    const matches = promotions
      .filter((item) => {

        const promotion = parsePromotion(item);

        const searchableText = normalizeText(
          [
            promotion.marcaEquipo,
            promotion.linea,
            promotion.modeloMotor,
            promotion.marcaMotor
          ].join(" ")
        );


        return terms.every(
          (term) => searchableText.includes(term)
        );

      })
      .slice(0, 20);


    renderResults(matches);

  }
);


/* =========================
   PINTAR RESULTADOS
========================= */

function renderResults(items) {

  if (!items.length) {

    emptyState.style.display = "block";

    emptyState.innerHTML = `
      <div class="empty-icon">🔎</div>

      <h3>No encontramos coincidencias</h3>

      <p>
        Intenta buscar solamente por una palabra.
        Por ejemplo: X5000, Cummins, X12, T800 o Workstar.
      </p>
    `;

    resultsContainer.innerHTML = "";

    return;

  }


  emptyState.style.display = "none";

  resultsContainer.innerHTML = items
    .map((item) => {

      const promo = parsePromotion(item);

      const vehicleName =
        [
          promo.marcaEquipo,
          promo.linea
        ]
          .filter(
            value =>
              value &&
              value !== "-"
          )
          .join(" ") ||
        promo.modeloMotor ||
        "Motor";


      const vehicleInfo = [];

      if (
        promo.modeloMotor &&
        promo.modeloMotor !== "-"
      ) {

        vehicleInfo.push(
          `<span>Motor: <strong>${promo.modeloMotor}</strong></span>`
        );

      }


      if (
        promo.marcaMotor &&
        promo.marcaMotor !== "-"
      ) {

        vehicleInfo.push(
          `<span>Marca: <strong>${promo.marcaMotor}</strong></span>`
        );

      }


      return `
        <article class="result-card">

          <div class="result-top">

            <span>
              PROMOCIÓN DÍA NARANJA
            </span>

            <h3>
              ${vehicleName}
            </h3>

            <div class="vehicle-data">

              ${vehicleInfo.join("")}

            </div>

          </div>


          <div class="gift-hero">

            <span>
              GULF TE DA
            </span>

            <b>
              +${promo.obsequio}
            </b>

            <strong>
              CUARTO${promo.obsequio === 1 ? "" : "S"} ADICIONAL${promo.obsequio === 1 ? "" : "ES"}
            </strong>

            <small>
              para completar el servicio de tu motor
            </small>

          </div>


          <div class="promo-numbers">

            <div class="number-card">

              <span>
                TÚ PAGAS
              </span>

              <b>
                ${promo.paga}
              </b>

              <small>
                cuartos
              </small>

            </div>


            <div class="number-card highlight">

              <span>
                RECIBES EN TOTAL
              </span>

              <b>
                ${promo.recibe}
              </b>

              <small>
                cuartos
              </small>

            </div>

          </div>


          ${
            promo.capacidad
              ? `
                <div class="capacity">
                  Capacidad registrada del motor:
                  <strong>
                    ${promo.capacidad} cuartos
                  </strong>
                </div>
              `
              : ""
          }

        </article>
      `;

    })
    .join("");

}
