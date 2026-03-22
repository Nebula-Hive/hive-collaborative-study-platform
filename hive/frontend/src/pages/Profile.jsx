import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import { getMyProfile, updateMyProfile } from "@/services";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { refreshAuthUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getMyProfile();
      setProfile(data);
      setName(data?.name || "");
    } catch (error) {
      Notification.error(error?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const nameChanged = trimmedName && trimmedName !== (profile?.name || "");
    const passwordProvided = !!password;

    if (!nameChanged && !passwordProvided) {
      Notification.warning("No changes to save");
      return;
    }

    if (passwordProvided) {
      if (password.length < 6) {
        Notification.error("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        Notification.error("Passwords do not match");
        return;
      }
    }

    setSaving(true);
    try {
      const result = await updateMyProfile({
        name: nameChanged ? trimmedName : undefined,
        password: passwordProvided ? password : undefined,
      });

      Notification.success("Profile updated successfully");
      if (result?.warning) {
        Notification.warning(result.warning);
      }

      // Keep navbar/profile icon data in sync with updated Firebase displayName.
      try {
        await refreshAuthUser();
      } catch (refreshErr) {
        console.warn('Auth refresh failed (non-critical):', refreshErr);
      }

      setProfile(result?.user || profile);
      setName(result?.user?.name || trimmedName);
      setPassword("");
      setConfirmPassword("");

      navigate("/");
    } catch (error) {
      Notification.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="Edit Profile" subtitle="Update your name and password">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="form-label">Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Email</label>
            <input
              type="text"
              className="form-control"
              value={profile?.email || ""}
              readOnly
              disabled
            />
          </div>

          <div>
            <label className="form-label">Student Number</label>
            <input
              type="text"
              className="form-control"
              value={profile?.studentNumber || "-"}
              readOnly
              disabled
            />
          </div>

          <div>
            <label className="form-label">New Password</label>
            <input
              type="password"
              placeholder="Leave blank if you don't want to change"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              text="Save Changes"
              className="btn-primary"
              isLoading={saving}
            />
          </div>
        </form>
      </Card>
    </div>
  );
}
