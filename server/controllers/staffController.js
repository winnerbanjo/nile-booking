import Staff from '../models/Staff.js';
import { getMockMode, mockStaff } from '../utils/mockMode.js';

// @desc    Get all staff for merchant owner
// @route   GET /api/staff
// @access  Private (Provider)
export const getStaff = async (req, res) => {
  try {
    if (getMockMode()) {
      return res.json(mockStaff);
    }

    const staffMembers = await Staff.find({ merchant: req.user._id }).sort({ createdAt: -1 });
    res.json(staffMembers);
  } catch (error) {
    if (getMockMode()) {
      return res.json(mockStaff);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private (Provider)
export const createStaff = async (req, res) => {
  try {
    const { name, email, password, roleTitle, phone, assignedServices } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in staff name, login email, and login password' });
    }

    if (getMockMode()) {
      const newStaff = {
        _id: `staff_${Date.now()}`,
        merchant: 'mock_user_barber_id_123',
        name,
        email: email.trim().toLowerCase(),
        password,
        roleTitle: roleTitle || 'Stylist / Barber',
        phone: phone || '+234 812 000 0000',
        assignedServices: assignedServices || [],
        isActive: true,
      };
      mockStaff.unshift(newStaff);
      return res.status(201).json(newStaff);
    }

    const staff = await Staff.create({
      merchant: req.user._id,
      name,
      email: email.trim().toLowerCase(),
      password,
      roleTitle: roleTitle || 'Stylist / Barber',
      phone,
      assignedServices: assignedServices || [],
    });

    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private (Provider)
export const deleteStaff = async (req, res) => {
  try {
    if (getMockMode()) {
      const idx = mockStaff.findIndex((s) => s._id === req.params.id);
      if (idx !== -1) {
        mockStaff.splice(idx, 1);
      }
      return res.json({ message: 'Staff member removed successfully' });
    }

    await Staff.deleteOne({ _id: req.params.id, merchant: req.user._id });
    res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
