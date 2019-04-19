const env = require("./.env")

// module.exports = {
//     client: "postgresql",
//     connection: {
//       database: "plataforma_appuni",
//       user: "postgres",
//       password: "Sparda11",
//       port: ""
//     }
//   };


  module.exports = {
    client: "postgresql",
    connection: {
      host: env.host,
      database: env.database,
      user: env.user,
      password: env.password,
      port: env.port
    }
  };