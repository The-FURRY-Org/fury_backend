const pool = require("../config/db");

const getAvailableRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT cr.*, wc.name AS waste_type, cl.location_name, cl.district, cl.address_details, u.full_name AS client_name
       FROM collection_requests cr
       JOIN waste_categories wc ON wc.id = cr.waste_category_id
       JOIN customer_locations cl ON cl.id = cr.location_id
       JOIN users u ON u.id = cr.client_id
       WHERE cr.status = 'pending'
       ORDER BY FIELD(cr.urgency, 'urgent', 'normal'), cr.created_at ASC`
    );
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch available requests", error: error.message });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const { collection_request_id } = req.body;

    if (!collection_request_id) {
      return res.status(400).json({ message: "Collection request ID is required" });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if request is still pending
      const [requests] = await connection.query(
        "SELECT id FROM collection_requests WHERE id = ? AND status = 'pending'",
        [collection_request_id]
      );

      if (!requests.length) {
        throw new Error("Collection request is not available");
      }

      // Create or update assignment for this collector
      const [existingAssignment] = await connection.query(
        "SELECT id FROM collection_assignments WHERE collection_request_id = ? AND collector_id = ?",
        [collection_request_id, req.user.id]
      );

      let assignmentId;
      if (existingAssignment.length) {
        // Update existing assignment
        await connection.query(
          "UPDATE collection_assignments SET status = 'accepted' WHERE id = ?",
          [existingAssignment[0].id]
        );
        assignmentId = existingAssignment[0].id;
      } else {
        // Create new assignment
        const [assignment] = await connection.query(
          `INSERT INTO collection_assignments
           (collection_request_id, collector_id, status)
           VALUES (?, ?, 'accepted')`,
          [collection_request_id, req.user.id]
        );
        assignmentId = assignment.insertId;
      }

      // Update collection request status to accepted
      await connection.query(
        "UPDATE collection_requests SET status = 'accepted' WHERE id = ?",
        [collection_request_id]
      );

      await connection.commit();
      res.status(201).json({ message: "Collection request accepted", assignment_id: assignmentId });
    } catch (error) {
      await connection.rollback();
      res.status(400).json({ message: error.message || "Could not accept request" });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ message: "Could not accept request", error: error.message });
  }
};

const getMyAssignments = async (req, res) => {
  try {
    const [assignments] = await pool.query(
      `SELECT ca.*, cr.description, cr.urgency, cr.estimated_bin_level, cr.photo,
              wc.name AS waste_type, cl.location_name, cl.district, cl.address_details,
              u.full_name AS client_name, u.phone AS client_phone
       FROM collection_assignments ca
       JOIN collection_requests cr ON cr.id = ca.collection_request_id
       JOIN waste_categories wc ON wc.id = cr.waste_category_id
       JOIN customer_locations cl ON cl.id = cr.location_id
       JOIN users u ON u.id = cr.client_id
       WHERE ca.collector_id = ?
       ORDER BY ca.assigned_at DESC`,
      [req.user.id]
    );
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch assignments", error: error.message });
  }
};

const updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["pending", "accepted", "in_progress", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [result] = await pool.query(
      "UPDATE collection_assignments SET status = ? WHERE id = ? AND collector_id = ?",
      [status, req.params.id, req.user.id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: "Assignment not found" });

    // Update associated collection request status
    const statusMap = {
      "in_progress": "in_progress",
      "completed": "completed",
      "cancelled": "cancelled"
    };

    if (statusMap[status]) {
      await pool.query(
        `UPDATE collection_requests cr
         JOIN collection_assignments ca ON ca.collection_request_id = cr.id
         SET cr.status = ?, cr.completed_at = NOW()
         WHERE ca.id = ?`,
        [statusMap[status], req.params.id]
      );
    }

    res.json({ message: "Assignment status updated" });
  } catch (error) {
    res.status(500).json({ message: "Could not update status", error: error.message });
  }
};

const completeAssignment = async (req, res) => {
  try {
    const { collection_notes, waste_quantity_collected } = req.body;
    const proofPhoto = req.file ? `/uploads/collection-proof/${req.file.filename}` : null;

    const [result] = await pool.query(
      `UPDATE collection_assignments
       SET status = 'completed', collection_notes = ?, waste_quantity_collected = ?, proof_photo = COALESCE(?, proof_photo), completed_at = NOW()
       WHERE id = ? AND collector_id = ?`,
      [collection_notes || null, waste_quantity_collected || null, proofPhoto, req.params.id, req.user.id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: "Assignment not found" });

    // Mark collection request as completed
    await pool.query(
      `UPDATE collection_requests cr
       JOIN collection_assignments ca ON ca.collection_request_id = cr.id
       SET cr.status = 'completed', cr.completed_at = NOW()
       WHERE ca.id = ?`,
      [req.params.id]
    );

    res.json({ message: "Collection marked as completed" });
  } catch (error) {
    res.status(500).json({ message: "Could not complete collection", error: error.message });
  }
};

const cancelAssignment = async (req, res) => {
  try {
    const { cancellation_reason } = req.body;
    if (!cancellation_reason) return res.status(400).json({ message: "Cancellation reason is required" });

    const [result] = await pool.query(
      "UPDATE collection_assignments SET status = 'cancelled', cancellation_reason = ?, completed_at = NOW() WHERE id = ? AND collector_id = ?",
      [cancellation_reason, req.params.id, req.user.id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: "Assignment not found" });

    // Mark collection request as cancelled
    await pool.query(
      `UPDATE collection_requests cr
       JOIN collection_assignments ca ON ca.collection_request_id = cr.id
       SET cr.status = 'cancelled', cr.completed_at = NOW()
       WHERE ca.id = ?`,
      [req.params.id]
    );

    res.json({ message: "Collection cancelled" });
  } catch (error) {
    res.status(500).json({ message: "Could not cancel collection", error: error.message });
  }
};

module.exports = {
  getAvailableRequests,
  acceptRequest,
  getMyAssignments,
  updateAssignmentStatus,
  completeAssignment,
  cancelAssignment
};
