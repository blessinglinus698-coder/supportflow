import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface ProfileContextValue {
  name: string;
  email: string;
  photoUrl: string | null;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPhotoUrl: (url: string | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

function storageKey(agentId: string, field: "name" | "email" | "photo") {
  return `supportflow-profile-${agentId}-${field}`;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { agent } = useAuth();
  const [name, setNameState] = useState("");
  const [email, setEmailState] = useState("");
  const [photoUrl, setPhotoUrlState] = useState<string | null>(null);

  // Reload the right slice of profile data whenever the logged-in agent changes,
  // so switching accounts never shows the previous agent's name/photo.
  useEffect(() => {
    if (!agent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on logout
      setNameState("");
      setEmailState("");
      setPhotoUrlState(null);
      return;
    }
    const savedName = localStorage.getItem(storageKey(agent.id, "name"));
    const savedEmail = localStorage.getItem(storageKey(agent.id, "email"));
    const savedPhoto = localStorage.getItem(storageKey(agent.id, "photo"));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading this agent's saved profile
    setNameState(savedName || agent.name);
    setEmailState(savedEmail || agent.email);
    setPhotoUrlState(savedPhoto || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the agent actually changes
  }, [agent?.id]);

  function setName(value: string) {
    setNameState(value);
    if (agent) localStorage.setItem(storageKey(agent.id, "name"), value);
  }

  function setEmail(value: string) {
    setEmailState(value);
    if (agent) localStorage.setItem(storageKey(agent.id, "email"), value);
  }

  function setPhotoUrl(value: string | null) {
    setPhotoUrlState(value);
    if (agent) {
      if (value) {
        localStorage.setItem(storageKey(agent.id, "photo"), value);
      } else {
        localStorage.removeItem(storageKey(agent.id, "photo"));
      }
    }
  }

  return (
    <ProfileContext.Provider value={{ name, email, photoUrl, setName, setEmail, setPhotoUrl }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}