import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../lib/axios";
import { useAuthStore } from "../../store/useAuthStore";
import "./UserList.css"; // Thêm nếu cần style

const UserList = () => {
  const [users, setUsers] = useState([]); // Dữ liệu người dùng
  const [searchUser, setSearchUser] = useState(""); // Tìm kiếm người dùng
  const [isLoading, setIsLoading] = useState(true); // Trạng thái tải
  const [error, setError] = useState(null); // Trạng thái lỗi
  const { authUser } = useAuthStore(); // Lấy thông tin người dùng đã đăng nhập
  const navigate = useNavigate();

  // Kiểm tra tài khoản bị khóa
  useEffect(() => {
    if (authUser && authUser.isBlocked) {
      const confirmExit = window.confirm(
        "Tài khoản của bạn đã bị khóa. Bạn có muốn thoát khỏi trang không?"
      );
      if (confirmExit) {
        localStorage.removeItem("token"); // Xóa token khi bị khóa
        navigate("/sign-in"); // Điều hướng về trang đăng nhập
      }
    }
  }, [authUser, navigate]);

  // Gọi API để lấy danh sách người dùng
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get("/admin/getUsers");
        setUsers(response.data); // Cập nhật danh sách người dùng
      } catch (err) {
        setError(
          err.response?.data?.error || "Không thể lấy danh sách người dùng"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Hàm xử lý tìm kiếm người dùng
  const handleSearch = (e) => {
    setSearchUser(e.target.value);
  };

  // Lọc người dùng dựa trên từ khóa tìm kiếm
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.firstname.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.lastname.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  // Hàm để toggle trạng thái Block/Unblock người dùng
  const handleBlockToggle = async (userId) => {
    try {
      const response = await axiosInstance.put(`/admin/block/${userId}`);
      if (response.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId
              ? { ...user, isBlocked: response.data.user.isBlocked }
              : user
          )
        );
      }
    } catch (err) {
      console.error("Error blocking/unblocking user:", err);
      setError("Có lỗi xảy ra khi thay đổi trạng thái người dùng.");
    }
  };

  // Hiển thị trạng thái tải dữ liệu
  if (isLoading) {
    return <p>Loading users...</p>;
  }

  // Hiển thị lỗi nếu có
  if (error) {
    return <p className="error-message">Error: {error}</p>;
  }

  return (
    <div className="user-list-container">
      <h2 className="header">Danh sách người dùng</h2>
      {/* Ô tìm kiếm */}
      <input
        type="text"
        placeholder="Tìm kiếm người dùng..."
        value={searchUser}
        onChange={handleSearch}
        className="search-input"
      />

      {filteredUsers.length === 0 ? (
        <p className="empty-message">Không có người dùng nào phù hợp</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên Chính</th>
              <th>Username</th>
              <th>Email</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} className={user.isBlocked ? "blocked" : ""}>
                <td>
                  <img
                    src={user.profilePic || "https://via.placeholder.com/50"}
                    alt={`${user.username}'s avatar`}
                    className="avatar"
                  />
                </td>
                <td>{user.lastname}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  {user.isBlocked ? (
                    <span className="status blocked">Blocked</span>
                  ) : (
                    <span className="status active">Active</span>
                  )}
                </td>
                <td>
                  <button
                    className={`btn ${
                      user.isBlocked ? "btn-unblock" : "btn-block"
                    }`}
                    onClick={() => handleBlockToggle(user._id)}
                  >
                    {user.isBlocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserList;
