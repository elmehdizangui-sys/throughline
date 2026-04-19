import { useEffect, useState } from "react";
import type { ThroughlineProfile } from "@/lib/types";

export interface ProfileSettingsFormValues {
  displayName: string;
  bio: string;
}

export function ProfileSettings({
  open,
  profile,
  email,
  isSaving,
  errorMessage,
  onClose,
  onSave,
  onSignOut,
}: {
  open: boolean;
  profile: ThroughlineProfile | null;
  email?: string;
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (values: ProfileSettingsFormValues) => Promise<void>;
  onSignOut: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!open) return;
    setDisplayName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async () => {
    if (isSaving) return;
    await onSave({ displayName, bio });
  };

  return (
    <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>Profile settings</h2>
            <div className="sub">Update how your name appears in Throughline and keep personal context in your bio.</div>
            {email ? <div className="profile-email">{email}</div> : null}
          </div>
          <button className="close" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="composer-field">
            <label>Name</label>
            <input
              className="composer-input"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value.slice(0, 120))}
              placeholder="Your name"
              maxLength={120}
              autoFocus
            />
            <div className="profile-help">{displayName.trim().length}/120</div>
          </div>
          <div className="composer-field">
            <label>Bio</label>
            <textarea
              className="composer-input profile-textarea"
              value={bio}
              onChange={(event) => setBio(event.target.value.slice(0, 2000))}
              placeholder="Write anything you want to remember about yourself."
              maxLength={2000}
            />
            <div className="profile-help">{bio.length}/2000</div>
          </div>
          {errorMessage ? <div className="profile-error">{errorMessage}</div> : null}
        </div>
        <div className="composer-footer">
          <button className="cancel" onClick={onSignOut} type="button">
            Sign out
          </button>
          <button className="save-btn" onClick={submit} disabled={isSaving} type="button">
            {isSaving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
