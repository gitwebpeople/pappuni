const db = require("./config/db");
insertManyData();
async function insertManyData() {
    for(let d = 0; d < 500; d++ ) {
        await db("customers").insert({ cnpjcpf: d});
    }
}