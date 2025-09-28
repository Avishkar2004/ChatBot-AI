import User from "../models/User.js";

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch user from database to get latest data
    const user = await User.findById(userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    console.error('Get current user error:', err);
    return res.status(500).json({ 
      message: "Failed to fetch user profile", 
      error: err.message 
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;
    
    // Check if username or email already exists (excluding current user)
    if (username) {
      const existingUsername = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      if (existingUsername) {
        return res.status(409).json({ message: "Username already in use" });
      }
    }
    
    if (email) {
      const existingEmail = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      if (existingEmail) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    // Update user
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, select: '-passwordHash' }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ 
      message: "Failed to update profile", 
      error: err.message 
    });
  }
};

// Delete user account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ 
      message: "Failed to delete account", 
      error: err.message 
    });
  }
};
