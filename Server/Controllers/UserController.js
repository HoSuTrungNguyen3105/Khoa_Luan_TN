import cloudinary from "../lib/cloudinary.js";
import ContractModel from "../Models/contractModel.js";
import Notification from "../Models/notificationModel.js";
import PostModel from "../Models/postModel.js";
import UserModel from "../Models/userModel.js";
import bcrypt from "bcryptjs";

export const getUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await UserModel.findById(id);
    if (user) {
      const { password, ...otherDetail } = user._doc;
      res.status(200).json(otherDetail);
      res.status(200).json(user); // Trả về toàn bộ dữ liệu user, bao gồm cả mật khẩu
    } else {
      res.status(404).json("User not found");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

// Get a User by ID
export const getUserProfile = async (req, res) => {
  const { userId } = req.params; // Lấy userId từ params
  try {
    const user = await UserModel.findById(userId);

    if (user) {
      const { password, ...otherDetails } = user._doc;
      res.status(200).json(otherDetails); // Trả về thông tin người dùng (không bao gồm mật khẩu)
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user profile" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const { currentUserId, currentUserAdminStatus } = req.body;

  if (currentUserId === id || currentUserAdminStatus) {
    try {
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json("User not found");
      }

      // Thực hiện xóa
      await UserModel.findByIdAndDelete(id);
      res.status(200).json("User deleted successfully");
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    res.status(403).json("Forbidden: Access denied");
  }
};

export const followUser = async (req, res) => {
  const userId = req.params.id; // Lấy userId từ URL (người dùng được follow)
  const { _id } = req.body; // Lấy ID người theo dõi từ body (người follow)

  if (!userId || !_id) {
    return res.status(400).json({ message: "Missing user IDs" });
  }

  try {
    // Tìm người dùng được follow
    const followUser = await UserModel.findById(userId);
    // Tìm người dùng đang follow
    const followingUser = await UserModel.findById(_id);

    if (!followUser) {
      return res
        .status(404)
        .json({ message: "Người dùng không tìm thấy hoặc đã xóa tài khoản" });
    }

    if (!followingUser) {
      return res.status(404).json({ message: "Người theo dõi không tìm thấy" });
    }

    if (!followUser.followers.includes(_id)) {
      // Cập nhật danh sách followers và following
      await followUser.updateOne({ $push: { followers: _id } });
      await followingUser.updateOne({ $push: { following: userId } });

      // Tạo thông báo cho người được follow
      const notification = new Notification({
        userId: userId, // Người nhận thông báo
        senderId: _id, // Người gửi thông báo (người follow)
        message: `${followingUser.username} đã follow bạn`, // Nội dung thông báo
        type: "follow",
      });
      await notification.save();

      return res.status(200).json({
        message: "Follow successful and notification created",
        data: notification,
      });
    } else {
      // Nếu người dùng đã theo dõi
      return res.status(403).json({ message: "Bạn đã theo dõi người này rồi" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params; // userId là ID của người dùng muốn lấy thông báo

    // Lấy tất cả thông báo cho người dùng
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 }) // Sắp xếp thông báo mới nhất lên đầu
      .limit(10); // Giới hạn 10 thông báo gần nhất

    return res.status(200).json({
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error in fetching notifications" });
  }
};
// Controller bỏ theo dõi user
export const unfollowUser = async (req, res) => {
  const id = req.params.id;
  const { _id } = req.body;

  if (_id === id) {
    return res.status(403).json({ message: "Bạn ko thể unfollow chính mình" });
  }

  try {
    const followUser = await UserModel.findById(id);
    const followingUser = await UserModel.findById(_id);

    if (followUser.followers.includes(_id)) {
      await followUser.updateOne({ $pull: { followers: _id } });
      await followingUser.updateOne({ $pull: { following: id } });

      return res.status(200).json({ message: "Bỏ theo dõi thành công!" });
    } else {
      return res.status(403).json({ message: "Bạn chưa theo dõi người này!" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to unfollow the user!" });
  }
};
// Kiểm tra trạng thái follow giữa hai người dùng
export const fetchFollowingStatus = async (req, res) => {
  const { currentUserId } = req.query; // Lấy currentUserId từ query
  const { targetUserId } = req.params; // Lấy targetUserId từ params

  try {
    // Kiểm tra nếu cả hai userId được truyền
    if (!currentUserId || !targetUserId) {
      return res.status(400).send({ message: "Missing parameters" });
    }

    // Tìm user được theo dõi
    const targetUser = await UserModel.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found." });
    }

    // Kiểm tra currentUserId có trong danh sách followers không
    const isFollowing = targetUser.followers.includes(currentUserId);

    return res.status(200).json({ isFollowing }); // Trả về trạng thái follow
  } catch (error) {
    console.error("Error fetching follow status:", error);
    return res
      .status(500)
      .json({ message: "Lỗi user đã xóa tài khoản hoặc không kết nối được." });
  }
};
export const searchUser = async (req, res) => {
  try {
    const query = req.query.q || "";
    const users = await UserModel.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { firstname: { $regex: query, $options: "i" } },
        { lastname: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi tìm kiếm người dùng" });
  }
};
export const searchPost = async (req, res) => {
  try {
    const query = req.query.q || "";
    const posts = await PostModel.find({
      desc: { $regex: query, $options: "i" },
    }).populate("userId", "username profilePic");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi tìm kiếm bài đăng" });
  }
};
export const rewardPoint = async (req, res) => {
  const { userId, points } = req.body;
  try {
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    user.points += points;
    await user.save();

    res.json({ message: "Cộng điểm thành công!", points: user.points });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
export const contract = async (req, res) => {
  try {
    const { finderId, loserId, images } = req.body;

    // Kiểm tra xem finderId và loserId có hợp lệ không
    const finder = await UserModel.findById(finderId);
    const loser = await UserModel.findById(loserId);

    if (!finder || !loser) {
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    // Tạo hợp đồng mới
    const newContract = new ContractModel({
      finder: finderId,
      loser: loserId,
      image: images || [],
      status: "pending",
    });

    // Lưu hợp đồng vào database
    await newContract.save();

    res.status(201).json({
      status: "Success",
      message: "Hợp đồng đã được tạo.",
      data: newContract,
    });
  } catch (error) {
    console.error("Lỗi khi tạo hợp đồng:", error);
    res.status(500).json({ message: "Lỗi khi tạo hợp đồng." });
  }
};
const handleImageUpload = async (images) => {
  const imageUrls = [];

  for (let i = 0; i < images.length; i++) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(images[i], {
        resource_type: "auto", // Tự động nhận dạng loại tệp
      });
      imageUrls.push(uploadResponse.secure_url); // Lưu URL của ảnh vào mảng
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      throw new Error("Có lỗi xảy ra khi upload ảnh");
    }
  }

  return imageUrls;
};
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user._id;

  // Kiểm tra xem mật khẩu cũ và mới đã được nhập đầy đủ chưa
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
  }

  // Kiểm tra độ dài của mật khẩu mới
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
  }

  try {
    // Tìm người dùng trong cơ sở dữ liệu
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
    }

    // Băm mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu mới
    user.password = hashedPassword;
    await user.save();

    // Trả về thông báo thành công
    res.status(200).json({ message: "Mật khẩu đã được thay đổi thành công" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Có lỗi xảy ra khi thay đổi mật khẩu" });
  }
};
