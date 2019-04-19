module.exports = app => {
    // CUSTOMERS
    app.route("/login").post(app.components.customers.login)
    app.route("/forgotPassword").post(app.components.customers.forgotPassword)
    app.route("/resetPassword").post(app.components.customers.resetPassword)
    app.route("/registerCustomer").post(app.components.customers.registerCustomer);
    app.route("/fetchCustomerData").all(app.config.passport.authenticate()).get(app.components.customers.selectCustomerData)
    app.route("/updateCustomerData").all(app.config.passport.authenticate()).post(app.components.customers.updateCustomerData)


    //CONTACTS
    app.route("/registerNewContact").all(app.config.passport.authenticate()).post(app.components.contacts.registerNewContact)
    app.route("/updateContact").all(app.config.passport.authenticate()).post(app.components.contacts.updateContact)
    app.route("/fetchContacts").all(app.config.passport.authenticate()).get(app.components.contacts.fetchContacts)
    app.route("/fetchContactsByType").all(app.config.passport.authenticate()).get(app.components.contacts.fetchContactsByType)
}