const { Contact } = require("../models");
const Sequelize = require("sequelize");

const identifyContact = async ({ email, phoneNumber }) => {
  let primaryContact = null;
  let secondaryContacts = [];

  // Step 1: Find existing contacts by email or phone number
  const existingContacts = await findExistingContacts(email, phoneNumber);

  if (existingContacts.length > 0) {
    // Step 2: Segregate the contacts into primary and secondary
    const { primaryContacts, secondaryContactsList } =
      segregateContacts(existingContacts);
    secondaryContacts = secondaryContactsList;

    if (primaryContacts.length > 0) {
      primaryContact = primaryContacts[0];
      // Step 3: Update secondary contacts if there are multiple primary contacts
      secondaryContacts = await updateSecondaryContacts(
        primaryContacts,
        primaryContact.id,
        secondaryContacts
      );

      // If there are multiple primary contacts, return the response
      if (primaryContacts.length > 1) {
        return responseBuilder(primaryContact, secondaryContacts);
      }
    }
  }

  // Step 4: If no primary contact found, fetch it from secondary contacts
  if (!primaryContact && secondaryContacts.length > 0) {
    primaryContact = await fetchPrimaryContact(secondaryContacts[0].linkedId);
  }

  // Step 5: If no primary contact found, create a new primary contact
  if (!primaryContact) {
    primaryContact = await createNewPrimaryContact(email, phoneNumber);
  }

  // Step 6: Fetch secondary contacts for the primary contact from the database
  if (primaryContact) {
    secondaryContacts = await fetchSecondaryContacts(
      primaryContact,
      secondaryContacts
    );
  }

  // Step 7: Check if the primary contact matches the given email and phone number
  if (!isSameContact(primaryContact, email, phoneNumber)) {
    // Step 8: Create a new secondary contact if it doesn't already exist
    secondaryContacts = await createSecondaryContact(
      email,
      phoneNumber,
      primaryContact.id,
      secondaryContacts
    );
  }

  // Step 9: Build and return the response
  return responseBuilder(primaryContact, secondaryContacts);
};

// Helper function to find existing contacts by email or phone number
const findExistingContacts = async (email, phoneNumber) => {
  return await Contact.findAll({
    where: {
      [Sequelize.Op.or]: [{ phoneNumber }, { email }],
    },
    order: [["createdAt", "ASC"]],
  });
};

// Helper function to segregate contacts into primary and secondary
const segregateContacts = (existingContacts) => {
  const primaryContacts = existingContacts.filter(
    (contact) => contact.linkPrecedence === "primary"
  );
  const secondaryContacts = existingContacts.filter(
    (contact) => contact.linkPrecedence === "secondary"
  );

  return { primaryContacts, secondaryContactsList: secondaryContacts };
};

// Helper function to update secondary contacts and return the updated list
const updateSecondaryContacts = async (
  primaryContacts,
  primaryContactId,
  secondaryContacts
) => {
  for (let i = 1; i < primaryContacts.length; i++) {
    const contact = primaryContacts[i];
    await contact.update({
      linkPrecedence: "secondary",
      linkedId: primaryContactId,
    });
    secondaryContacts.push(contact);
  }
  return secondaryContacts;
};

// Helper function to fetch the primary contact by linkedId
const fetchPrimaryContact = async (linkedId) => {
  return await Contact.findOne({
    where: {
      id: linkedId,
    },
  });
};

// Helper function to create a new primary contact
const createNewPrimaryContact = async (email, phoneNumber) => {
  if (email && phoneNumber) {
    return await Contact.create({
      email,
      phoneNumber,
      linkPrecedence: "primary",
    });
  }
  return null;
};

// Helper function to fetch secondary contacts for a given primary contact
const fetchSecondaryContacts = async (
  primaryContact,
  existingSecondaryContacts
) => {
  const existingSecondaryContactIds = existingSecondaryContacts.map(
    (c) => c.id
  );
  const newSecondaryContacts = await Contact.findAll({
    where: {
      linkedId: primaryContact.id,
      id: {
        [Sequelize.Op.notIn]: existingSecondaryContactIds,
      },
    },
  });
  return [...existingSecondaryContacts, ...newSecondaryContacts];
};

// Helper function to check if the primary contact matches the given email and phone number
const isSameContact = (primaryContact, email, phoneNumber) => {
  return (
    primaryContact.email === email && primaryContact.phoneNumber === phoneNumber
  );
};

// Helper function to create a new secondary contact if it doesn't already exist
const createSecondaryContact = async (
  email,
  phoneNumber,
  primaryContactId,
  secondaryContacts
) => {
  if (
    email &&
    phoneNumber &&
    !secondaryContacts.find(
      (c) => c.email === email && c.phoneNumber === phoneNumber
    )
  ) {
    const contact = await Contact.create({
      email,
      phoneNumber,
      linkPrecedence: "secondary",
      linkedId: primaryContactId,
    });
    secondaryContacts.push(contact);
  }
  return secondaryContacts;
};

// Helper function to build the response object
const responseBuilder = (primaryContact, secondaryContacts) => {
  const allEmails = [
    primaryContact.email,
    ...secondaryContacts.map((c) => c.email),
  ];
  const allPhoneNumbers = [
    primaryContact.phoneNumber,
    ...secondaryContacts.map((c) => c.phoneNumber),
  ];

  const uniqueEmails = [...new Set(allEmails)];
  const uniquePhoneNumbers = [...new Set(allPhoneNumbers)];

  return {
    primaryContactId: primaryContact.id,
    emails: uniqueEmails,
    phoneNumbers: uniquePhoneNumbers,
    secondaryContactIds: secondaryContacts.map((c) => c.id),
  };
};

module.exports = {
  identifyContact,
};
