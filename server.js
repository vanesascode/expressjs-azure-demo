const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const CONTACTS_FILE = path.join(__dirname, "contacts.json");

// Middleware
app.use(cors());
app.use(express.json());

// Helper functions for JSON file handling
async function readContacts() {
  try {
    const data = await fs.readFile(CONTACTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading contacts file:", error);
    return [];
  }
}

async function writeContacts(contacts) {
  try {
    await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing contacts file:", error);
    return false;
  }
}

// Function to generate a new unique ID
function generateNewId(contacts) {
  const maxId = contacts.reduce((max, contact) => {
    return contact.id > max ? contact.id : max;
  }, 0);
  return maxId + 1;
}

// Function to validate contact structure
function validateContact(contact, isCreating = false) {
  // Only name is required for both creating and editing
  const requiredFields = ["name"];
  const missingFields = requiredFields.filter((field) => !contact[field]);

  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    };
  }

  // Validate basic email format if provided
  if (contact.email && contact.email.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      return { isValid: false, message: "Invalid email format" };
    }
  }

  return { isValid: true };
}

// Function to apply filters to contacts
function applyFilters(contacts, filters) {
  if (!filters || filters.length === 0) {
    return contacts;
  }

  return contacts.filter((contact) => {
    return filters.every((filter) => {
      const { field, value, operator = "contains" } = filter;
      const contactValue = contact[field];

      if (contactValue == null) return false;

      const contactStr = contactValue.toString().toLowerCase();
      const filterStr = value.toString().toLowerCase();

      switch (operator) {
        case "equals":
          return contactStr === filterStr;
        case "contains":
          return contactStr.includes(filterStr);
        case "startsWith":
          return contactStr.startsWith(filterStr);
        case "endsWith":
          return contactStr.endsWith(filterStr);
        default:
          return contactStr.includes(filterStr);
      }
    });
  });
}

// Function to apply sorting to contacts
function applySorting(contacts, sortArray) {
  if (!sortArray || sortArray.length === 0) {
    return contacts;
  }

  const sortedContacts = [...contacts];

  // Apply sorts in reverse order for multiple field sorting
  for (let i = sortArray.length - 1; i >= 0; i--) {
    const { field, direction = "asc" } = sortArray[i];

    sortedContacts.sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Handle null/undefined values
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Convert to string for comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      return direction === "desc" ? comparison * -1 : comparison;
    });
  }

  return sortedContacts;
}

// Function to process contacts with new paginated request structure
function processContactsRequest(contacts, params) {
  const {
    skip = 0,
    take = null, // null means return all
    filters = [],
    sort = [],
  } = params;

  // Apply filters first
  let filteredContacts = applyFilters(contacts, filters);

  // Apply sorting
  let sortedContacts = applySorting(filteredContacts, sort);

  // Apply pagination
  const skipNum = Math.max(0, parseInt(skip) || 0);
  const totalFiltered = sortedContacts.length;

  let paginatedContacts;
  let takeNum;

  if (take === null || take === "" || take === undefined) {
    // Return all contacts if take is not specified
    paginatedContacts = sortedContacts.slice(skipNum);
    takeNum = totalFiltered - skipNum;
  } else {
    takeNum = Math.max(1, parseInt(take) || 10);
    // If take is very large (>1000), return all
    if (takeNum > 1000) {
      paginatedContacts = sortedContacts.slice(skipNum);
      takeNum = totalFiltered - skipNum;
    } else {
      paginatedContacts = sortedContacts.slice(skipNum, skipNum + takeNum);
    }
  }

  return {
    data: paginatedContacts,
    pagination: {
      skip: skipNum,
      take: takeNum,
      total: totalFiltered,
      totalAll: contacts.length,
      hasNext: skipNum + takeNum < totalFiltered,
      hasPrev: skipNum > 0,
    },
    filters: filters,
    sort: sort,
  };
}

// Function to filter contacts based on search term
function filterContacts(contacts, searchTerm) {
  if (!searchTerm || searchTerm.trim() === "") {
    return contacts;
  }

  const searchLower = searchTerm.trim().toLowerCase();
  console.log(
    `🔍 Searching for: "${searchLower}" in ${contacts.length} contacts`
  );

  const filteredContacts = contacts.filter((contact) => {
    // Search in: id, name, email, company, phone1, phone2
    const searchableFields = [
      contact.id?.toString() || "",
      contact.name || "",
      contact.email || "",
      contact.company || "",
      contact.phone1 || "",
      contact.phone2 || "",
    ];

    const matches = searchableFields.some((field) =>
      field.toLowerCase().includes(searchLower)
    );

    if (matches) {
      console.log(`✅ Match found in contact ${contact.id}: ${contact.name}`);
    }

    return matches;
  });

  console.log(`📊 Search results: ${filteredContacts.length} contacts found`);
  return filteredContacts;
}

// ENDPOINTS

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

// GET /contacts - Get paginated contacts with new structure OR get specific contact by ID
app.get("/contacts", async (req, res) => {
  try {
    const contacts = await readContacts();

    // Check if this is a request for a specific contact by ID
    const { id } = req.query;
    if (id !== undefined) {
      const contactId = parseInt(id);
      if (isNaN(contactId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contact ID provided",
        });
      }

      const contact = contacts.find((c) => c.id === contactId);
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Contact not found",
        });
      }

      return res.json({
        success: true,
        data: contact,
      });
    }

    // Otherwise, handle as paginated query
    // Parse query parameters according to new structure
    const {
      skip = 0,
      take = null,
      filters: filtersParam = "[]",
      sort: sortParam = "[]",
      // Legacy support for search parameter
      search = "",
    } = req.query;

    // Parse filters and sort from JSON strings
    let filters = [];
    let sort = [];

    try {
      if (filtersParam && filtersParam !== "[]") {
        filters = JSON.parse(filtersParam);
      }
    } catch (e) {
      console.warn("Invalid filters parameter:", filtersParam);
    }

    try {
      if (sortParam && sortParam !== "[]") {
        sort = JSON.parse(sortParam);
      }
    } catch (e) {
      console.warn("Invalid sort parameter:", sortParam);
    }

    // Legacy support: if search parameter is provided, use multi-field search
    let searchFilteredContacts = contacts;
    if (search && search.trim() !== "") {
      searchFilteredContacts = filterContacts(contacts, search);
    }

    // Process the request with pre-filtered contacts
    const result = processContactsRequest(searchFilteredContacts, {
      skip,
      take,
      filters,
      sort,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      filters: result.filters,
      sort: result.sort,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving contacts",
      error: error.message,
      data: [],
      pagination: {
        skip: 0,
        take: 0,
        total: 0,
        totalAll: 0,
        hasNext: false,
        hasPrev: false,
      },
      filters: [],
      sort: [],
    });
  }
});

// POST /contacts - Handle both contact creation and paginated queries
app.post("/contacts", async (req, res) => {
  try {
    // Check if this is a paginated query request or contact creation
    const { skip, take, filters, sort, name, email } = req.body;

    // If skip, take, filters, or sort are present, treat as paginated query
    if (
      skip !== undefined ||
      take !== undefined ||
      filters !== undefined ||
      sort !== undefined
    ) {
      // This is a paginated query request
      const contacts = await readContacts();

      // Use the body parameters directly
      const queryParams = {
        skip: skip || 0,
        take: take || null,
        filters: filters || [],
        sort: sort || [],
      };

      // Process the request
      const result = processContactsRequest(contacts, queryParams);

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        filters: result.filters,
        sort: result.sort,
      });
    }

    // Otherwise, treat as contact creation
    const newContact = req.body;

    // Validate the contact (for creation, only name is required)
    const validation = validateContact(newContact, true);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const contacts = await readContacts();

    // Check if email already exists (only if email is provided)
    if (newContact.email && newContact.email.trim() !== "") {
      const emailExists = contacts.some(
        (contact) => contact.email === newContact.email
      );
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "A contact with this email already exists",
        });
      }
    }

    // Assign a new ID
    newContact.id = generateNewId(contacts);

    // Add the contact to the array
    contacts.push(newContact);

    // Save to file
    const saveSuccess = await writeContacts(contacts);
    if (!saveSuccess) {
      return res.status(500).json({
        success: false,
        message: "Error saving contact",
      });
    }

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: newContact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing request",
      error: error.message,
    });
  }
});

// PUT /contacts - Update a contact (ID in body)
app.put("/contacts", async (req, res) => {
  try {
    const updatedContact = req.body;
    const { id: contactId } = updatedContact;

    // Validate that ID is provided
    if (!contactId || isNaN(parseInt(contactId))) {
      return res.status(400).json({
        success: false,
        message: "Valid contact ID is required in the request body",
      });
    }

    const numericContactId = parseInt(contactId);

    // Validate the updated contact (only name required)
    const validation = validateContact(updatedContact, false);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const contacts = await readContacts();
    const contactIndex = contacts.findIndex((c) => c.id === numericContactId);

    if (contactIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Check if email already exists in another contact (only if email is provided)
    if (updatedContact.email) {
      const emailExists = contacts.some(
        (contact) =>
          contact.email === updatedContact.email &&
          contact.id !== numericContactId
      );
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "A contact with this email already exists",
        });
      }
    }

    // Ensure ID remains the same
    updatedContact.id = numericContactId;
    contacts[contactIndex] = updatedContact;

    // Save to file
    const saveSuccess = await writeContacts(contacts);
    if (!saveSuccess) {
      return res.status(500).json({
        success: false,
        message: "Error updating contact",
      });
    }

    res.json({
      success: true,
      message: "Contact updated successfully",
      data: updatedContact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating contact",
      error: error.message,
    });
  }
});

// DELETE /contacts - Delete single contact (with query id) or multiple contacts (with body ids)
app.delete("/contacts", async (req, res) => {
  try {
    const { id } = req.query;
    const { ids } = req.body;

    // Check if this is a single contact deletion (query parameter)
    if (id !== undefined) {
      const contactId = parseInt(id);
      if (isNaN(contactId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contact ID provided",
        });
      }

      const contacts = await readContacts();
      const contactIndex = contacts.findIndex((c) => c.id === contactId);

      if (contactIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Contact not found",
        });
      }

      const deletedContact = contacts[contactIndex];
      contacts.splice(contactIndex, 1);

      // Save to file
      const saveSuccess = await writeContacts(contacts);
      if (!saveSuccess) {
        return res.status(500).json({
          success: false,
          message: "Error deleting contact",
        });
      }

      return res.json({
        success: true,
        message: "Contact deleted successfully",
        data: deletedContact,
      });
    }

    // Otherwise, handle multiple contact deletion (body ids)
    // Validate that IDs are provided
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Either 'id' query parameter for single deletion or 'ids' array in body for multiple deletion is required",
      });
    }

    // Validate that all IDs are valid numbers
    const validIds = ids
      .filter((id) => {
        const numId = parseInt(id);
        return !isNaN(numId) && numId > 0;
      })
      .map((id) => parseInt(id));

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid IDs provided",
      });
    }

    const contacts = await readContacts();
    const deletedContacts = [];
    const notFoundIds = [];

    // Find contacts to delete
    validIds.forEach((id) => {
      const contactIndex = contacts.findIndex((c) => c.id === id);
      if (contactIndex !== -1) {
        deletedContacts.push(contacts[contactIndex]);
      } else {
        notFoundIds.push(id);
      }
    });

    if (deletedContacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No contacts found with the provided IDs",
        notFoundIds: notFoundIds,
      });
    }

    // Delete contacts (filter out contacts with matching IDs)
    const remainingContacts = contacts.filter(
      (contact) => !validIds.includes(contact.id)
    );

    // Save to file
    const saveSuccess = await writeContacts(remainingContacts);
    if (!saveSuccess) {
      return res.status(500).json({
        success: false,
        message: "Error deleting contacts",
      });
    }

    res.json({
      success: true,
      message: `${deletedContacts.length} contact(s) deleted successfully`,
      data: {
        deletedContacts: deletedContacts,
        deletedCount: deletedContacts.length,
        notFoundIds: notFoundIds.length > 0 ? notFoundIds : undefined,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting contacts",
      error: error.message,
    });
  }
});

// 404 error handling middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// General error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Endpoints available:`);
  console.log(
    `   GET    /contacts           - Get all contacts (paginated) or specific contact (?id=X)`
  );
  console.log(
    `   POST   /contacts           - Create new contact or paginated query`
  );
  console.log(`   PUT    /contacts           - Update contact (ID in body)`);
  console.log(
    `   DELETE /contacts           - Delete single contact (?id=X) or multiple contacts (ids in body)`
  );
});

module.exports = app;
