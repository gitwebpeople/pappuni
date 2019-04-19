const bcrypt = require("bcrypt-nodejs");
const { authSecret } = require("../.env");
const jwt = require("jwt-simple");
const crypto = require("crypto");
const async = require("async");
const path = require("path");

module.exports = app => {
  const {
    existsOrError,
    notExistsOrError,
    validarCNPJ,
    validateCPF
  } = app.components.validation;

  const encryptPassword = password => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  };

  var hbs = require("nodemailer-express-handlebars"),
    email = process.env.MAILER_EMAIL_ID || "biellcrazy@gmail.com",
    pass = process.env.MAILER_PASSWORD || "gabrieldopc";
  const nodemailer = require("nodemailer");

  var smtpTransport = nodemailer.createTransport({
    // service: process.env.MAILER_SERVICE_PROVIDER || "Gmail",
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "0746f45f10ccf3",
      pass: "d48404afcf0b99"
    }
  });

  var handlebarsOptions = {
    viewEngine: {
      extName: "handlebars",
      partialsDir: path.resolve("../templates/")
    },
    viewPath: path.resolve("./templates/"),
    extName: ".html"
  };

  smtpTransport.use("compile", hbs(handlebarsOptions));

  /* 
      1. Cadastro PJ - Razão social, CNPJ e nome do responsável
      2. Cadastro PF – Nome completo e CPF
      3. Endereço – Preenchimento automático quando o cliente digitar o CEP
      4. Recuperação de senha – Envio de senha onde o cliente deverá acessar o link seguro para troca da senha
      5. Telefone comercial – Cadastro de 2 telefone
      6. Telefone celular – Cadastro de 2 telefone
      7. Data de cadastro

      logradouro, numero, complemento, cep, state, city, type (tipo de logradouro: rua, avenida...)
    */
  const registerCustomer = async (req, res) => {
    const data = req.body;

    if (data.cnpjcpf.length == 18) {
      if (!validarCNPJ(data.cnpjcpf))
        return res.status(400).send("O CNPJ informado é inválido.");
      data.pjpf = "pj";
    } else if (data.cnpjcpf.length == 14) {
      if (!validateCPF(data.cnpjcpf))
        return res.status(400).send("O CPF informado é inválido.");
      data.pjpf = "pf";
    } else {
      return res.status(400).send("O documento informado é inválido.");
    }

    let nameAccount = "";
    let isPj = false;
    if (data.pjpf == "pf") {
      nameAccount = "seu nome.";
    } else {
      isPj = true;
      nameAccount = "sua razão social.";
    }

    try {
      existsOrError(data.nameAccount, `Você não informou ${nameAccount}`);
      isPj
        ? existsOrError(data.responsavel, "Você não informou o responsável")
        : "";
      existsOrError(data.logradouro, "Você não informou o logradouro.");
      existsOrError(data.numero, "Você não informou o número do logradouro.");
      existsOrError(data.cep, "Você não informou o CEP.");
      existsOrError(data.state, "Você não informou o estado.");
      existsOrError(data.city, "Você não informou a cidade.");
      existsOrError(data.type, "Você não informou o tipo de logradouro.");
    } catch (msg) {
      return res.status(400).send(msg);
    }

    const customer = await app.db("customers").where({ cnpjcpf: data.cnpjcpf });
    console.log(customer);
    if (customer.length > 0)
      return res.status(400).send("Já existe um usuário com este CNPJ");

    const d = new Date();
    const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

    const password = encryptPassword(data.password);

    const dataInsert = {
      nameaccount: data.nameAccount,
      responsavel: data.responsavel,
      cnpjcpf: data.cnpjcpf,
      registerdate: date,
      pjpf: data.pjpf,
      logradouro: data.logradouro,
      number: data.number,
      complement: data.complemento,
      cep: data.cep,
      state: data.state,
      city: data.city,
      type: data.type,
      comercial: data.comercial,
      comercial2: data.comercial2,
      celular: data.celular,
      celular2: data.celular2,
      password
    };

    await app
      .db("customers")
      .insert(dataInsert)
      .then(_ => {
        return res.status(200);
      })
      .catch(error => {
        console.log(error);
        return res.status(500).send(error);
      });
  };

  const login = async (req, res) => {
    if (!req.body.cnpjcpf || !req.body.password) {
      return res.status(400).send("Informe usuário e senha!");
    }

    if (req.body.cnpjcpf.length == 18) {
      if (!validarCNPJ(req.body.cnpjcpf)) {
        return res.status(400).send("O CNPJ especificado é inválido.");
      }
    } else if (req.body.cnpjcpf.length == 14) {
      if (!validateCPF(req.body.cnpjcpf)) {
        return res.status(400).send("O CPF especificado é inválido.");
      }
    }

    try {
    } catch (msg) {
      return res.status(400).send(msg);
    }

    const user = await app
      .db("customers")
      .where({ cnpjcpf: req.body.cnpjcpf })
      .first();

    if (!user) return res.status(400).send("Usuário não encontrado!");

    // const isMatch = bcrypt.compareSync(req.body.password, user.password);
    // if (!isMatch) return res.status(401).send("Email/Senha inválidos!");

    const now = Math.floor(Date.now() / 1000);

    const payload = {
      id: user.id,
      cnpjcpf: user.cnpjcpf,
      nick: user.nick,
      iat: now,
      exp: now + 60 * 60 * 24 * 365
      // exp: now + 1
    };

    return res.json({
      ...payload,
      token: jwt.encode(payload, authSecret)
    });
  };

  function forgotPassword(req, res) {
    async.waterfall(
      [
        function(done) {
          app
            .db("customers")
            .where({ cnpjcpf: req.body.cnpjcpf })
            .then(_ => {
              done(null, _[0]);
            })
            .catch(err => {
              console.log(err);
              return done("Usuário não encontrado.");
            });
        },
        function(user, done) {
          // create the random token

          crypto.randomBytes(20, function(err, buffer) {
            var token = buffer.toString("hex");
            done(err, user, token);
          });
        },
        function(user, token, done) {
          const now = Math.floor(Date.now() / 1000);
          app
            .db("customers")
            .where({ id: user.id })
            .update({
              reset_password_token: token,
              reset_password_expires: now + 60 * 60
            })
            .then(async _ => {
              const customer = await app.db("customers").where({ id: user.id });

              done(null, token, customer[0]);
            })
            .catch(err => {
              return done(err);
            });
          // User.findByIdAndUpdate({ _id: user._id }, { reset_password_token: token, reset_password_expires: Date.now() + 86400000 }, { upsert: true, new: true }).exec(function(err, new_user) {
          //   done(err, token, new_user);
          // });
        },
        async function(token, user, done) {
          // const contact = await app.db.raw(
          //   `SELECT contact FROM contacts WHERE id_cliente = '${user.id}'`
          // );

          var data = {
            to: "gabriel.n64@hotmail.com",
            from: email,
            template: "forgot-password-email",
            subject: "Password help has arrived!",
            context: {
              url: "http://localhost:3000/auth/reset_password?token=" + token,
              name: user.nameaccount
            }
          };

          smtpTransport.sendMail(data, function(err) {
            console.log(!err);
            if (!err) {
              return res.json({
                message: "Kindly check your email for further instructions"
              });
            } else {
              return done(err);
            }
          });
        }
      ],
      function(err) {
        console.log(err);
        return res.status(422).json({ message: err });
      }
    );
  }

  async function resetPassword(req, res) {

    try {
      existsOrError(req.body.newPassword, "Você precisa digitar uma senha nova.")
      existsOrError(req.body.verifyPassword, "Você precisa confirmar a sua nova senha.");
    } catch(msg) {
      return res.status(400).send(msg);
    }

    const result = await app.db("customers").where({
      reset_password_token: req.body.token
    });

    if (new Date(result[0].reset_password_expires * 1000) > new Date()) {
      // return res.send(false);
      if (req.body.newPassword === req.body.verifyPassword) {
        const password = encryptPassword(req.body.newPassword);
        app
          .db("customers")
          .where({
            reset_password_token: req.body.token
          })
          .update({
            reset_password_token: null,
            reset_password_expires: null,
            password: password
          })
          .then(_ => {
            var data = {
              to: "gabriel.n64@hotmail.com",
              from: "biellcrazy@gmail.com",
              template: "reset-password-email",
              subject: "Password Reset Confirmation",
              context: {
                name: result[0].nameaccount
              }
            };
      
            smtpTransport.sendMail(data, function(err) {
              console.log(err)
              if (!err) {
                return res.json({ message: "Password reset" });
              } else {
                return res.status(500).send(err);
              }
            });
          })
          .catch(err => {
            return res.status(500).send(err);
          });
      } else {
        return res.status(400).send("As senhas não coincidem.");
      }
    } else {
      return res.status(400).send("Token expirado, tente solicitar a alteração de senha novamente.")
    }
  }

  const updateCustomerData = async (req, res) => {
    const user = jwt.decode(
      req.get("Authorization").replace("bearer ", ""),
      authSecret
    );
    const body = req.body || null;

    try {
      existsOrError(body.nome, "Você não informou o nome da conta");
      existsOrError(body.logradouro, "você não informou o logradouro")
      existsOrError(body.numero, "Você não informou o número")
      existsOrError(body.cep, "Você não informou o cep")
      existsOrError(body.estado, "Você não informou o estado")
      existsOrError(body.cidade, "Você não informou a cidade")
      existsOrError(body.comercial, "Você não informou ao menos um contato comercial")
      existsOrError(body.celular, "Você deve informar ao menos um número de celular")
    } catch(msg) {
      return res.status(400).send(msg)
    }

    app
      .db("customers")
      .where({
        cnpjcpf: user.cnpjcpf,
        id: user.id
      })
      .update({
        nameaccount: body.nome,
        logradouro: body.logradouro,
        number: body.numero,
        cep: body.cep,
        state: body.estado,
        city: body.cidade,
        comercial: body.comercial,
        comercial2: body.comercial2,
        celular: body.celular,
        celular2: body.celular2,
        complement: body.complemento
      })
      .then(_ => {
        return res.sendStatus(200);
      })
      .catch(err => {
        return res.status(500).send(err);
      })
  }
  
  const selectCustomerData = async (req, res) => {
    const user = jwt.decode(
      req.get("Authorization").replace("bearer ", ""),
      authSecret
    );
    const customer = await app
      .db("customers")
      .where({ cnpjcpf: user.cnpjcpf }).first();
    return res.json(customer);
  };

  return {
    selectCustomerData,
    login,
    registerCustomer,
    forgotPassword,
    resetPassword,
    updateCustomerData
  };
};
