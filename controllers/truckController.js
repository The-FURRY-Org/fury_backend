const pool = require("../config/db");

const getManagerCompanyId = async (managerId) => {
  const [companies] = await pool.query("SELECT id FROM waste_companies WHERE manager_id = ?", [managerId]);
  return companies[0]?.id;
};

const createTruck = async (req, res) => {
  try {
    const { truck_number_plate, truck_capacity, driver_id, status = "active" } = req.body;
    const companyId = await getManagerCompanyId(req.user.id);

    if (!companyId) {
      return res.status(400).json({ message: "You must create a company profile before adding trucks" });
    }

    if (!truck_number_plate) {
      return res.status(400).json({ message: "Truck number plate is required" });
    }

    const allowedStatuses = ["active", "maintenance", "inactive"];
    const normalizedStatus = status ? status.toLowerCase() : "active";

    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: `Status must be one of: ${allowedStatuses.join(", ")}` });
    }

    let parsedCapacity = null;
    if (truck_capacity !== undefined && truck_capacity !== null && truck_capacity !== "") {
      parsedCapacity = Number(truck_capacity);
      if (Number.isNaN(parsedCapacity)) {
        return res.status(400).json({ message: "Truck capacity must be a numeric value" });
      }
    }

    let driverIdValue = null;
    if (driver_id !== undefined && driver_id !== null && driver_id !== "") {
      const [drivers] = await pool.query(
        "SELECT id FROM users WHERE id = ? AND role = 'collector' AND status = 'active'",
        [driver_id]
      );
      if (!drivers.length) {
        return res.status(400).json({ message: "Collector ID must belong to an active collector" });
      }
      driverIdValue = driver_id;
    }

    const [result] = await pool.query(
      "INSERT INTO trucks (company_id, truck_number_plate, truck_capacity, driver_id, status) VALUES (?, ?, ?, ?, ?)",
      [companyId, truck_number_plate, parsedCapacity, driverIdValue, normalizedStatus]
    );

    res.status(201).json({ message: "Truck created", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not create truck", error: error.message });
  }
};

const getCompanyTrucks = async (req, res) => {
  const companyId = await getManagerCompanyId(req.user.id);
  if (!companyId) return res.json([]);

  const [trucks] = await pool.query(
    `SELECT t.*, u.full_name AS driver_name
     FROM trucks t
     LEFT JOIN users u ON u.id = t.driver_id
     WHERE t.company_id = ?
     ORDER BY t.created_at DESC`,
    [companyId]
  );
  res.json(trucks);
};

const updateTruck = async (req, res) => {
  const { truck_number_plate, truck_capacity, driver_id, status } = req.body;
  const companyId = await getManagerCompanyId(req.user.id);

  const [result] = await pool.query(
    `UPDATE trucks
     SET truck_number_plate = ?, truck_capacity = ?, driver_id = ?, status = ?
     WHERE id = ? AND company_id = ?`,
    [truck_number_plate, truck_capacity || null, driver_id || null, status || "active", req.params.id, companyId]
  );

  if (!result.affectedRows) return res.status(404).json({ message: "Truck not found" });
  res.json({ message: "Truck updated" });
};

const deleteTruck = async (req, res) => {
  const companyId = await getManagerCompanyId(req.user.id);
  const [result] = await pool.query("DELETE FROM trucks WHERE id = ? AND company_id = ?", [req.params.id, companyId]);
  if (!result.affectedRows) return res.status(404).json({ message: "Truck not found" });
  res.json({ message: "Truck deleted" });
};

module.exports = { createTruck, getCompanyTrucks, updateTruck, deleteTruck };
