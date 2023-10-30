import puppeteer from "puppeteer";

export async function ggcc_community_online(community_name, department, tower, user, password) {
  // measurement_date info
  const fechaActual = new Date();

  const dia = fechaActual.getDate();
  const mes = fechaActual.getMonth() + 1;
  const año = fechaActual.getFullYear();
  const hora = fechaActual.getHours();
  const minutos = fechaActual.getMinutes();
  const segundos = fechaActual.getSeconds();

  const fechaFormateada = `${año}-${mes}-${dia} ${hora}:${minutos}:${segundos}`;

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 720 },
  });

  let depto = department;

  // Every case in community online
  if (community_name.toLowerCase() == "comunidad edificio briones luco") {
    depto = "Depto.-" + department;
  } else if (community_name.toLowerCase() == "condominio doña josefina") { // Deprecated for doña josefina
    depto = "ED. " + tower + " - DEPARTAMENTO Nº " + department;
  } else if (community_name.toLowerCase() == "condominio buena vista san miguel") {
    depto = "D 0" + department;
  } else if (community_name.toLowerCase() == "edificio zenteno efficient" || community_name.toLowerCase() == "edificio concepto move") {
    depto= depto+"-"+tower.toUpperCase()
  } else if (community_name.toLowerCase() == "edificio espacio central i" || community_name.toLowerCase() == "edificio vista parque"){
    depto="Depto. "+department // 'Depto. 217
  } else if (community_name.toLowerCase() == "unidad vecinal providencia sector 2"){
    depto="TORRE "+tower+"-"+department // TORRE 8-503
  } else if (community_name.toLowerCase() == "comunidad edificio los abetos"){
    depto="Dpto "+tower.toUpperCase()+"-"+department // Dpto A9-33
  } else if (community_name.toLowerCase() == "condominio buena vista san miguel -1"){
    depto="D "+depto
  } else if (community_name.toLowerCase() == "comunidad santiago central"){ // 'A-0214'
    depto=tower+"-"+department
  } else if (community_name.toLowerCase() == "comunidad cumbres de portugal"){ // depto1415
    depto="depto"+department
  } else if (community_name.toLowerCase() == "edificio san eugenio 890"){ // Dpto-908
    depto="Dpto-"+department
  } else if (community_name.toLowerCase() == "urban"){ // DEPTO 714
    depto="DEPTO "+department
  } 
  

  let invoice_amount = "null";
  let last_payment_amount = "null";
  let last_payment_date = "null";

  const page = await browser.newPage();

  await page.goto("https://tucomunidadenlinea.cl/");

  try {
    await page.waitForXPath('//*[@id="formEntrar"]/input[1]', {
      timeout: 3000,
    });
    await page.type("#formEntrar > input.form-control.correo", user);
    await page.click("#formEntrar > button");
    await new Promise((r) => setTimeout(r, 1000));
    await page.waitForXPath('//*[@id="formEntrar"]/input[2]', {
      timeout: 3000,
    });
    await page.type("#formEntrar > input.form-control.password", password);
    await page.click("#formEntrar > button");
  } catch (error) {
    return {
      data: [
        {
          measurement_date: fechaFormateada,
          invoice_amount: "Error al cargar página",
        },
      ],
    };
  }

  try {
    await page.waitForSelector(
      "#main_content > div:nth-child(1) > form > div.pt2 > div",
      { timeout: 30000 }
    );

    // Department in card
    const result = await page.evaluate(() => {
      const divs = document.querySelectorAll("div.pt2 > div");

      const textos = [];

      divs.forEach((div) => {
        textos.push(div.innerText);
      });

      return textos;
    });

    // Community in card
    const result_com=await page.evaluate(() => {
      const divs = document.querySelectorAll("div.pt2");
      const textos = [];

      divs.forEach((div) => {
        let com=div.innerText
        textos.push(com.substring(com.indexOf('Comunidad')+11,com.indexOf('\n\n')))
      });

      return textos;
    });
    let founded = false;
    let pos = false;

    // Start For
    for (let i = 0; i < result.length; i++) {
      // Doña josefina case
      if (community_name.toLowerCase() == "condominio doña josefina") {
        if (
          result[i][4] == tower &&
          result[i].substring(24, 26) == department &&
          result_com[i].toLowerCase() == community_name.toLowerCase()
        ) {
          founded = true;
          pos = i + 1;
        }
      } else {
        if (result[i] == depto && result_com[i].toLowerCase() == community_name.toLowerCase()) {
          founded = true;
          pos = i + 1;
        }
      }
      if (founded == true) {
        break;
      }
    }

    if (founded == false) {
      return {
        data: [
          {
            measurement_date: fechaFormateada,
            invoice_amount: "Departamento no encontrado",
          },
        ],
      };
    } else {
      await page.click(`#main_content > div:nth-child(${pos})`);
    }
    // End for
  } catch (error) {
    console.log(error)
    return {
      data: [
        {
          measurement_date: fechaFormateada,
          invoice_amount: "Error al cargar página",
        },
      ],
    };
  }

  try {
    let months="sd"
    try{
      await page.waitForSelector("#h1Mtototal", { timeout: 4000 });
      months=0
    } catch (error) {
      months=3
      try{
        await page.waitForSelector('#content_boleta > div > div:nth-child(5) > div:nth-child(1) > p:nth-child(3) > b',{timeout:4000})
      } catch (error){
        return {
          data: [
            {
              measurement_date: fechaFormateada,
              invoice_amount: "Error al cargar página",
            },
          ],
        };
      }
    }

    // Department info
    const data = await page.evaluate(({months,fechaFormateada}) => {

      if (months==0){
        invoice_amount = parseInt(document.querySelector("h1").innerText.slice(1).replace(".", ""));
      } else {
        invoice_amount= parseInt(document.getElementsByTagName('b')[3].innerText.slice(1).replace('.',''))
      }

      last_payment_amount = parseInt(document.getElementsByClassName("fila22 naranjo_pastel1")[3].innerText.slice(2).replace(".", ""));
      last_payment_date = document.getElementsByClassName("fila22 naranjo_pastel1")[1].innerText;
      last_payment_date = last_payment_date.split("-").reverse().join("-");

      return {
        data: [
          {
            measurement_date: fechaFormateada,
            invoice_amount,
            last_payment_amount,
            last_payment_date,
          },
        ],
      };
    },{months,fechaFormateada});

    await browser.close();
    return data;
  } catch (error) {
    console.log(error);
    return {
      data: [
        {
          measurement_date: fechaFormateada,
          invoice_amount: "Error al cargar página",
        },
      ],
    };
  }
}

export default ggcc_community_online;
