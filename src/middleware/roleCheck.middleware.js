// middleware/roleCheck.js
// Middleware for checking user roles

// Middleware to check if user is a company
const isCompany = (req, res, next) => {
  if (req.user.role !== 'Company') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Company role required',
    });
  }
  next();
};

// Middleware to check if user is a professional
const isProfessional = (req, res, next) => {
  if (req.user.role !== 'Professional') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Professional role required',
    });
  }
  next();
};

// Middleware to check if user is a customer
const isCustomer = (req, res, next) => {
  if (req.user.role !== 'Customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Customer role required',
    });
  }
  next();
};

// Middleware to check if user is an admin
// Assuming admin is flagged in the company schema with isAdmin=true
const isAdmin = (req, res, next) => {
  if (req.role !== 'Company' || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin role required',
    });
  }
  next();
};

export { isCompany, isProfessional, isCustomer, isAdmin };
