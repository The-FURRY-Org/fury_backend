const pool = require("../config/db");

const getManagerCompanyId = async (managerId) => {
  const [companies] = await pool.query("SELECT id FROM waste_companies WHERE manager_id = ?", [managerId]);
  return companies[0]?.id;
};

const createCompany = async (req, res) => {
  try {
    const { company_name, phone, email, district, address } = req.body;

    if (!company_name || !district) {
      return res.status(400).json({ message: "Company name and district are required" });
    }

    const [existing] = await pool.query("SELECT id FROM waste_companies WHERE manager_id = ?", [req.user.id]);
    if (existing.length) {
      return res.status(409).json({ message: "This manager already has a company profile" });
    }

    const [result] = await pool.query(
      "INSERT INTO waste_companies (manager_id, company_name, phone, email, district, address) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, company_name, phone || null, email || null, district, address || null]
    );

    res.status(201).json({ message: "Company profile created", id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: "Could not create company", error: error.message });
  }
};

const getMyCompany = async (req, res) => {
  const [companies] = await pool.query("SELECT * FROM waste_companies WHERE manager_id = ?", [req.user.id]);
  if (!companies.length) return res.status(404).json({ message: "Company profile not found" });
  res.json(companies[0]);
};

const updateCompany = async (req, res) => {
  const { company_name, phone, email, district, address, status } = req.body;
  const [result] = await pool.query(
    `UPDATE waste_companies
     SET company_name = ?, phone = ?, email = ?, district = ?, address = ?, status = COALESCE(?, status)
     WHERE id = ? AND manager_id = ?`,
    [company_name, phone || null, email || null, district, address || null, status || null, req.params.id, req.user.id]
  );

  if (!result.affectedRows) return res.status(404).json({ message: "Company not found" });
  res.json({ message: "Company updated" });
};

const getCompanyCollectors = async (req, res) => {
  const companyId = await getManagerCompanyId(req.user.id);
  if (!companyId) return res.json({ collectors: [] });

  const [collectors] = await pool.query(
    `SELECT DISTINCT u.id, u.full_name, u.email, u.phone, u.status, u.last_login
     FROM users u
     JOIN trucks t ON t.driver_id = u.id
     WHERE t.company_id = ? AND u.role = 'collector'
     ORDER BY u.full_name ASC`,
    [companyId]
  );

  res.json({ collectors, collector_count: collectors.length });
};

const getCompanyCustomers = async (req, res) => {
  const companyId = await getManagerCompanyId(req.user.id);
  if (!companyId) return res.json({ customers: [] });

  const [customers] = await pool.query(
    `SELECT DISTINCT u.id, u.full_name, u.email, u.phone, u.status
     FROM users u
     JOIN pickup_requests pr ON pr.customer_id = u.id
     JOIN pickup_assignments pa ON pa.pickup_request_id = pr.id
     WHERE pa.company_id = ? AND u.role = 'client'
     ORDER BY u.full_name ASC`,
    [companyId]
  );

  res.json({ customers, customer_count: customers.length });
};

const getCompanyDashboard = async (req, res) => {
  const companyId = await getManagerCompanyId(req.user.id);
  if (!companyId) {
    return res.json({ collectors: [], customers: [], collector_count: 0, customer_count: 0, collector_logins: [] });
  }

  const [collectors] = await pool.query(
    `SELECT DISTINCT u.id, u.full_name, u.email, u.phone, u.status, u.last_login
     FROM users u
     JOIN trucks t ON t.driver_id = u.id
     WHERE t.company_id = ? AND u.role = 'collector'`,
    [companyId]
  );

  const [customers] = await pool.query(
    `SELECT DISTINCT u.id, u.full_name, u.email, u.phone, u.status
     FROM users u
     JOIN pickup_requests pr ON pr.customer_id = u.id
     JOIN pickup_assignments pa ON pa.pickup_request_id = pr.id
     WHERE pa.company_id = ? AND u.role = 'client'`,
    [companyId]
  );

  const [collectorLogins] = await pool.query(
    `SELECT al.id, al.user_id, u.full_name, u.email, al.details, al.created_at
     FROM audit_logs al
     JOIN users u ON u.id = al.user_id
     JOIN trucks t ON t.driver_id = u.id
     WHERE al.action = 'collector_login' AND t.company_id = ?
     ORDER BY al.created_at DESC
     LIMIT 20`,
    [companyId]
  );

  res.json({
    collectors,
    collector_count: collectors.length,
    customers,
    customer_count: customers.length,
    collector_logins: collectorLogins
  });
};

const getCollectorLoginEvents = async (req, res) => {
  const companyId = await getManagerCompanyId(req.user.id);
  if (!companyId) return res.json({ logins: [] });

  const [logins] = await pool.query(
    `SELECT al.id, al.user_id, u.full_name, u.email, al.details, al.created_at
     FROM audit_logs al
     JOIN users u ON u.id = al.user_id
     JOIN trucks t ON t.driver_id = u.id
     WHERE al.action = 'collector_login' AND t.company_id = ?
     ORDER BY al.created_at DESC
     LIMIT 50`,
    [companyId]
  );

  res.json({ logins });
};

const deleteCollector = async (req, res) => {
  const companyId = await getManagerCompanyId(req.user.id);
  if (!companyId) {
    return res.status(400).json({ message: "You must create a company profile before deleting collectors" });
  }

  const driverId = req.params.id;
  const [collectors] = await pool.query(
    `SELECT u.id
     FROM users u
     JOIN trucks t ON t.driver_id = u.id
     WHERE u.id = ? AND u.role = 'collector' AND t.company_id = ?`,
    [driverId, companyId]
  );

  if (!collectors.length) {
    return res.status(404).json({ message: "Collector not found or not assigned to your company" });
  }

  const [assignments] = await pool.query(
    `SELECT id FROM pickup_assignments WHERE driver_id = ? AND status IN ('assigned', 'on_the_way')`,
    [driverId]
  );
  if (assignments.length) {
    return res.status(409).json({ message: "Collector cannot be deleted while they have active pickup assignments" });
  }

  const [result] = await pool.query("DELETE FROM users WHERE id = ? AND role = 'collector'", [driverId]);
  if (!result.affectedRows) {
    return res.status(404).json({ message: "Collector not found" });
  }

  res.json({ message: "Collector deleted" });
};

module.exports = { createCompany, getMyCompany, updateCompany, getCompanyCollectors, getCompanyCustomers, getCompanyDashboard, getCollectorLoginEvents, deleteCollector };
