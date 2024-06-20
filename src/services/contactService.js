const { Contact } = require("../models");
const Sequelize = require("sequelize");

const identifyContact = async ({ email, phoneNumber }) => {
  let primaryContact = null;
  let secondaryContacts = [];

  const existingContacts = await Contact.findAll({
    where: {
      [Sequelize.Op.or]: [{ phoneNumber }, { email }],
    },
    order: [["createdAt", "ASC"]],
  });

  if (existingContacts.length > 0) {
    // find all the contact with linkedPrecedence as primary (it can be more than one)
    const exisitngPrimaryContacts = [];

    // find all the exising primary contacts and store them in exisitngPrimaryContacts
    for (const contact of existingContacts) {
      if (contact.linkPrecedence === "primary") {
        exisitngPrimaryContacts.push(contact);
      }
    }

    // find all the exising secondary contacts and store them in secondaryContacts
    for (const contact of existingContacts) {
      if (contact.linkPrecedence === "secondary") {
        secondaryContacts.push(contact);
      }
    }

    if (exisitngPrimaryContacts.length > 0) {
      primaryContact = exisitngPrimaryContacts[0];
      const linkedId = primaryContact.id;

      // there can only be 2 primary contacts max
      // reason for that is one can have same email as given in request and other can have same phone number as given in request
      // set the linkedPrecedence as secondary, linkedId as the primary contact id, email and phoneNumber as the given email and phoneNumber
      // for the second primary contact
      for (let i = 1; i < exisitngPrimaryContacts.length; i++) {
        const contact = exisitngPrimaryContacts[i];
        await contact.update({
          linkPrecedence: "secondary",
          linkedId,
        });
        secondaryContacts.push(contact);
      }

      // return the response only if there are more than 1 primary contacts
      if (exisitngPrimaryContacts.length > 1)
        return responseBuilder(primaryContact, secondaryContacts);
    }
  }

  // if no primary contact found and there are secondary contacts, then try to fetch the primary contact from the db using the linkedId
  if (!primaryContact && secondaryContacts.length > 0) {
    primaryContact = await Contact.findOne({
      where: {
        id: secondaryContacts[0].linkedId,
      },
    });
  }

  // even after trying to fetch the primary contact from the db, if no primary contact found, then create a new contact
  if (!primaryContact) {
    if (email && phoneNumber) {
      primaryContact = await Contact.create({
        email,
        phoneNumber,
        linkPrecedence: "primary",
      });
    }
  }

  if (primaryContact) {
    // fetch all the secondary contacts for the primary contact from the db and add only if not present in secondaryContacts
    const secondaryContactIds = secondaryContacts.map((c) => c.id);
    const secondaryContactsFromDb = await Contact.findAll({
      where: {
        linkedId: primaryContact.id,
        id: {
          [Sequelize.Op.notIn]: secondaryContactIds,
        },
      },
    });
    secondaryContacts = [...secondaryContacts, ...secondaryContactsFromDb];
  }

  if (
    primaryContact.email === email &&
    primaryContact.phoneNumber === phoneNumber
  ) {
    console.log("do nothing");
  }
  // if the record not present in secondary contacts, create a new contact
  else if (
    email &&
    phoneNumber &&
    !secondaryContacts.find(
      (c) => c.email === email && c.phoneNumber === phoneNumber
    )
  ) {
    {
      const contact = await Contact.create({
        email,
        phoneNumber,
        linkPrecedence: "secondary",
        linkedId: primaryContact.id,
      });
      secondaryContacts.push(contact);
    }
  }

  return responseBuilder(primaryContact, secondaryContacts);
};

const responseBuilder = (primaryContact, secondaryContacts) => {
  const allEmailsToBeReturned = [
    primaryContact.email,
    ...secondaryContacts.map((c) => c.email),
  ].filter((email, index, self) => self.indexOf(email) === index);

  const allPhoneNumbersToBeReturned = [
    primaryContact.phoneNumber,
    ...secondaryContacts.map((c) => c.phoneNumber),
  ].filter((phoneNumber, index, self) => self.indexOf(phoneNumber) === index);

  return {
    primaryContactId: primaryContact.id,
    emails: allEmailsToBeReturned,
    phoneNumbers: allPhoneNumbersToBeReturned,
    secondaryContactIds: secondaryContacts.map((c) => c.id),
  };
};

module.exports = {
  identifyContact,
};
