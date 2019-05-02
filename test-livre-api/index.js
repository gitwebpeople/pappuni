const axios = require("axios");
const _URL = "http://ws1.api.livre.com.br/slip/slip";
const USER_KEY = "eaa675a4-d3dd-4b2c-ae40-40d312ceb9f5";
const qs = require('querystring')

const SAC_DATA = {
    FMTOUT: "JSON",
    USRKEY: USER_KEY,
    NOMSAC: "Gabriel Luz",
    SACMAL: "gabriel.n64@hotmail.com",
    CODCEP: "06824777",
    CODUFE: "SP",
    DSCEND: "Rua teste",
    NUMEND: "766",
    DSCCPL: "",
    DSCBAI: "Jardim Teste",
    DSCCID: "São Paulo",
    NUMPAI: "",
    CODOPR: "",
    NUMDDD: "11",
    NUMTEL: "4455485",
    CODCMF: "88856455771",
    CALMOD: "1",
    DATVCT: "24/04/2019",
    VLRBOL: "150",
    PCTJUR: "1",
    DATVAL: "29/04/2019"
} 

getToken();

async function getToken() {
  const instance = axios.create({
    headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "accept-charset": "UTF-8"
    }
  });

  const data = qs.stringify({ 
    FMTOUT: "JSON",
    USRKEY: USER_KEY,
  })

  const response = await instance.post(_URL, data);

  generateTicket(response.data.usrtok);
}


async function generateTicket(token) {
    const data = qs.stringify({
        FMTOUT: "JSON",
        USRKEY: USER_KEY,
        USRTOK: token,
        URLRET: "",
        TIPBOL: "5",
        ...SAC_DATA
    });

    const instance = axios.create({
        headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
            "accept-charset": "UTF-8"
        }
      });
    
    const response = await instance.post(_URL, data);

    console.log('====================================');
    console.log("http://fatura2.livre.com.br/fatura"+response.data.urlpst  );
    console.log('====================================');
}