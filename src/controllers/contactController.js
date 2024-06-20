// controllers/contactController.js
const contactService = require("../services/contactService");

const identifyContact = async (req, res) => {
  try {
    const result = await contactService.identifyContact(req.body);
    res.status(200).json({ contact: result });
  } catch (error) {
    console.log("Error in identifyContact: ", error)
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  identifyContact,
};
