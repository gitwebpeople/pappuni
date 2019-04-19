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

  const registerNewContact = async (req, res) => {
    const data = req.body || null;
    const user = jwt.decode(
      req.get("Authorization").replace("bearer ", ""),
      authSecret
    );
    const id = user.id;
    const cnpjcpf = user.cnpjcpf;

    if (id) {
      const customer = await app.db("customers").where({ id });
      if (!customer) {
        return res.status(400).send("Usuário não encontrado.");
      }
    } else {
      return res.status(500).send("ID não informado.");
    }

    const telefone = await app
      .db("contacts")
      .where({ cnpjcpf, telefone: req.body.telefone })
      .first();
    console.log(telefone);
    if (telefone)
      return res.status(400).send("Você já cadastrou este telefone.");

    const email = await app
      .db("contacts")
      .where({ cnpjcpf, contact: req.body.email })
      .first();
    if (email) return res.status(400).send("Você já cadastrou este email.");

    try {
      existsOrError(
        data.nome,
        "Você precisa informar um nome para este contato."
      );
      existsOrError(
        data.telefone,
        "Você precisa informar um telefone para este contato."
      );
      existsOrError(
        data.email,
        "Você precisa informar um e-mail para este contato."
      );
    } catch (msg) {
      return res.status(400).send(msg);
    }

    app
      .db("contacts")
      .insert({
        id_cliente: id,
        cnpjcpf,
        nome: data.nome,
        telefone: data.telefone,
        contact: data.email,
        type: data.type
      })
      .then(_ => {
        return res.sendStatus(200);
      })
      .catch(err => {
        return res.status(500).send(err);
      });
  };

  const updateContact = async (req, res) => {
    const data = req.body || null;
    // const token = jwt.decode(
    //   req.get("Authorization").replace("bearer", ""),
    //   authSecret
    // );

    const result = await app.db("contacts").where({ id: data.id }).first();
        
    if(!result) return res.status(500).send("Não encontramos este contato que está tentando alterar. Entre em contato com o suporte.");

    try {
      existsOrError(data.nome,"Você precisa informar um nome para este contato.");
      existsOrError(data.telefone,"Você precisa informar um telefone para este contato.");
      existsOrError(data.email,"Você precisa informar um e-mail para este contato.");
    } catch (msg) {
      return res.status(400).send(msg);
    }

    app.db("contacts")
    .where({id: data.id})
    .update({
        nome: data.nome,
        telefone: data.telefone,
        contact: data.contact
    })
    .then(_ => {
        return res.sendStatus(200)
    })
    .catch(err => {
        return res.status(500).send(err)
    });

  };

  const fetchContacts = async (req, res) => {
    const user = jwt.decode(
        req.get("Authorization").replace("bearer ", ""),
        authSecret
      );
    
    const contacts = await app.db("contacts").where({ cnpjcpf: user.cnpjcpf, id_cliente: user.id});

    return res.json(contacts);
  }

  const fetchContactsByType = async (req, res) => {
    const type = req.query.type || null
    const user = jwt.decode(
        req.get("Authorization").replace("bearer ", ""),
        authSecret
      );

      console.log(type)
    
    const contacts = await app.db("contacts").where({ cnpjcpf: user.cnpjcpf, id_cliente: user.id, type });

    return res.json(contacts);
  }

  return {
    registerNewContact,
    updateContact,
    fetchContacts,
    fetchContactsByType
  };
};
